use crate::sync_engine::SyncEngine;
use serde::{Deserialize, Serialize};
use tauri::{command, State};
use std::sync::Arc;
use tokio::sync::Mutex;
use std::collections::HashMap;

pub struct SyncEngineState(pub Arc<Mutex<SyncEngine>>);

#[derive(Debug, Serialize, Deserialize)]
pub struct SyncResult {
    pub success: bool,
    pub message: String,
    pub new_timestamp: Option<i64>,
}

#[command]
pub async fn sync_all(
    state: State<'_, SyncEngineState>,
    jwt: String,
    last_pulled_at: Option<i64>,
) -> Result<SyncResult, String> {
    let engine = state.0.lock().await;
    match engine.synchronize(&jwt, last_pulled_at).await {
        Ok(ts) => Ok(SyncResult {
            success: true,
            message: "All tables synced successfully".to_string(),
            new_timestamp: Some(ts),
        }),
        Err(e) => Ok(SyncResult {
            success: false,
            message: format!("Sync failed: {}", e),
            new_timestamp: None,
        }),
    }
}

#[command]
pub async fn sync_table(
    state: State<'_, SyncEngineState>,
    jwt: String,
    table_name: String,
    last_pulled_at: Option<i64>,
) -> Result<SyncResult, String> {
    let engine = state.0.lock().await;
    match engine.synchronize_table(&jwt, &table_name, last_pulled_at).await {
        Ok(ts) => Ok(SyncResult {
            success: true,
            message: format!("Table '{}' synced successfully", table_name),
            new_timestamp: Some(ts),
        }),
        Err(e) => Ok(SyncResult {
            success: false,
            message: format!("Sync failed for table '{}': {}", table_name, e),
            new_timestamp: None,
        }),
    }
}

#[command]
pub async fn get_unsynced_counts(state: State<'_, SyncEngineState>) -> Result<HashMap<String, usize>, String> {
    let engine = state.0.lock().await;
    engine.get_unsynced_counts().await.map_err(|e| e.to_string())
}