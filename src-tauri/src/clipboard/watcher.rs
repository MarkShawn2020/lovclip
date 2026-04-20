use arboard::Clipboard;
use regex::Regex;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{AppHandle, Emitter};

use super::types::{ClipboardItem, FormattingSettings};

static IMAGE_PATH_RE: once_cell::sync::Lazy<Regex> = once_cell::sync::Lazy::new(|| {
    Regex::new(r#"(?i)^(?:file://)?/?(?:[^<>"|?*\n]+/)*[^<>"|?*/\n]+\.(png|jpe?g|gif|webp|bmp|svg|tiff?|heic|heif|avif|ico)$"#).unwrap()
});

fn strip_outer_quotes(s: &str) -> &str {
    let bytes = s.as_bytes();
    if bytes.len() >= 2 {
        let first = bytes[0];
        let last = bytes[bytes.len() - 1];
        if (first == b'\'' && last == b'\'') || (first == b'"' && last == b'"') {
            return &s[1..s.len() - 1];
        }
    }
    s
}

fn is_image_path(s: &str) -> bool {
    let trimmed = strip_outer_quotes(s.trim());
    if trimmed.is_empty() || trimmed.contains('\n') {
        return false;
    }
    IMAGE_PATH_RE.is_match(trimmed)
}

/// Normalize a clipboard text for semantic dedup:
/// trim, strip outer quotes, strip surrounding backticks.
fn normalize(s: &str) -> &str {
    let t = s.trim();
    let t = strip_outer_quotes(t);
    let bytes = t.as_bytes();
    if bytes.len() >= 2 && bytes[0] == b'`' && bytes[bytes.len() - 1] == b'`' {
        &t[1..t.len() - 1]
    } else {
        t
    }
}

pub fn start_clipboard_watcher(
    app: AppHandle,
    history: Arc<Mutex<Vec<ClipboardItem>>>,
    formatting: Arc<Mutex<FormattingSettings>>,
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
                    let wrap = formatting
                        .lock()
                        .map(|f| f.wrap_image_path_with_backtick)
                        .unwrap_or(false);

                    let trimmed = text.trim();
                    let already_wrapped = trimmed.starts_with('`') && trimmed.ends_with('`');
                    let final_text = if wrap && !already_wrapped && is_image_path(trimmed) {
                        let inner = strip_outer_quotes(trimmed);
                        let wrapped = format!("`{}`", inner);
                        if clipboard.set_text(&wrapped).is_err() {
                            log::error!("Failed to rewrite clipboard with backticks");
                        }
                        // Re-read so last_text matches whatever macOS actually stored
                        // (avoids a spurious second insert on the next poll).
                        clipboard.get_text().unwrap_or(wrapped)
                    } else {
                        text.clone()
                    };

                    last_text = final_text.clone();

                    // Semantic dedup: Finder may write the clipboard multiple
                    // times in quick succession (e.g. raw path, then shell-quoted
                    // path). Collapse entries whose normalized form matches,
                    // keeping the latest (wrapped) variant at the top.
                    let norm_new = normalize(&final_text).to_string();
                    let item = ClipboardItem::new_text(final_text);

                    if let Ok(mut h) = history.lock() {
                        h.retain(|i| normalize(&i.content) != norm_new);
                        h.insert(0, item.clone());
                        if h.len() > max_items {
                            h.truncate(max_items);
                        }
                    }

                    if let Err(e) = app.emit("clipboard:changed", &item) {
                        log::error!("Failed to emit clipboard change: {}", e);
                    }

                    if let Ok(h) = history.lock() {
                        let _ = app.emit("clipboard:history-updated", h.clone());
                    }
                }
            }

            std::thread::sleep(Duration::from_millis(300));
        }
    });
}
