## 5.0.1

## 5.1.1

### Patch Changes

- ci: 启用 macOS 完整签名与公证流程（app + dmg），分发可通过 Gatekeeper

## 5.1.0

### Minor Changes

- feat: 图片路径自动反引号包围

  - 新增"格式化"设置项：勾选后，系统 Cmd+C 复制图片路径时，剪贴板会立即改写为反引号包围的版本（防止在 Claude Code 等工具中被识别为图片）
  - 自动剥离 Finder 对含空格路径添加的外层单/双引号
  - 剪贴板历史按"归一化路径"去重，Finder 多轮写入（原始路径、shell-quoted 路径、反引号版本）折叠为一条
  - 轮询周期从 1s 降至 300ms，交互更灵敏
  - 设置开关改为即时生效（不再需要点击"保存设置"）
  - UI 初始化 shadcn/ui 组件并切换到 Lovstudio 暖学术设计系统
  - 更新全套 logo/icon 资源

## 5.0.2

### Patch Changes

- Add backtick wrap action and update web logos

### Features

- feat(window): Alfred 风格窗口焦点管理
  - 设置为 Accessory 应用，不出现在 Dock 和 Cmd+Tab
  - 打开窗口前保存前台应用 PID，关闭时恢复焦点
  - 失焦自动隐藏窗口
  - 每次打开重置选中索引、搜索和滚动位置

## 5.0.0

### Breaking Changes

- 完成从 Electron 到 Tauri 的完整迁移，全新架构

### Features

- feat(window): 添加窗口拖拽支持
- feat(dev): 配置 lovinsp 点击跳转源码插件
- feat(tauri): 完成 Electron 到 Tauri 的 API 兼容层迁移
- feat(dev): 集成 lovinsp 点击跳转源码功能

### Refactor

- refactor(ui): 优化剪贴板管理器界面布局和尺寸
- refactor(icons): 将所有 emoji 图标迁移到 Radix Icons
- refactor(archive): 重构档案库页面布局
- refactor(archive): 使用 Tailwind 语义类名重构档案库页面
- refactor: 完成 Electron 到 Tauri 的完整迁移

### Chore

- chore(brand): 品牌升级为 Lovclip
