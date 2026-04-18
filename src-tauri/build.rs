use std::env;
use std::fs;
use std::path::Path;

fn main() {
    let out_dir = env::var("OUT_DIR").unwrap();
    let dest_path = Path::new(&out_dir).join("migrations.rs");
    
    // Get the absolute path to your project root (where src-tauri lives)
    let project_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    // The drizzle folder is one level up from src-tauri
    let migrations_dir = Path::new(&project_dir).join("../drizzle");
    
    let mut migrations = Vec::new();

    if migrations_dir.exists() {
        let mut entries: Vec<_> = fs::read_dir(&migrations_dir)
            .unwrap()
            .map(|r| r.unwrap())
            .filter(|e| e.path().extension().and_then(|s| s.to_str()) == Some("sql"))
            .collect();

        entries.sort_by_key(|e| e.file_name());

        for (index, entry) in entries.iter().enumerate() {
            let file_name = entry.file_name().into_string().unwrap();
            
            // Get the absolute path and escape backslashes for Windows
            let abs_path = entry.path().canonicalize().unwrap();
            let path_str = abs_path.to_str().unwrap().replace("\\", "/");
            
            // We use the absolute path directly in include_str!
            migrations.push(format!(
                "tauri_plugin_sql::Migration {{
                    version: {},
                    description: \"{}\",
                    sql: include_str!(\"{}\"),
                    kind: tauri_plugin_sql::MigrationKind::Up,
                }}",
                index + 1,
                file_name,
                path_str
            ));
        }
    }

    let migration_code = format!(
        "pub fn get_migrations() -> Vec<tauri_plugin_sql::Migration> {{ vec![{}] }}",
        migrations.join(",")
    );

    fs::write(dest_path, migration_code).unwrap();
    
    println!("cargo:rerun-if-changed=../drizzle");
    tauri_build::build();
}