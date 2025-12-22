use arboard::Clipboard;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{AppHandle, Emitter};

use super::types::ClipboardItem;

pub fn start_clipboard_watcher(
    app: AppHandle,
    history: Arc<Mutex<Vec<ClipboardItem>>>,
    max_items: usize,
) {
    std::thread::spawn(move || {
        let mut clipboard = match Clipboard::new() {
            Ok(c) => c,
            Err(e) => {
                log::error!("Failed to create clipboard: {}", e);
                return;
            }
        };

        let mut last_text = String::new();

        loop {
            if let Ok(text) = clipboard.get_text() {
                if !text.is_empty() && text != last_text {
                    last_text = text.clone();

                    let item = ClipboardItem::new_text(text);

                    // Add to history
                    if let Ok(mut h) = history.lock() {
                        // Check for duplicates
                        if !h.iter().any(|i| i.content == item.content) {
                            h.insert(0, item.clone());

                            // Truncate if exceeds max
                            if h.len() > max_items {
                                h.truncate(max_items);
                            }
                        }
                    }

                    // Notify frontend
                    if let Err(e) = app.emit("clipboard:changed", &item) {
                        log::error!("Failed to emit clipboard change: {}", e);
                    }

                    // Also emit history update
                    if let Ok(h) = history.lock() {
                        let _ = app.emit("clipboard:history-updated", h.clone());
                    }
                }
            }

            std::thread::sleep(Duration::from_secs(1));
        }
    });
}
