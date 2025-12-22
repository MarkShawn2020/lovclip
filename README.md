<p align="center">
  <img src="docs/images/cover.png" alt="LovClip Cover" width="100%">
</p>

<h1 align="center">
  <img src="assets/logo.svg" width="32" height="32" alt="Logo" align="top">
  LovClip
</h1>

<p align="center">
  <strong>Modern clipboard manager with Alfred-like interface</strong><br>
  <sub>macOS</sub>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#keyboard-shortcuts">Shortcuts</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#license">License</a>
</p>

---

## Features

**Alfred-Style Focus Management** — True no-focus-steal interaction. The app appears instantly without interrupting your current workflow.

**Smart Clipboard Monitoring** — Automatically captures text and image content with real-time history tracking.

**Instant Search** — Filter through clipboard history with lightning-fast fuzzy search.

**Archive Library** — Star important items and access them in a dedicated archive window with masonry layout.

**Privacy First** — All data stored locally in `~/.config/lovclip/`. Nothing leaves your machine.

## Installation

Download the latest `.dmg` from [Releases](https://github.com/MarkShawn2020/lovclip/releases).

Or build from source:

```bash
pnpm install
pnpm tauri:build:mac
```

## Usage

1. **Launch** — App runs in the background
2. **Invoke** — Press `Cmd+Shift+V` to show the clipboard manager
3. **Navigate** — Use `↑`/`↓` arrow keys to select items
4. **Paste** — Press `Enter` to paste selected item into the active app
5. **Search** — Start typing to filter items
6. **Archive** — Press `Cmd+S` to star items, `Cmd+A` to open archive library

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+Shift+V` | Toggle clipboard manager |
| `↑` / `↓` | Navigate items |
| `Enter` | Paste selected item |
| `Escape` | Hide window |
| `Delete` | Remove item |
| `Cmd+S` | Star/unstar item |
| `Cmd+A` | Open archive library |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop Framework | [Tauri 2](https://tauri.app) (Rust) |
| Frontend | React 18 + TypeScript |
| Build Tool | Vite |
| State Management | Jotai |
| Styling | Tailwind CSS 4 |
| Storage | JSON files (local) |

## Project Structure

```
src-tauri/
├── src/
│   ├── lib.rs              # Tauri commands & setup
│   ├── clipboard/          # Clipboard monitoring
│   ├── storage/            # State persistence
│   ├── window/             # Window management
│   └── macos/              # macOS accessibility & paste simulation

src/
├── api/tauri-bridge.ts     # Frontend API layer
├── components/             # React components
├── store/atoms.ts          # Jotai state atoms
└── types/                  # TypeScript definitions
```

## Development

```bash
pnpm install          # Install dependencies
pnpm dev              # Start Vite dev server (port 7777)
pnpm tauri:dev        # Start Tauri development
pnpm type-check       # TypeScript type checking
```

## License

[MIT](LICENSE)
