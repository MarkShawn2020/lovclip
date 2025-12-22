# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Design System

This project uses **Lovstudio Warm Academic Style (暖学术风格)**

Reference complete design guide: file:///Users/mark/@lovstudio/design/design-guide.md

### Quick Rules
1. **禁止硬编码颜色**：必须使用 semantic 类名（如 `bg-primary`、`text-muted-foreground`）
2. **字体配对**：标题用 `font-serif`，正文用默认 `font-sans`
3. **圆角风格**：使用 `rounded-lg`、`rounded-xl`、`rounded-2xl`
4. **主色调**：陶土色（按钮/高亮）+ 暖米色背景 + 炭灰文字
5. **组件优先**：优先使用 shadcn/ui 组件

### Color Palette
- **Primary**: #CC785C (陶土色 Terracotta)
- **Background**: #F9F9F7 (暖米色 Warm Beige)
- **Foreground**: #181818 (炭灰色 Charcoal)
- **Border**: #D5D3CB

### Common Patterns
- 主按钮: `bg-primary text-primary-foreground hover:bg-primary/90`
- 卡片: `bg-card border border-border rounded-xl`
- 标题: `font-serif text-foreground`

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
pnpm dev              # Start Vite dev server (port 7777)
pnpm tauri:dev        # Start Tauri development
pnpm tauri:build      # Build Tauri app
pnpm tauri:build:mac  # Build for macOS universal
pnpm type-check       # TypeScript type checking
```

## Architecture

### Tauri + React Pattern
```
src-tauri/
├── src/
│   ├── lib.rs              # Main entry, Tauri commands, setup
│   ├── main.rs             # App bootstrap
│   ├── clipboard/          # Clipboard monitoring and types
│   ├── storage/            # State persistence (JSON files)
│   ├── window/             # Window management
│   └── macos/              # macOS accessibility & paste simulation
├── tauri.conf.json         # Tauri configuration
└── Cargo.toml              # Rust dependencies

src/
├── api/tauri-bridge.ts     # Frontend API layer (invoke wrapper)
├── components/             # React components
│   ├── ClipboardManager.tsx  # Main UI, keyboard navigation, search
│   ├── ArchiveLibrary.tsx    # Archive/starred items window
│   └── SettingsWindow.tsx    # Settings window
├── store/atoms.ts          # Jotai atoms for state management
└── types/                  # TypeScript definitions
```

### Data Flow
- **Rust Backend** → JSON files (`~/.config/lovclip/`) → Tauri invoke → **React Frontend**
- **React Frontend** → `clipboardAPI` / `windowAPI` (tauri-bridge.ts) → Tauri invoke → **Rust Backend**

### Key Tauri Commands (lib.rs)
- `get_clipboard_history`, `delete_item`, `clear_history`
- `paste_selected_item` (sets clipboard + simulates Cmd+V)
- `star_item`, `unstar_item`, `get_starred_items`
- `hide_window`, `toggle_window`, `open_archive_window`
- `check_accessibility`, `request_accessibility`

### Alfred-Style Focus Management

核心技术：实现无焦点抢夺的剪贴板交互

**Window Config** (`tauri.conf.json`):
```json
{
  "decorations": false,
  "transparent": true,
  "alwaysOnTop": true,
  "skipTaskbar": true,
  "visible": false
}
```

**Flow**:
1. `Cmd+Shift+V` → toggle window (no focus steal)
2. Keyboard navigation in React
3. Selection → hide window → set clipboard → simulate `Cmd+V`

Key files: `src-tauri/src/lib.rs`, `src-tauri/src/macos/accessibility.rs`

### State Management
Jotai atoms in `src/store/atoms.ts`:
- `clipboardItemsAtom` - all clipboard items
- `searchQueryAtom` - current search filter
- `filteredItemsAtom` - derived filtered results
- `selectedIndexAtom` - keyboard navigation index

## Build Config

- **Vite**: `@/` alias → `src/`, port 7777
- **Tauri**: outputs to `src-tauri/target/release/bundle/`

## Global Shortcuts

- `Cmd+Shift+V` - Toggle window
- `Up/Down` - Navigate items
- `Enter` - Select and paste
- `Escape` - Hide window
- `Delete` - Remove item
