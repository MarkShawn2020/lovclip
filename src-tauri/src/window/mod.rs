use tauri::{AppHandle, Manager, WebviewWindow};

#[cfg(target_os = "macos")]
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial, NSVisualEffectState};

#[cfg(target_os = "macos")]
use cocoa::appkit::NSWindow;
#[cfg(target_os = "macos")]
use cocoa::base::id;
#[cfg(target_os = "macos")]
use objc::{msg_send, sel, sel_impl};

#[cfg(target_os = "macos")]
use std::sync::atomic::{AtomicI32, Ordering};

/// Store the PID of the previously focused app before we steal focus
#[cfg(target_os = "macos")]
static PREVIOUS_APP_PID: AtomicI32 = AtomicI32::new(0);

#[cfg(target_os = "macos")]
fn save_frontmost_app() {
    unsafe {
        let workspace: id = msg_send![objc::class!(NSWorkspace), sharedWorkspace];
        let front_app: id = msg_send![workspace, frontmostApplication];
        if !front_app.is_null() {
            let pid: i32 = msg_send![front_app, processIdentifier];
            PREVIOUS_APP_PID.store(pid, Ordering::Relaxed);
        }
    }
}

#[cfg(target_os = "macos")]
fn restore_frontmost_app() {
    let pid = PREVIOUS_APP_PID.swap(0, Ordering::Relaxed);
    if pid > 0 {
        unsafe {
            let cls = objc::class!(NSRunningApplication);
            let app: id = msg_send![cls, runningApplicationWithProcessIdentifier: pid];
            if !app.is_null() {
                // NSApplicationActivateIgnoringOtherApps = 1 << 1
                let _: bool = msg_send![app, activateWithOptions: (1u64 << 1)];
            }
        }
    }
}

/// Setup main window with platform-specific effects
pub fn setup_main_window(window: &WebviewWindow) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        apply_vibrancy(
            window,
            NSVisualEffectMaterial::HudWindow,
            Some(NSVisualEffectState::Active),
            Some(16.0),
        )
        .map_err(|e| e.to_string())?;

        unsafe {
            let ns_window = window.ns_window().map_err(|e| e.to_string())? as id;

            ns_window.setBackgroundColor_(cocoa::appkit::NSColor::clearColor(cocoa::base::nil));

            let content_view: id = ns_window.contentView();
            let _: () = msg_send![content_view, setWantsLayer: true];

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
            #[cfg(target_os = "macos")]
            save_frontmost_app();

            let _ = window.center();
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
}

/// Show main window
pub fn show_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        #[cfg(target_os = "macos")]
        save_frontmost_app();

        let _ = window.show();
        let _ = window.set_focus();
    }
}

/// Hide main window and restore focus to previous app
pub fn hide_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();

        #[cfg(target_os = "macos")]
        restore_frontmost_app();
    }
}

/// Open archive window
pub fn open_archive_window(app: &AppHandle) -> Result<(), String> {
    if let Some(main) = app.get_webview_window("main") {
        let _ = main.hide();
    }

    if let Some(archive) = app.get_webview_window("archive") {
        archive.show().map_err(|e| e.to_string())?;
        archive.set_focus().map_err(|e| e.to_string())?;
    }

    Ok(())
}
