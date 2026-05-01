// Type declarations for Tauri bridge APIs

export interface ClipboardItem {
  id: string
  type: 'text' | 'image'
  content: string
  preview?: string
  timestamp: number
  size?: string
  isStarred?: boolean
  starredAt?: number
  category?: string
  tags?: string[]
  description?: string
}

export interface ArchiveItem {
  id: string
  originalId: string
  type: 'text' | 'image'
  content: string
  preview?: string
  timestamp: number
  size?: string
  starredAt: number
  category: string
  tags?: string[]
  description?: string
}

export interface StorageSettings {
  textDuration: number
  imageDuration: number
  fileDuration: number
}

export interface FormattingSettings {
  wrapImagePathWithBacktick: boolean
}

interface ApiResult {
  success: boolean
  error?: string
}

interface PasteResult extends ApiResult {
  method?: string
}

interface StarResult extends ApiResult {
  isStarred?: boolean
}

interface WindowBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface ClipboardAPI {
  getClipboardHistory: () => Promise<ClipboardItem[]>
  deleteItem: (itemId: string) => Promise<ApiResult>
  clearHistory: () => Promise<boolean>
  setClipboardContent: (item: ClipboardItem) => Promise<void>
  updateItem: (itemId: string, content: string) => Promise<ApiResult>
  pasteSelectedItem: (item: ClipboardItem) => Promise<PasteResult>
  starItem: (itemId: string, category?: string, description?: string) => Promise<ApiResult>
  unstarItem: (itemId: string) => Promise<ApiResult>
  getStarredItems: (category?: string) => Promise<{ success: boolean; items: ArchiveItem[] }>
  getCategories: () => Promise<{ success: boolean; categories: any[] }>
  isItemStarred: (itemId: string) => Promise<StarResult>
  openArchiveWindow: () => Promise<ApiResult>
  openShareCardWindow: (item: ClipboardItem) => Promise<ApiResult>
  startDrag: (item: ClipboardItem) => Promise<void>
  getStorageSettings: () => Promise<StorageSettings>
  setStorageSettings: (settings: StorageSettings) => Promise<boolean>
  getFormattingSettings: () => Promise<FormattingSettings>
  setFormattingSettings: (settings: FormattingSettings) => Promise<boolean>
  cleanupExpiredItems: () => Promise<void>
  onClipboardChange: (callback: (item: ClipboardItem) => void) => void
  onClipboardHistoryUpdate: (callback: (items: ClipboardItem[]) => void) => void
  removeClipboardListener: () => void
  onNavigateItems: (callback: (direction: 'up' | 'down') => void) => void
  onSelectCurrentItem: (callback: () => void) => void
  onDeleteCurrentItem: (callback: () => void) => void
  onToggleStar: (callback: () => void) => void
  onOpenArchive: (callback: () => void) => void
  onTogglePreview: (callback: () => void) => void
  removeGlobalKeyboardListeners: () => void
}

export interface WindowAPI {
  hideWindow: () => Promise<void>
  toggleWindow: () => Promise<void>
  openArchiveWindow: () => Promise<void>
  getBounds: () => Promise<WindowBounds>
  onBoundsChanged: (callback: (bounds: WindowBounds) => void) => void
  removeWindowListener: () => void
  getSettingsBounds: () => Promise<WindowBounds>
  onSettingsBoundsChanged: (callback: (bounds: WindowBounds) => void) => void
  removeSettingsWindowListener: () => void
  setSettingsBounds: (bounds: WindowBounds) => void
  getCurrentShortcut: () => Promise<string>
  updateGlobalShortcut: (shortcut: string) => Promise<ApiResult>
}

export interface AccessibilityAPI {
  checkPermission: () => Promise<boolean>
  requestPermission: () => Promise<boolean>
}

declare global {
  interface Window {
    clipboardAPI: ClipboardAPI
    windowAPI: WindowAPI
    accessibilityAPI: AccessibilityAPI
  }
}

export {}
