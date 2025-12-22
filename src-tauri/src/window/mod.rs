use tauri::{AppHandle, Manager, WebviewWindow};

#[cfg(target_os = "macos")]
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial, NSVisualEffectState};

/// Setup main window with platform-specific effects
pub fn setup_main_window(window: &WebviewWindow) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        // Apply vibrancy effect for macOS
        apply_vibrancy(
            window,
            NSVisualEffectMaterial::HudWindow,
            Some(NSVisualEffectState::Active),
            Some(12.0),
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Toggle main window visibility
pub fn toggle_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
}

/// Show main window
pub fn show_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

/// Hide main window
pub fn hide_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
    }
}

/// Open archive window
pub fn open_archive_window(app: &AppHandle) -> Result<(), String> {
    // Hide main window
    if let Some(main) = app.get_webview_window("main") {
        let _ = main.hide();
    }

    // Show archive window
    if let Some(archive) = app.get_webview_window("archive") {
        archive.show().map_err(|e| e.to_string())?;
        archive.set_focus().map_err(|e| e.to_string())?;
    }

    Ok(())
}
