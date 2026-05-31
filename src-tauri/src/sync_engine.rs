use anyhow::{Context, Result};
use base64::engine::{general_purpose, Engine};
use chrono::{DateTime, Utc, NaiveDateTime};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use sqlx::{Row, Column, SqlitePool, TypeInfo, Transaction};
use std::collections::HashMap;
use std::fmt;
use std::io::{self, Write};
use url::Url;
use std::collections::HashSet;
use std::sync::Mutex;
use once_cell::sync::Lazy;


static COLUMN_CACHE: Lazy<Mutex<HashMap<String, HashSet<String>>>> = Lazy::new(|| Mutex::new(HashMap::new()));
// -----------------------------------------------------------------------------
// Sync status enum
// -----------------------------------------------------------------------------
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SyncStatus {
    Synced,
    Created,
    Updated,
    Deleted,
}

impl fmt::Display for SyncStatus {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let value = match self {
            SyncStatus::Synced => "synced",
            SyncStatus::Created => "created",
            SyncStatus::Updated => "updated",
            SyncStatus::Deleted => "deleted",
        };
        write!(f, "{}", value)
    }
}

impl From<&str> for SyncStatus {
    fn from(s: &str) -> Self {
        match s {
            "synced" => SyncStatus::Synced,
            "created" => SyncStatus::Created,
            "updated" => SyncStatus::Updated,
            "deleted" => SyncStatus::Deleted,
            _ => SyncStatus::Synced,
        }
    }
}

// -----------------------------------------------------------------------------
// Data structures for sync protocol
// -----------------------------------------------------------------------------
#[derive(Debug, Serialize, Deserialize)]
pub struct SyncChanges {
    pub created: Vec<serde_json::Value>,
    pub updated: Vec<serde_json::Value>,
    pub deleted: Vec<String>, // UUIDs
    pub has_more: Option<bool>,       
    pub current_page: Option<i32>,   
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PullResponse {
    pub changes: HashMap<String, SyncChanges>,
    pub timestamp: i64, // server's latest change timestamp (Unix seconds)
}

// -----------------------------------------------------------------------------
// SyncEngine
// -----------------------------------------------------------------------------
pub struct SyncEngine {
    db: SqlitePool,
    client: Client,
    api_url: String,
    tables: Vec<String>, // list of table names to sync (e.g., ["tenants", "contacts"])
}

impl SyncEngine {
    pub fn new(db: SqlitePool, api_url: String, tables: Vec<String>) -> Self {
        Self {
            db,
            client: Client::new(),
            api_url,
            tables,
        }
    }

    // -------------------------------------------------------------------------
    // Public: sync all tables
    // -------------------------------------------------------------------------
    pub async fn synchronize(&self, jwt: &str, tenant_uuid: &str, last_pulled_at: Option<i64>) -> Result<i64> {
    // Disable foreign key constraints for this sync operation
    sqlx::query("PRAGMA foreign_keys = OFF;")
        .execute(&self.db)
        .await
        .context("Failed to disable foreign keys")?;
    
    let mut current_page = 1;
    let mut final_timestamp = 0;

        loop {
            // 1. Pull the specific page
            let pull_response = self.pull_remote_changes(jwt, tenant_uuid, last_pulled_at, Some(current_page)).await?;
            
            // Use the timestamp from the first page as the anchor for the next sync
            if current_page == 1 {
                final_timestamp = pull_response.timestamp;
            }

            // 2. Apply changes immediately for this page
            self.apply_remote_changes(&pull_response.changes).await?;

            // 3. Check if any table in the response has more pages
            let any_more = pull_response.changes.values().any(|c| c.has_more.unwrap_or(false));
            
            if !any_more {
                break; // Exit loop if all tables are exhausted
            }
            
            current_page += 1;
        }

        // 4. Handle pushing local changes (same as before)
        let local_changes = self.collect_local_changes().await?;
        if !local_changes.is_empty() {
            self.push_local_changes(jwt, tenant_uuid, local_changes).await?;
            self.mark_as_synced().await?;
        }

        // Re-enable foreign key constraints
        sqlx::query("PRAGMA foreign_keys = ON;")
        .execute(&self.db)
        .await
        .context("Failed to re-enable foreign keys")?;

        Ok(final_timestamp)
    }

