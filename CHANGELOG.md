## 5.0.1

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
