use serde::{Serialize, Deserialize};
use std::fs;
use std::path::PathBuf;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct UnitPresetItem {
    pub name: String,
    pub singular: String,
    pub plural: String,
    pub description: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PresetLibrary {
    pub id: String,
    pub label: String,
    pub description: String,
    pub units: Vec<UnitPresetItem>,
}

pub fn load_unit_presets() -> Result<Vec<PresetLibrary>, String> {
    let mut libraries = Vec::new();
    let presets_dir = PathBuf::from("presets/units");

    for entry in fs::read_dir(&presets_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if path.extension().map(|ext| ext == "json").unwrap_or(false) {
            let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
            let preset: PresetLibrary = serde_json::from_str(&content).map_err(|e| e.to_string())?;
            libraries.push(preset);
        }
    }

    Ok(libraries)
}