    // -------------------------------------------------------------------------
    // Public: sync a single table
    // -------------------------------------------------------------------------
    pub async fn synchronize_table(&self, jwt: &str, tenant_uuid: &str, table_name: &str, last_pulled_at: Option<i64>) -> Result<i64> {
        // Disable foreign key constraints for this sync operation
        sqlx::query("PRAGMA foreign_keys = OFF;")
        .execute(&self.db)
        .await
        .context("Failed to disable foreign keys")?;

        let mut current_page = 1;
        let mut final_timestamp = 0;

        loop {
            // 1. Pull only changes for this table and specific page
            let pull_response = self.pull_remote_changes_for_table(
                jwt, 
                tenant_uuid, 
                table_name, 
                last_pulled_at, 
                Some(current_page)
            ).await?;
            
            // Capture the server timestamp from the first page to return for next sync
            if current_page == 1 {
                final_timestamp = pull_response.timestamp;
            }

            // 2. Apply only this table's changes for the current page
            self.apply_remote_changes_for_table(&pull_response.changes, table_name).await?;

            // 3. Check if the specific table has more pages to fetch
            let has_more = pull_response.changes.get(table_name)
                .and_then(|c| c.has_more)
                .unwrap_or(false);

            if !has_more {
                break;
            }
            
            current_page += 1;
        }

        // 4. Collect and push local changes for this table (performed once after all remote pages are applied)
        let local_changes = self.collect_local_changes_for_table(table_name).await?;
        if !local_changes.created.is_empty() || !local_changes.updated.is_empty() || !local_changes.deleted.is_empty() {
            let mut changes = HashMap::new();
            changes.insert(table_name.to_string(), local_changes);
            self.push_local_changes(jwt, tenant_uuid, changes).await?;
            self.mark_table_as_synced(table_name).await?;
        }

        // Re-enable foreign key constraints
        sqlx::query("PRAGMA foreign_keys = ON;")
        .execute(&self.db)
        .await
        .context("Failed to re-enable foreign keys")?;

        Ok(final_timestamp)
    }

    // -------------------------------------------------------------------------
    // Pull (all tables)
    // -------------------------------------------------------------------------
    async fn pull_remote_changes(&self, jwt: &str, tenant_uuid: &str, last_pulled_at: Option<i64>, page: Option<i32>) -> Result<PullResponse> {
        let mut url = Url::parse("https://api.famkonect.com/api/v1/sync/pull")?;
    
        if let Some(ts) = last_pulled_at {
            url.query_pairs_mut()
                .append_pair("last_pulled_at", &ts.to_string());
        }

        if let Some(p) = page {
            url.query_pairs_mut().append_pair("page", &p.to_string());
        }

        // println!("Pulling remote changes from: {}", url);
        // io::stdout().flush().unwrap();


        let response = self.client
        .get(url)
        .header("Authorization", format!("Bearer {}", jwt))
        .header("X-Tenant-UUID", tenant_uuid)
        .send()
        .await?;

        // Check for HTTP errors before deserializing
        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await?;
            return Err(anyhow::anyhow!("Server error {}: {}", status, text));
        }

        let pull_response = response.json::<PullResponse>().await?;
        Ok(pull_response)
    }

    // -------------------------------------------------------------------------
    // Pull (single table)
    // -------------------------------------------------------------------------
    

