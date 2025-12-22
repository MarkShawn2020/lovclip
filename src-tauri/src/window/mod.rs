use tauri::{AppHandle, Manager, WebviewWindow};

#[cfg(target_os = "macos")]
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial, NSVisualEffectState};

#[cfg(target_os = "macos")]
use cocoa::appkit::NSWindow;
#[cfg(target_os = "macos")]
use cocoa::base::id;
#[cfg(target_os = "macos")]
use objc::{msg_send, sel, sel_impl};

/// Setup main window with platform-specific effects
pub fn setup_main_window(window: &WebviewWindow) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        // Apply vibrancy effect for macOS
        apply_vibrancy(
            window,
            NSVisualEffectMaterial::HudWindow,
            Some(NSVisualEffectState::Active),
            Some(16.0),
        )
        .map_err(|e| e.to_string())?;

        // Set window corner radius using native API
        unsafe {
            let ns_window = window.ns_window().map_err(|e| e.to_string())? as id;

            // Make window background clear
            ns_window.setBackgroundColor_(cocoa::appkit::NSColor::clearColor(cocoa::base::nil));

            // Get content view and enable layer-backing
            let content_view: id = ns_window.contentView();
            let _: () = msg_send![content_view, setWantsLayer: true];

            // Set corner radius on the layer
            let layer: id = msg_send![content_view, layer];
            if !layer.is_null() {
                let _: () = msg_send![layer, setCornerRadius: 16.0_f64];
                let _: () = msg_send![layer, setMasksToBounds: true];
            }
        }
    }

    Ok(())
}

/// Toggle main window visibility
pub fn toggle_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            let _ = window.center();
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
