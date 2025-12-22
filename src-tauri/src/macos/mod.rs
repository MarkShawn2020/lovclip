#[cfg(target_os = "macos")]
pub mod accessibility;

#[cfg(target_os = "macos")]
pub use accessibility::*;