    async fn pull_remote_changes_for_table(
    &self, 
    jwt: &str, 
    tenant_uuid: &str, 
    table_name: &str, 
    last_pulled_at: Option<i64>,
    page: Option<i32> // Accept page parameter
    ) -> Result<PullResponse> {
        let mut url = Url::parse("https://api.famkonect.com/api/v1/sync/pull")?;
        
        // Add query parameters
        url.query_pairs_mut().append_pair("table", table_name);
        
        if let Some(ts) = last_pulled_at {
            url.query_pairs_mut().append_pair("last_pulled_at", &ts.to_string());
        }

        if let Some(p) = page {
            url.query_pairs_mut().append_pair("page", &p.to_string());
        }

        let res = self.client
            .get(url)
            .header("Authorization", format!("Bearer {}", jwt))
            .header("X-Tenant-UUID", tenant_uuid)
            .send()
            .await?;

        if !res.status().is_success() {
            let status = res.status();
            let text = res.text().await?;
            return Err(anyhow::anyhow!("Server error {}: {}", status, text));
        }

        let pull_response = res.json::<PullResponse>().await?;
        Ok(pull_response)
    }

    // -------------------------------------------------------------------------
    // Apply remote changes (all tables)
    // -------------------------------------------------------------------------
    async fn apply_remote_changes(&self, changes: &HashMap<String, SyncChanges>) -> Result<()> {
    let mut errors = Vec::new();

    for (table, payload) in changes.iter() {
        let mut tx = match self.db.begin().await {
            Ok(tx) => tx,
            Err(e) => {
                errors.push(format!("Failed to start transaction for table '{}': {}", table, e));
                continue;
            }
        };

        // 1. Handle deletions first
        for uuid in &payload.deleted {
            if let Err(e) = self.soft_delete_local(&mut tx, table, uuid).await {
                errors.push(format!("Failed to delete uuid '{}' in table '{}': {}", uuid, table, e));
            }
        }

        // 2. Handle created + updated records
        for record in payload.created.iter().chain(payload.updated.iter()) {
            let uuid = record.get("uuid")
                .and_then(|v| v.as_str())
                .unwrap_or("unknown");

            // Skip if also marked deleted
            if payload.deleted.contains(&uuid.to_string()) {
                errors.push(format!(
                    "Skipping record '{}' in table '{}' because it's marked deleted",
                    uuid, table
                ));
                continue;
            }

            // Apply record (UPSERT logic inside apply_single_record)
            if let Err(e) = self.apply_single_record(&mut tx, table, record.clone()).await {
                errors.push(format!(
                    "Failed to apply record '{}' in table '{}': {}",
                    uuid, table, e
                ));
            }
        }

        if let Err(e) = tx.commit().await {
            errors.push(format!("Failed to commit transaction for table '{}': {}", table, e));
        }
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(anyhow::anyhow!(errors.join("\n")))
    }
    }


    // -------------------------------------------------------------------------
    // Apply remote changes (single table)
    // -------------------------------------------------------------------------
    async fn apply_remote_changes_for_table(
    &self,
    changes: &HashMap<String, SyncChanges>,
    table_name: &str,
    ) -> Result<()> {
        if let Some(payload) = changes.get(table_name) {
            let mut tx = self.db.begin().await?;

            // 1. Handle deletions first
            for uuid in &payload.deleted {
                if let Err(e) = self.soft_delete_local(&mut tx, table_name, uuid).await {
                    eprintln!("Failed to delete uuid '{}' in table '{}': {}", uuid, table_name, e);
                }
            }

            // 2. Handle created + updated records
            for record in payload.created.iter().chain(payload.updated.iter()) {
                let uuid = record.get("uuid")
                    .and_then(|v| v.as_str())
                    .unwrap_or("unknown");

                // If record was also in deleted, skip
                if payload.deleted.contains(&uuid.to_string()) {
                    eprintln!("Skipping record '{}' in table '{}' because it's marked deleted", uuid, table_name);
                    continue;
                }

                // Apply record (insert or update depending on existence)
                if let Err(e) = self.apply_single_record(&mut tx, table_name, record.clone()).await {
                    eprintln!("Failed to apply record '{}' in table '{}': {}", uuid, table_name, e);
                }
            }

            tx.commit().await?;
        }
        Ok(())
    }

