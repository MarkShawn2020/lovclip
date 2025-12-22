# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 开发军规 (Development Rules)

- 禁止备用方案 (No fallback solutions)
- 禁止测试用例 (No test cases)
- 禁止try-catch (No try-catch)
- 禁止setTimeout/setInterval (No timing functions)
- 禁止动态导入 (No dynamic imports)
- 本地正在 `pnpm dev`，不要启动/杀死dev服务器

## Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start development (runs on port 7777)
pnpm dist             # Build without publish (preferred for local builds)
pnpm dist:mac         # Build for macOS only
pnpm type-check       # TypeScript type checking
pnpm build:native     # Rebuild native modules
```

**WARNING**: `pnpm build` publishes to GitHub - use `pnpm dist` for local builds.

## Architecture

### Electron Main/Preload/Renderer Pattern
```
electron/
├── main/index.ts       # Main process: window management, clipboard monitoring, SQLite, global shortcuts
├── preload/index.ts    # IPC bridge: exposes clipboardAPI, windowAPI to renderer
└── native/             # Native modules (accessibility.mm for macOS)

src/
├── components/         # React components
│   ├── ClipboardManager.tsx  # Main UI, keyboard navigation, search
│   ├── ShareCardWindow.tsx   # Canvas-based card generation
│   └── SettingsWindow.tsx    # Independent settings window
├── store/atoms.ts      # Jotai atoms (clipboardItemsAtom, searchQueryAtom, etc.)
└── types/              # TypeScript definitions
```

### Data Flow
- **Main Process** → SQLite (`~/.neurora/lovclip/clipboard.db`) → IPC → **Renderer**
- **Renderer** → `window.clipboardAPI` / `window.windowAPI` → IPC → **Main Process**

### Database Schema
```sql
CREATE TABLE clipboard_items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,        -- 'text' | 'image'
  content TEXT NOT NULL,     -- text content or image path
  preview TEXT,              -- truncated preview for images
  timestamp INTEGER NOT NULL,
  size TEXT,
  expiry_time INTEGER
)
```

### Alfred-Style Focus Management

核心技术：实现无焦点抢夺的剪贴板交互

**Key Window Config** (`electron/main/index.ts`):
```typescript
new BrowserWindow({
  frame: false,
  focusable: true,
  alwaysOnTop: true,
  skipTaskbar: true,
  visibleOnAllWorkspaces: true
})
```

**Flow**:
1. `Cmd+Shift+C` → `showInactive()` (no focus steal)
2. Global shortcuts for navigation (Up/Down/Enter/Escape)
3. Selection → hide window → set clipboard → simulate `Cmd+V`

Key files: `electron/main/index.ts`, `electron/native/accessibility.mm`

### IPC Channels
- `clipboard:get-items`, `clipboard:add-item`, `clipboard:delete-item`
- `clipboard:paste-selected-item` (triggers paste to original app)
- `window:show`, `window:hide`, `window:toggle`
- `navigate-items`, `select-current-item` (main→renderer)

### State Management
Jotai atoms in `src/store/atoms.ts`:
- `clipboardItemsAtom` - all items from SQLite
- `searchQueryAtom` - current search filter
- `filteredItemsAtom` - derived filtered results
- `selectedIndexAtom` - keyboard navigation index

## Build Config

- **Vite**: `@/` alias → `src/`, port 7777
- **Electron Builder**: outputs to `release/${version}/`
- **Native Modules**: `electron/native/binding.gyp` (node-gyp)

## Global Shortcuts

- `Cmd+Shift+C` or `Cmd+Option+C` - Toggle window
- `Up/Down` - Navigate items
- `Enter` - Select and paste
- `Escape` - Hide window
- `Delete` - Remove item