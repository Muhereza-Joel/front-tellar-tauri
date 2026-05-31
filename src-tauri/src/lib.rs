use tauri::Manager;
mod commands;
use commands::license::{get_machine_hash, store_secure, get_secure, delete_secure};

mod sequence_generator; // your PO + SKU generator module
use sequence_generator::{generate_po_number, generate_sku};

mod sync_engine;
mod sync_commands;
use sync_engine::SyncEngine;
use sync_commands::{sync_all, sync_table, get_unsynced_counts, SyncEngineState};

use sqlx::SqlitePool;
use std::sync::Arc;
use tokio::sync::Mutex;


include!(concat!(env!("OUT_DIR"), "/migrations.rs"));
const TRIGGER_SCHEMA_VERSION: i32 = 1; // Increment this when you change triggers

struct AppState {
    db_pool: SqlitePool,
}

async fn ensure_inventory_triggers(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    // Check current installed trigger version
    let installed_version: Option<i32> = sqlx::query_scalar(
        "SELECT CAST(value AS INTEGER) FROM app_system_info WHERE key = 'triggers_version'"
    )
    .fetch_optional(pool)
    .await?;

    if installed_version == Some(TRIGGER_SCHEMA_VERSION) {
        return Ok(()); // up-to-date
    }

    // Drop existing triggers if we're upgrading (optional but clean)
    // This prevents "trigger already exists" errors when changing logic
    sqlx::query("DROP TRIGGER IF EXISTS trg_sale_items_stock_decrement")
        .execute(pool)
        .await?;
    sqlx::query("DROP TRIGGER IF EXISTS trg_sale_items_stock_sync")
        .execute(pool)
        .await?;
    sqlx::query("DROP TRIGGER IF EXISTS trg_sale_items_stock_increment")
        .execute(pool)
        .await?;

    // Create new/updated triggers with sync_status updates
    let trigger_sql = "
        CREATE TRIGGER IF NOT EXISTS trg_sale_items_stock_decrement
        AFTER INSERT ON sale_items
        BEGIN
            UPDATE products 
            SET current_stock = current_stock - NEW.quantity,
                sync_status = 'updated',
                updated_at = datetime('now')
            WHERE uuid = NEW.product_id AND NEW.variant_id IS NULL;

            UPDATE product_variants 
            SET current_stock = current_stock - NEW.quantity,
                sync_status = 'updated',
                updated_at = datetime('now')
            WHERE uuid = NEW.variant_id;
        END;

        CREATE TRIGGER IF NOT EXISTS trg_sale_items_stock_sync
        AFTER UPDATE OF quantity ON sale_items
        BEGIN
            UPDATE products 
            SET current_stock = current_stock - (NEW.quantity - OLD.quantity),
                sync_status = 'updated',
                updated_at = datetime('now')
            WHERE uuid = NEW.product_id AND NEW.variant_id IS NULL;

            UPDATE product_variants 
            SET current_stock = current_stock - (NEW.quantity - OLD.quantity),
                sync_status = 'updated',
                updated_at = datetime('now')
            WHERE uuid = NEW.variant_id;
        END;

        CREATE TRIGGER IF NOT EXISTS trg_sale_items_stock_increment
        AFTER DELETE ON sale_items
        BEGIN
            UPDATE products 
            SET current_stock = current_stock + OLD.quantity,
                sync_status = 'updated',
                updated_at = datetime('now')
            WHERE uuid = OLD.product_id AND OLD.variant_id IS NULL;

            UPDATE product_variants 
            SET current_stock = current_stock + OLD.quantity,
                sync_status = 'updated',
                updated_at = datetime('now')
            WHERE uuid = OLD.variant_id;
        END;
    ";

    sqlx::query(trigger_sql).execute(pool).await?;

    // Store the new version
    sqlx::query(
        "INSERT OR REPLACE INTO app_system_info (key, value) VALUES ('triggers_version', ?)"
    )
    .bind(TRIGGER_SCHEMA_VERSION.to_string())
    .execute(pool)
    .await?;

    Ok(())
}

#[tauri::command]
fn set_window_theme(app_handle: tauri::AppHandle, theme: String) {
    let window = app_handle.get_webview_window("main").unwrap();

    if theme == "dark" {
        window.set_decorations(true).unwrap();
        window.set_theme(Some(tauri::Theme::Dark)).unwrap();
    } else {
        window.set_decorations(true).unwrap();
        window.set_theme(Some(tauri::Theme::Light)).unwrap();
    }
}

#[tauri::command]
async fn cmd_generate_po_number(state: tauri::State<'_, AppState>) -> Result<String, String> {
    generate_po_number(&state.db_pool).await
}

#[tauri::command]
async fn cmd_generate_sku(product_name: String, state: tauri::State<'_, AppState>) -> Result<String, String> {
    generate_sku(&product_name, &state.db_pool).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 1. Initial System Migration
    let mut migrations = vec![
        tauri_plugin_sql::Migration {
            version: 1,
            description: "system_init",
            sql: "CREATE TABLE IF NOT EXISTS app_system_info (key TEXT PRIMARY KEY, value TEXT);",
            kind: tauri_plugin_sql::MigrationKind::Up,
        },
    ];

    // 2. Append Drizzle migrations with the +1 offset
    for mut m in get_migrations() {
        m.version += 1;
        migrations.push(m);
    }

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:local.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir().expect("failed to get app data dir");

            if !app_data_dir.exists() {
                std::fs::create_dir_all(&app_data_dir).expect("failed to create app data dir");
            }

            let db_path = app_data_dir.join("local.db");

            // Create the SqlitePool for the sync engine (same database file)
            let db_url = format!("sqlite:{}", db_path.to_str().unwrap());
            let db_pool = tauri::async_runtime::block_on(SqlitePool::connect(&db_url))
                .expect("Failed to create SQLite pool for sync engine");

            // After migrations have been applied (plugin handles that), run triggers
            tauri::async_runtime::block_on(ensure_inventory_triggers(&db_pool))
                .expect("Failed to create inventory triggers");

            // Manage AppState for PO/SKU generator
            app.manage(AppState { db_pool: db_pool.clone() });

            // List of tables to sync (adjust to your actual tables)
            let tables = vec![
                "tenants".to_string(),
                "local_roles".to_string(),
                "local_users".to_string(),
                "customers".to_string(),
                "services".to_string(),
                "service_variants".to_string(),
                "brands".to_string(),
                "units".to_string(),
                "categories".to_string(),
                "products".to_string(),
                "attribute_definitions".to_string(),
                "product_variants".to_string(),
                "branches".to_string(),
                "purchase_orders".to_string(),
                "purchase_order_items".to_string(),
                "suppliers".to_string(),
                "sales".to_string(),
                "sale_items".to_string(),
                "service_sales".to_string(),
                "service_sale_items".to_string(),
                "discounts".to_string(),
                "expenses".to_string(),
                "notes".to_string(),
            ];

            let api_url = "https://api.famkonect.com/api/v1".to_string(); // change to your server URL
            let engine = SyncEngine::new(db_pool, api_url, tables);
            let engine_state = SyncEngineState(Arc::new(Mutex::new(engine)));
            app.manage(engine_state);

            let window = app.get_webview_window("main").unwrap();
            window.set_theme(Some(tauri::Theme::Light)).unwrap();

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            set_window_theme,
            get_machine_hash,
            store_secure,
            get_secure,
            delete_secure,
            sync_all,
            sync_table,
            get_unsynced_counts,
            cmd_generate_po_number,
            cmd_generate_sku,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