    async fn soft_delete_local(&self, tx: &mut Transaction<'_, sqlx::Sqlite>, table: &str, uuid: &str) -> Result<()> {
        let exists: bool = sqlx::query_scalar(&format!("SELECT EXISTS(SELECT 1 FROM {} WHERE uuid = $1)", table))
            .bind(uuid)
            .fetch_one(&mut **tx)
            .await?;
        if exists {
            let now = Utc::now().to_rfc3339();
            sqlx::query(&format!(
                "UPDATE {} SET sync_status = 'deleted', deleted_at = $1 WHERE uuid = $2",
                table
            ))
            .bind(&now)
            .bind(uuid)
            .execute(&mut **tx)
            .await?;
        }
        Ok(())
    }

    async fn apply_single_record(
    &self,
    tx: &mut Transaction<'_, sqlx::Sqlite>,
    table: &str,
    record: serde_json::Value,
    ) -> Result<()> {
    let uuid = record["uuid"].as_str().context("Missing uuid")?.to_string();
    let remote_updated = parse_timestamp_opt(record["updated_at"].as_str())?;

    // Fetch local record if exists
    let local = sqlx::query_as::<_, (String, String)>(
        &format!("SELECT sync_status, updated_at FROM {} WHERE uuid = $1", table)
    )
    .bind(&uuid)
    .fetch_optional(&mut **tx)
    .await?;

    let should_overwrite = match local {
        None => true, // no local record → insert
        Some((status, local_updated_str)) => {
            if status == "deleted" {
                // If locally deleted, skip overwrite
                false
            } else {
                let local_updated = parse_timestamp_opt(Some(&local_updated_str))?;
                remote_updated > local_updated
            }
        }
    };

    if should_overwrite {
        // Upsert record (insert or update depending on existence)
        self.upsert_record(tx, table, record.clone())
            .await
            .with_context(|| format!("Failed to upsert record '{}' in table '{}'", uuid, table))?;

        // Mark as synced
        sqlx::query(&format!("UPDATE {} SET sync_status = 'synced' WHERE uuid = $1", table))
            .bind(&uuid)
            .execute(&mut **tx)
            .await
            .with_context(|| format!("Failed to update sync_status for '{}' in table '{}'", uuid, table))?;
    } else {
        eprintln!("Skipping record '{}' in table '{}' (deleted or stale)", uuid, table);
    }

    Ok(())
    }

    // -------------------------------------------------------------------------
    // Collect local changes (all tables)
    // -------------------------------------------------------------------------
    async fn collect_local_changes(&self) -> Result<HashMap<String, SyncChanges>> {
        let mut all_changes = HashMap::new();
        for table in &self.tables {
            let changes = self.collect_local_changes_for_table(table).await?;
            if !changes.created.is_empty() || !changes.updated.is_empty() || !changes.deleted.is_empty() {
                all_changes.insert(table.clone(), changes);
            }
        }
        Ok(all_changes)
    }

    // -------------------------------------------------------------------------
    // Collect local changes (single table)
    // -------------------------------------------------------------------------
    async fn collect_local_changes_for_table(&self, table_name: &str) -> Result<SyncChanges> {
        let mut changes = SyncChanges {
            created: vec![],
            updated: vec![],
            deleted: vec![],
            has_more: None,
            current_page: None,
        };

        let rows = sqlx::query(
            &format!("SELECT * FROM {} WHERE sync_status IN ('created', 'updated')", table_name)
        )
        .fetch_all(&self.db)
        .await?;

        for row in rows {
            let status: String = row.get("sync_status");
            let json_val = self.row_to_json(row)?;
            if status == "created" {
                changes.created.push(json_val);
            } else {
                changes.updated.push(json_val);
            }
        }

        let deleted_rows = sqlx::query(
            &format!("SELECT uuid FROM {} WHERE sync_status = 'deleted'", table_name)
        )
        .fetch_all(&self.db)
        .await?;
        changes.deleted = deleted_rows.into_iter().map(|r| r.get(0)).collect();

        Ok(changes)
    }

