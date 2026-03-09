mod clipboard;
mod storage;
mod window;

#[cfg(target_os = "macos")]
mod macos;

use clipboard::{ArchiveItem, ClipboardItem};
use storage::AppState;
use std::sync::Arc;
use tauri::{AppHandle, Manager, State};

// ============ Clipboard Commands ============

#[tauri::command]
fn get_clipboard_history(state: State<AppState>) -> Vec<ClipboardItem> {
    state
        .clipboard_history
        .lock()
        .map(|h| h.clone())
        .unwrap_or_default()
}

#[tauri::command]
fn delete_item(state: State<AppState>, item_id: String) -> Result<bool, String> {
    // Try to delete from history
    {
        let mut history = state
            .clipboard_history
            .lock()
            .map_err(|_| "Failed to lock history")?;
        if let Some(pos) = history.iter().position(|i| i.id == item_id) {
            history.remove(pos);
            return Ok(true);
        }
    }

    // Try to delete from archive
    {
        let mut archive = state
            .archive_items
            .lock()
            .map_err(|_| "Failed to lock archive")?;
        if let Some(pos) = archive.iter().position(|i| i.id == item_id) {
            archive.remove(pos);
            return Ok(true);
        }
    }

    Err("Item not found".to_string())
}

#[tauri::command]
fn clear_history(state: State<AppState>) -> Result<bool, String> {
    let mut history = state
        .clipboard_history
        .lock()
        .map_err(|_| "Failed to lock history")?;
    history.clear();
    Ok(true)
}

