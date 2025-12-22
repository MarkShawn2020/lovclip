#![cfg(target_os = "macos")]

use core_graphics::event::{CGEvent, CGEventFlags, CGEventTapLocation, CGKeyCode};
use core_graphics::event_source::{CGEventSource, CGEventSourceStateID};

/// macOS key codes
const KEY_V: CGKeyCode = 9;

/// Check if accessibility permission is granted
pub fn check_accessibility_permission() -> bool {
    unsafe { ApplicationServices::AXIsProcessTrusted() != 0 }
}

/// Request accessibility permission (shows system dialog)
pub fn request_accessibility_permission() -> bool {
    unsafe {
        // Create options dictionary with prompt = true
        let options = std::ptr::null();
        ApplicationServices::AXIsProcessTrustedWithOptions(options) != 0
    }
}

/// Simulate Cmd+V paste keystroke
pub fn simulate_paste() -> Result<(), String> {
    // Small delay to ensure window is hidden
    std::thread::sleep(std::time::Duration::from_millis(50));

    let source = CGEventSource::new(CGEventSourceStateID::HIDSystemState)
        .map_err(|_| "Failed to create event source")?;

    // Create key down event with Command modifier
    let key_down = CGEvent::new_keyboard_event(source.clone(), KEY_V, true)
        .map_err(|_| "Failed to create key down event")?;
    key_down.set_flags(CGEventFlags::CGEventFlagCommand);

    // Create key up event
    let key_up = CGEvent::new_keyboard_event(source, KEY_V, false)
        .map_err(|_| "Failed to create key up event")?;
    key_up.set_flags(CGEventFlags::CGEventFlagCommand);

    // Post events
    key_down.post(CGEventTapLocation::HID);
    std::thread::sleep(std::time::Duration::from_millis(10));
    key_up.post(CGEventTapLocation::HID);

    Ok(())
}

/// Get info about currently focused application
#[allow(dead_code)]
pub fn get_focused_app_info() -> Option<FocusedAppInfo> {
    // Simplified version - full implementation would use AXUIElement APIs
    None
}

#[derive(Debug, Clone, serde::Serialize)]
#[allow(dead_code)]
pub struct FocusedAppInfo {
    pub app_name: Option<String>,
    pub has_focused_element: bool,
    pub element_role: Option<String>,
}

// FFI declarations for macOS Accessibility APIs
mod ApplicationServices {
    use std::ffi::c_void;

    #[link(name = "ApplicationServices", kind = "framework")]
    extern "C" {
        pub fn AXIsProcessTrusted() -> u8;
        pub fn AXIsProcessTrustedWithOptions(options: *const c_void) -> u8;
    }
}