    // -------------------------------------------------------------------------
    // Push local changes
    // -------------------------------------------------------------------------
    async fn push_local_changes(&self, jwt: &str, tenant_uuid: &str, changes: HashMap<String, SyncChanges>) -> Result<()> {
        let url = format!("https://api.famkonect.com/api/v1/sync/push");
        let res = self.client
            .post(&url)
            .header("Authorization", format!("Bearer {}", jwt))
            .header("Content-Type", "application/json")
            .header("X-Tenant-UUID", tenant_uuid)
            .json(&serde_json::json!({ "changes": changes }))
            .send()
            .await?;

        if !res.status().is_success() {
            return Err(anyhow::anyhow!("Push failed with status: {}", res.status()));
        }
        Ok(())
    }

    // -------------------------------------------------------------------------
    // Mark as synced (all tables)
    // -------------------------------------------------------------------------
    async fn mark_as_synced(&self) -> Result<()> {
        let mut tx = self.db.begin().await?;
        for table in &self.tables {
            self.mark_table_as_synced_in_tx(&mut tx, table).await?;
        }
        tx.commit().await?;
        Ok(())
    }

    // -------------------------------------------------------------------------
    // Mark a single table as synced
    // -------------------------------------------------------------------------
    async fn mark_table_as_synced(&self, table_name: &str) -> Result<()> {
        let mut tx = self.db.begin().await?;
        self.mark_table_as_synced_in_tx(&mut tx, table_name).await?;
        tx.commit().await?;
        Ok(())
    }

    async fn mark_table_as_synced_in_tx(&self, tx: &mut Transaction<'_, sqlx::Sqlite>, table_name: &str) -> Result<()> {
        sqlx::query(&format!("DELETE FROM {} WHERE sync_status = 'deleted'", table_name))
            .execute(&mut **tx)
            .await?;
        sqlx::query(&format!(
            "UPDATE {} SET sync_status = 'synced' WHERE sync_status IN ('created', 'updated')",
            table_name
        ))
        .execute(&mut **tx)
        .await?;
        Ok(())
    }



    async fn get_table_columns(&self, table: &str) -> Result<HashSet<String>> {
        // Check cache first
        {
            let cache = COLUMN_CACHE.lock().unwrap();
            if let Some(cols) = cache.get(table) {
                return Ok(cols.clone());
            }
        }
        // Query PRAGMA table_info
        let rows = sqlx::query(&format!("PRAGMA table_info({})", table))
            .fetch_all(&self.db)
            .await?;
        let mut columns = HashSet::new();
        for row in rows {
            let name: String = row.get("name");
            columns.insert(name);
        }
        // Store in cache
        {
            let mut cache = COLUMN_CACHE.lock().unwrap();
            cache.insert(table.to_string(), columns.clone());
        }
        Ok(columns)
    }

    // -------------------------------------------------------------------------
    // Upsert a record from JSON
    // -------------------------------------------------------------------------
    async fn upsert_record(
    &self,
    tx: &mut Transaction<'_, sqlx::Sqlite>,
    table: &str,
    record: serde_json::Value,
    ) -> Result<()> {
        let obj = record.as_object().context("Record is not an object")?;
        let existing_columns = self.get_table_columns(table).await?;
        
        // Build list of columns that exist locally
        let columns: Vec<&str> = obj.keys()
            .filter(|col| existing_columns.contains(*col))
            .map(|col| col.as_str())
            .collect();
        
        if columns.is_empty() {
            return Ok(()); // no matching columns, skip
        }
        
        let placeholders: Vec<String> = (1..=columns.len()).map(|i| format!("${}", i)).collect();
        let sql = format!(
            "INSERT OR REPLACE INTO {} ({}) VALUES ({})",
            table,
            columns.join(", "),
            placeholders.join(", ")
        );
        
        let mut query = sqlx::query(&sql);
        
        // Bind each value according to its JSON type
        for &col in &columns {
            let val = &obj[col];
            query = match val {
                serde_json::Value::Null => query.bind(None::<String>),
                serde_json::Value::Bool(b) => query.bind(b),
                serde_json::Value::Number(n) => {
                    if let Some(i) = n.as_i64() {
                        query.bind(i)
                    } else if let Some(f) = n.as_f64() {
                        query.bind(f)
                    } else {
                        query.bind(n.to_string())
                    }
                }
                // For strings, array, object: treat as string (JSON serialization)
                serde_json::Value::String(s) => query.bind(s),
                _ => query.bind(val.to_string()), // arrays and objects become JSON strings
            };
        }
        
        query.execute(&mut **tx).await?;
        Ok(())
    }