#[tauri::command]
fn set_clipboard_content(item: ClipboardItem) -> Result<bool, String> {
    let mut clipboard = arboard::Clipboard::new().map_err(|e| e.to_string())?;
    clipboard.set_text(&item.content).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
async fn paste_selected_item(app: AppHandle, item: ClipboardItem) -> Result<bool, String> {
    let mut clipboard = arboard::Clipboard::new().map_err(|e| e.to_string())?;
    clipboard.set_text(&item.content).map_err(|e| e.to_string())?;

    window::hide_window(&app);

    #[cfg(target_os = "macos")]
    macos::simulate_paste()?;

    Ok(true)
}

// ============ Archive (Star) Commands ============

#[tauri::command]
fn star_item(
    state: State<AppState>,
    item_id: String,
    category: Option<String>,
    description: Option<String>,
) -> Result<bool, String> {
    let history = state
        .clipboard_history
        .lock()
        .map_err(|_| "Failed to lock history")?;

    let item = history
        .iter()
        .find(|i| i.id == item_id)
        .ok_or("Item not found")?;

    let mut archive_item = ArchiveItem::from_clipboard_item(item, category);
    archive_item.description = description;

    drop(history);

    let mut archive = state
        .archive_items
        .lock()
        .map_err(|_| "Failed to lock archive")?;
    archive.insert(0, archive_item);

    Ok(true)
}

#[tauri::command]
fn unstar_item(state: State<AppState>, item_id: String) -> Result<bool, String> {
    let mut archive = state
        .archive_items
        .lock()
        .map_err(|_| "Failed to lock archive")?;

    if let Some(pos) = archive.iter().position(|i| i.id == item_id || i.original_id == item_id) {
        archive.remove(pos);
        return Ok(true);
    }

    Err("Item not found in archive".to_string())
}

#[tauri::command]
fn get_starred_items(state: State<AppState>, category: Option<String>) -> Vec<ArchiveItem> {
    let archive = state.archive_items.lock().unwrap_or_else(|_| {
        panic!("Failed to lock archive");
    });

    match category {
        Some(cat) => archive.iter().filter(|i| i.category == cat).cloned().collect(),
        None => archive.clone(),
    }
}

#[tauri::command]
fn is_item_starred(state: State<AppState>, item_id: String) -> bool {
    let archive = state.archive_items.lock().unwrap_or_else(|_| {
        panic!("Failed to lock archive");
    });
    archive.iter().any(|i| i.original_id == item_id)
}

// ============ Window Commands ============

#[tauri::command]
fn hide_window(app: AppHandle) {
    window::hide_window(&app);
}

#[tauri::command]
fn toggle_window(app: AppHandle) {
    window::toggle_window(&app);
}

#[tauri::command]
fn open_archive_window(app: AppHandle) -> Result<(), String> {
    window::open_archive_window(&app)
}

// ============ Accessibility Commands ============

#[tauri::command]
fn check_accessibility() -> bool {
    #[cfg(target_os = "macos")]
    return macos::check_accessibility_permission();

    #[cfg(not(target_os = "macos"))]
    return true;
}

#[tauri::command]
fn request_accessibility() -> bool {
    #[cfg(target_os = "macos")]
    return macos::request_accessibility_permission();

    #[cfg(not(target_os = "macos"))]
    return true;
}

// ============ Storage Commands ============

#[tauri::command]
fn get_storage_settings(state: State<AppState>) -> clipboard::StorageSettings {
    state
        .settings
        .lock()
        .map(|s| s.clone())
        .unwrap_or_default()
}

#[tauri::command]
fn set_storage_settings(
    state: State<AppState>,
    settings: clipboard::StorageSettings,
) -> Result<bool, String> {
    let mut current = state
        .settings
        .lock()
        .map_err(|_| "Failed to lock settings")?;
    *current = settings;
    Ok(true)
}

// ============ Main Entry Point ============

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let state = AppState::new();
    let history_for_watcher = Arc::clone(&state.clipboard_history);

    tauri::Builder::default()
        // Plugins
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    if event.state() == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                        window::toggle_window(app);
                    }
                })
                .build(),
        )
        // State
        .manage(state)
        // Setup
        .setup(move |app| {
            // Set as accessory app: no Dock icon, no app switcher
            #[cfg(target_os = "macos")]
            unsafe {
                use cocoa::appkit::NSApplication;
                use cocoa::appkit::NSApplicationActivationPolicy;
                let ns_app = cocoa::appkit::NSApp();
                ns_app.setActivationPolicy_(NSApplicationActivationPolicy::NSApplicationActivationPolicyAccessory);
            }

            // Setup main window effects and ensure it's hidden on startup
            if let Some(window) = app.get_webview_window("main") {
                if let Err(e) = window::setup_main_window(&window) {
                    log::error!("Failed to setup main window: {}", e);
                }
                let _ = window.hide();
            }

            // Ensure archive window is hidden on startup
            if let Some(archive) = app.get_webview_window("archive") {
                let _ = archive.hide();
            }

            // Register global shortcut
            #[cfg(desktop)]
            {
                use tauri_plugin_global_shortcut::GlobalShortcutExt;
                // Try multiple shortcuts in order
                let shortcuts = [
                    "CmdOrCtrl+Shift+V",
                    "CmdOrCtrl+Option+V",
                    "CmdOrCtrl+Shift+C",
                ];

                for shortcut in shortcuts {
                    if app.global_shortcut().register(shortcut).is_ok() {
                        log::info!("Registered global shortcut: {}", shortcut);
                        break;
                    }
                }
            }

            // Start clipboard watcher
            clipboard::start_clipboard_watcher(app.handle().clone(), history_for_watcher, 50);

            // Setup tray
            setup_tray(app)?;

            Ok(())
        })
        // Commands
        .invoke_handler(tauri::generate_handler![
            // Clipboard
            get_clipboard_history,
            delete_item,
            clear_history,
            set_clipboard_content,
            paste_selected_item,
            // Archive
            star_item,
            unstar_item,
            get_starred_items,
            is_item_starred,
            // Window
            hide_window,
            toggle_window,
            open_archive_window,
            // Accessibility
            check_accessibility,
            request_accessibility,
            // Storage
            get_storage_settings,
            set_storage_settings,
        ])
        // Save state on exit
        .on_window_event(|window, event| {
            match event {
                tauri::WindowEvent::CloseRequested { .. } => {
                    if let Some(state) = window.try_state::<AppState>() {
                        if let Err(e) = state.save_all() {
                            log::error!("Failed to save state: {}", e);
                        }
                    }
                }
                tauri::WindowEvent::Focused(false) => {
                    if window.label() == "main" {
                        window::hide_window(&window.app_handle());
                    }
                }
                _ => {}
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn setup_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri::{
        menu::{Menu, MenuItem},
        tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    };

    let quit = MenuItem::with_id(app, "quit", "退出 Lovclip", true, None::<&str>)?;
    let show = MenuItem::with_id(app, "show", "打开剪切板", true, None::<&str>)?;
    let archive = MenuItem::with_id(app, "archive", "打开档案库", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&show, &archive, &quit])?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "quit" => app.exit(0),
            "show" => window::toggle_window(app),
            "archive" => {
                let _ = window::open_archive_window(app);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                window::toggle_window(app);
            }
        })
        .build(app)?;

    Ok(())
}
