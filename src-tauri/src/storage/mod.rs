use crate::clipboard::{ArchiveItem, ClipboardItem, StorageSettings};
use std::fs;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

/// Get the data directory path
pub fn get_data_dir() -> PathBuf {
    let home = dirs::home_dir().expect("Could not find home directory");
    home.join(".neurora").join("lovclip")
}

/// Ensure data directory exists
pub fn ensure_data_dir() -> std::io::Result<PathBuf> {
    let path = get_data_dir();
    fs::create_dir_all(&path)?;
    Ok(path)
}

/// Load clipboard history from file
pub fn load_history() -> Vec<ClipboardItem> {
    let path = get_data_dir().join("clipboard-history.json");

    if !path.exists() {
        return Vec::new();
    }

    match fs::read_to_string(&path) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
        Err(e) => {
            log::error!("Failed to read history file: {}", e);
            Vec::new()
        }
    }
}

/// Save clipboard history to file
pub fn save_history(history: &[ClipboardItem]) -> std::io::Result<()> {
    let path = ensure_data_dir()?.join("clipboard-history.json");
    let content = serde_json::to_string_pretty(history)?;
    fs::write(path, content)
}

/// Load archive items from file
pub fn load_archive() -> Vec<ArchiveItem> {
    let path = get_data_dir().join("archive-items.json");

    if !path.exists() {
        return Vec::new();
    }

    match fs::read_to_string(&path) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
        Err(e) => {
            log::error!("Failed to read archive file: {}", e);
            Vec::new()
        }
    }
}

/// Save archive items to file
pub fn save_archive(archive: &[ArchiveItem]) -> std::io::Result<()> {
    let path = ensure_data_dir()?.join("archive-items.json");
    let content = serde_json::to_string_pretty(archive)?;
    fs::write(path, content)
}

/// Load storage settings
pub fn load_settings() -> StorageSettings {
    let path = get_data_dir().join("settings.json");

    if !path.exists() {
        return StorageSettings::new();
    }

    match fs::read_to_string(&path) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
        Err(_) => StorageSettings::new(),
    }
}

/// Save storage settings
pub fn save_settings(settings: &StorageSettings) -> std::io::Result<()> {
    let path = ensure_data_dir()?.join("settings.json");
    let content = serde_json::to_string_pretty(settings)?;
    fs::write(path, content)
}

/// Application state
pub struct AppState {
    pub clipboard_history: Arc<Mutex<Vec<ClipboardItem>>>,
    pub archive_items: Arc<Mutex<Vec<ArchiveItem>>>,
    pub settings: Arc<Mutex<StorageSettings>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            clipboard_history: Arc::new(Mutex::new(load_history())),
            archive_items: Arc::new(Mutex::new(load_archive())),
            settings: Arc::new(Mutex::new(load_settings())),
        }
    }

    pub fn save_all(&self) -> std::io::Result<()> {
        if let Ok(history) = self.clipboard_history.lock() {
            save_history(&history)?;
        }
        if let Ok(archive) = self.archive_items.lock() {
            save_archive(&archive)?;
        }
        if let Ok(settings) = self.settings.lock() {
            save_settings(&settings)?;
        }
        Ok(())
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}