    // -------------------------------------------------------------------------
    // Convert SQLite row to JSON
    // -------------------------------------------------------------------------
    fn row_to_json(&self, row: sqlx::sqlite::SqliteRow) -> Result<serde_json::Value> {
        let mut map = serde_json::Map::new();
        let columns = row.columns();
        for col in columns {
            let name = col.name();
            let value = match col.type_info().name() {
                "TEXT" => {
                    let val: Option<String> = row.try_get(name)?;
                    val.map(serde_json::Value::String).unwrap_or(serde_json::Value::Null)
                }
                "INTEGER" => {
                    let val: Option<i64> = row.try_get(name)?;
                    val.map(|v| serde_json::Value::Number(v.into())).unwrap_or(serde_json::Value::Null)
                }
                "REAL" => {
                    let val: Option<f64> = row.try_get(name)?;
                    val.map(|v| {
                        serde_json::Value::Number(serde_json::Number::from_f64(v).unwrap_or(serde_json::Number::from(0)))
                    }).unwrap_or(serde_json::Value::Null)
                }
                "BLOB" => {
                    let val: Option<Vec<u8>> = row.try_get(name)?;
                    val.map(|v| serde_json::Value::String(general_purpose::STANDARD.encode(&v))).unwrap_or(serde_json::Value::Null)
                }
                _ => serde_json::Value::Null,
            };
            map.insert(name.to_string(), value);
        }
        Ok(serde_json::Value::Object(map))
    }

    // -------------------------------------------------------------------------
    // Get unsynced record counts for all tables (for UI badge)
    // -------------------------------------------------------------------------
    pub async fn get_unsynced_counts(&self) -> Result<HashMap<String, usize>> {
        let mut counts = HashMap::new();
        for table in &self.tables {
            let (count,): (i64,) = sqlx::query_as(
                &format!(
                    "SELECT COUNT(*) FROM {} WHERE sync_status IN ('created', 'updated', 'deleted')",
                    table
                )
            )
            .fetch_one(&self.db)
            .await?;
            if count > 0 {
                counts.insert(table.clone(), count as usize);
            }
        }
        Ok(counts)
    }
}

// -----------------------------------------------------------------------------
// Helper: parse timestamp (supports RFC3339, RFC2822, and naive "YYYY-MM-DD HH:MM:SS")
// -----------------------------------------------------------------------------
fn parse_timestamp(ts_str: &str) -> Result<i64> {
    // Try RFC3339 first (e.g. "2026-04-26T09:47:34+00:00")
    if let Ok(dt) = DateTime::parse_from_rfc3339(ts_str) {
        return Ok(dt.timestamp());
    }

    // Try RFC2822 (e.g. "Mon, 26 Apr 2026 09:47:34 +0000")
    if let Ok(dt) = DateTime::parse_from_rfc2822(ts_str) {
        return Ok(dt.timestamp());
    }

    // Try custom format (e.g. "2026-04-26 09:47:34")
    if let Ok(dt) = NaiveDateTime::parse_from_str(ts_str, "%Y-%m-%d %H:%M:%S") {
        return Ok(DateTime::<Utc>::from_utc(dt, Utc).timestamp());
    }

    Err(anyhow::anyhow!("Failed to parse timestamp: {}", ts_str))
    }

    /// Helper for optional timestamps (treat None as epoch)
    fn parse_timestamp_opt(ts: Option<&str>) -> Result<i64> {
        match ts {
            Some(s) => parse_timestamp(s),
            None => Ok(0), // treat missing timestamp as "very old"
        }
    }

