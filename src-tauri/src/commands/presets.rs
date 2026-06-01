
use crate::commands::seeds::{load_unit_presets, PresetLibrary};

#[tauri::command]
pub async fn get_unit_presets() -> Result<Vec<PresetLibrary>, String> {
    load_unit_presets()
}
