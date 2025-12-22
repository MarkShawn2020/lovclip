import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

// ============ Types ============

export interface ClipboardItem {
  id: string;
  type: 'text' | 'image';
  content: string;
  preview?: string;
  timestamp: number;
  size?: string;
  isStarred?: boolean;
  starredAt?: number;
  category?: string;
  tags?: string[];
  description?: string;
}

export interface ArchiveItem {
  id: string;
  originalId: string;
  type: 'text' | 'image';
  content: string;
  preview?: string;
  timestamp: number;
  size?: string;
  starredAt: number;
  category: string;
  tags?: string[];
  description?: string;
}

export interface StorageSettings {
  textDuration: number;
  imageDuration: number;
  fileDuration: number;
}

// ============ Result Types (Electron compatibility) ============

interface ApiResult {
  success: boolean;
  error?: string;
}

interface PasteResult extends ApiResult {
  method?: string;
}

interface StarResult extends ApiResult {
  isStarred?: boolean;
}

// Store unlisten functions for cleanup
const unlistenFns: Map<string, UnlistenFn> = new Map();

// ============ Clipboard API ============

export const clipboardAPI = {
  // Get clipboard history
  getClipboardHistory: (): Promise<ClipboardItem[]> =>
    invoke<ClipboardItem[]>('get_clipboard_history'),

  // Delete item from history or archive
  deleteItem: async (itemId: string): Promise<ApiResult> => {
    const success = await invoke<boolean>('delete_item', { itemId });
    return { success };
  },

  // Clear all history
  clearHistory: (): Promise<boolean> =>
    invoke<boolean>('clear_history'),

  // Set clipboard content (just copy, no paste)
  setClipboardContent: async (item: ClipboardItem): Promise<void> => {
    await invoke('set_clipboard_content', { item });
  },

  // Paste selected item (sets clipboard and simulates Cmd+V)
  pasteSelectedItem: async (item: ClipboardItem): Promise<PasteResult> => {
    const success = await invoke<boolean>('paste_selected_item', { item });
    return { success, method: 'keyboard' };
  },

  // Star item (add to archive)
  starItem: async (
    itemId: string,
    category?: string,
    description?: string
  ): Promise<ApiResult> => {
    const success = await invoke<boolean>('star_item', { itemId, category, description });
    return { success };
  },

  // Unstar item (remove from archive)
  unstarItem: async (itemId: string): Promise<ApiResult> => {
    const success = await invoke<boolean>('unstar_item', { itemId });
    return { success };
  },

  // Get starred items
  getStarredItems: async (category?: string): Promise<{ success: boolean; items: ArchiveItem[] }> => {
    const items = await invoke<ArchiveItem[]>('get_starred_items', { category });
    return { success: true, items };
  },

  // Get categories (stub - returns empty for now)
  getCategories: async (): Promise<{ success: boolean; categories: any[] }> => {
    // TODO: Implement categories in Rust backend
    return { success: true, categories: [] };
  },

  // Check if item is starred
  isItemStarred: async (itemId: string): Promise<StarResult> => {
    const isStarred = await invoke<boolean>('is_item_starred', { itemId });
    return { success: true, isStarred };
  },

  // Open archive window
  openArchiveWindow: async (): Promise<ApiResult> => {
    await invoke('open_archive_window');
    return { success: true };
  },

  // Open share card window (stub - TODO: implement in Rust)
  openShareCardWindow: async (_item: ClipboardItem): Promise<ApiResult> => {
    console.warn('openShareCardWindow not implemented yet');
    return { success: false, error: 'Not implemented' };
  },

  // Start drag (stub - TODO: implement in Rust)
  startDrag: async (_item: ClipboardItem): Promise<void> => {
    console.warn('startDrag not implemented yet');
  },

  // Storage settings
  getStorageSettings: (): Promise<StorageSettings> =>
    invoke<StorageSettings>('get_storage_settings'),

  setStorageSettings: (settings: StorageSettings): Promise<boolean> =>
    invoke<boolean>('set_storage_settings', { settings }),

  // Cleanup (stub - TODO: implement in Rust)
  cleanupExpiredItems: async (): Promise<void> => {
    console.warn('cleanupExpiredItems not implemented yet');
  },

  // Event listeners
  onClipboardChange: (callback: (item: ClipboardItem) => void): void => {
    listen<ClipboardItem>('clipboard:changed', (event) => {
      callback(event.payload);
    }).then(fn => unlistenFns.set('clipboard:changed', fn));
  },

  onClipboardHistoryUpdate: (callback: (items: ClipboardItem[]) => void): void => {
    listen<ClipboardItem[]>('clipboard:history-updated', (event) => {
      callback(event.payload);
    }).then(fn => unlistenFns.set('clipboard:history-updated', fn));
  },

  removeClipboardListener: (): void => {
    unlistenFns.get('clipboard:changed')?.();
    unlistenFns.get('clipboard:history-updated')?.();
    unlistenFns.delete('clipboard:changed');
    unlistenFns.delete('clipboard:history-updated');
  },

  // Navigation events (from global shortcuts)
  onNavigateItems: (callback: (direction: 'up' | 'down') => void): void => {
    listen<'up' | 'down'>('navigate-items', (event) => {
      callback(event.payload);
    }).then(fn => unlistenFns.set('navigate-items', fn));
  },

  onSelectCurrentItem: (callback: () => void): void => {
    listen('select-current-item', () => callback())
      .then(fn => unlistenFns.set('select-current-item', fn));
  },

  onDeleteCurrentItem: (callback: () => void): void => {
    listen('delete-current-item', () => callback())
      .then(fn => unlistenFns.set('delete-current-item', fn));
  },

  onToggleStar: (callback: () => void): void => {
    listen('toggle-star', () => callback())
      .then(fn => unlistenFns.set('toggle-star', fn));
  },

  onOpenArchive: (callback: () => void): void => {
    listen('open-archive', () => callback())
      .then(fn => unlistenFns.set('open-archive', fn));
  },

  onTogglePreview: (callback: () => void): void => {
    listen('toggle-preview', () => callback())
      .then(fn => unlistenFns.set('toggle-preview', fn));
  },

  removeGlobalKeyboardListeners: (): void => {
    ['navigate-items', 'select-current-item', 'delete-current-item', 'toggle-star', 'open-archive', 'toggle-preview']
      .forEach(key => {
        unlistenFns.get(key)?.();
        unlistenFns.delete(key);
      });
  },
};

