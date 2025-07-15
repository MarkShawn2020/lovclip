# N-Clip

一个现代化的剪切板管理器，基于 Electron + React + TypeScript 构建。

## ✨ 特性

### 🏆 核心亮点
- 🔥 **Alfred风格焦点管理** - 真正无焦点抢夺的智能交互体验
- ⚡ **全局键盘导航** - 系统级快捷键，无需窗口焦点
- 🎯 **智能粘贴技术** - 直接粘贴到当前应用，无缝集成工作流

### 📋 剪切板功能
- 🎯 **智能剪切板监听** - 自动捕获文本和图片内容
- 🔍 **实时搜索过滤** - 快速找到历史剪切板内容  
- 📌 **项目固定功能** - 重要内容可固定置顶
- 🗑️ **智能清理** - 自动清理过期内容

### 🎨 高级功能
- 🎨 **分享卡片生成** - 将内容转换为精美的分享图片
- 📱 **多模板支持** - 默认、深色、柔和三种风格
- 📐 **多比例选择** - 3:4、4:3、1:1 多种比例
- 🖱️ **拖拽支持** - 原生文件拖拽功能

### 🔧 系统集成
- 💾 **持久化存储** - SQLite 数据库本地存储
- ⌨️ **全局快捷键** - Cmd+Shift+C 快速唤起
- 🌐 **多工作区支持** - 跨桌面无缝使用
- 🔒 **隐私保护** - 所有数据本地存储，不上传云端

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- pnpm (推荐) 或 npm

### 安装依赖

```sh
pnpm install
```

### 开发模式

```sh
pnpm dev
```

### 构建应用

```sh
pnpm build
```

## 🔄 CI/CD 和发布

### 自动化发布流程

该项目配置了完整的GitHub Actions CI/CD流程，支持：

- **多平台构建**: macOS、Windows、Linux
- **自动化测试**: TypeScript检查、单元测试
- **代码签名**: macOS和Windows代码签名
- **自动发布**: 基于git标签的自动发布

### 发布新版本

1. **使用发布脚本**（推荐）:
   ```sh
   pnpm release
   ```

2. **手动发布**:
   ```sh
   # 更新版本号
   pnpm version patch|minor|major
   
   # 推送到GitHub
   git push origin main --tags
   ```

3. **GitHub Actions发布**:
   - 进入GitHub仓库的Actions页面
   - 选择"Version Management"工作流
   - 手动触发并选择版本类型

### 构建输出

- **macOS**: `.dmg` 安装包和 `.zip` 压缩包
- **Windows**: `.exe` 安装程序和 `.zip` 压缩包  
- **Linux**: `.AppImage` 和 `.deb` 包

更多详情请参考：
- [CI/CD 文档](./docs/CICD.md)
- [CI/CD 故障排除指南](./docs/CI-CD-TROUBLESHOOTING.md)

## 🎮 使用方法

1. **启动应用** - 应用会在系统托盘中运行
2. **全局唤起** - 使用 `Cmd+Shift+C` 或 `Cmd+Option+C` 快捷键
3. **搜索内容** - 在搜索框中输入关键词过滤历史记录
4. **生成分享** - 点击内容右侧的分享按钮生成精美卡片
5. **拖拽操作** - 直接拖拽图片到其他应用程序

## 🏗️ 技术栈

- **前端框架**: React 18 + TypeScript
- **桌面框架**: Electron
- **构建工具**: Vite
- **状态管理**: Jotai
- **数据存储**: SQLite3
- **图像处理**: Canvas API
- **样式**: CSS3 + Flexbox

## 📂 项目结构

```
├── electron/                   # Electron 主进程和预加载脚本
│   ├── main/                   # 主进程代码
│   └── preload/                # 预加载脚本
├── src/                        # React 渲染进程代码
│   ├── components/             # React 组件
│   ├── store/                  # 状态管理
│   └── types/                  # TypeScript 类型定义
├── public/                     # 静态资源
└── dist-electron/              # 构建输出目录
```

## 🔧 配置说明

应用数据存储在 `~/.neurora/n-clip/` 目录下：
- `clipboard.db` - SQLite 数据库文件
- 图片文件按日期分目录存储

## 📝 开发说明

### 主要组件

- `ClipboardManager` - 主界面组件
- `ShareCardWindow` - 分享卡片生成窗口
- IPC 通信模块 - 主进程与渲染进程通信

### 数据库结构

```sql
CREATE TABLE clipboard_items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  preview TEXT,
  timestamp INTEGER NOT NULL,
  size TEXT,
  expiry_time INTEGER
)
```

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- 基于 [electron-vite-react](https://github.com/electron-vite/electron-vite-react) 模板
- 感谢所有贡献者和开源社区