// ============ Window API ============

interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const windowAPI = {
  // Hide main window
  hideWindow: (): Promise<void> => invoke('hide_window'),

  // Toggle main window
  toggleWindow: (): Promise<void> => invoke('toggle_window'),

  // Open archive window
  openArchiveWindow: (): Promise<void> => invoke('open_archive_window'),

  // Get window bounds (stub - returns default values)
  getBounds: async (): Promise<WindowBounds> => {
    // TODO: Implement in Rust if needed
    return { x: 0, y: 0, width: 800, height: 600 };
  },

  // Window bounds change listener (stub)
  onBoundsChanged: (_callback: (bounds: WindowBounds) => void): void => {
    // TODO: Implement if needed
  },

  removeWindowListener: (): void => {
    // TODO: Implement if needed
  },

  // Settings window bounds (stubs)
  getSettingsBounds: async (): Promise<WindowBounds> => {
    return { x: 0, y: 0, width: 600, height: 500 };
  },

  onSettingsBoundsChanged: (_callback: (bounds: WindowBounds) => void): void => {},

  removeSettingsWindowListener: (): void => {},

  setSettingsBounds: (_bounds: WindowBounds): void => {},

  // Global shortcut
  getCurrentShortcut: async (): Promise<string> => {
    return 'CmdOrCtrl+Shift+V';
  },

  updateGlobalShortcut: async (_shortcut: string): Promise<ApiResult> => {
    // TODO: Implement in Rust
    return { success: true };
  },
};

// ============ Accessibility API ============

export const accessibilityAPI = {
  // Check if accessibility permission is granted
  checkPermission: (): Promise<boolean> => invoke<boolean>('check_accessibility'),

  // Request accessibility permission
  requestPermission: (): Promise<boolean> =>
    invoke<boolean>('request_accessibility'),
};

// ============ Storage API ============

export const storageAPI = {
  // Get storage settings
  getSettings: (): Promise<StorageSettings> =>
    invoke<StorageSettings>('get_storage_settings'),

  // Set storage settings
  setSettings: (settings: StorageSettings): Promise<boolean> =>
    invoke<boolean>('set_storage_settings', { settings }),
};

// ============ Compatibility Layer ============
// For easier migration from Electron

// Expose as window globals for backward compatibility
if (typeof window !== 'undefined') {
  (window as any).clipboardAPI = clipboardAPI;
  (window as any).windowAPI = windowAPI;
  (window as any).accessibilityAPI = accessibilityAPI;
}
