# GitHub Uploader (Tauri + React + Rust)

> ⚠️ **警告**：该项目软件尚未进行测试，可能存在bug或无法使用的现象。

这是一个基于 Tauri v2 的 Windows 桌面应用程序，旨在实现“一键将本地项目上传到 GitHub 仓库”。

它完全不依赖用户系统安装 Git 命令行工具，而是通过内置的 `libgit2` (Rust `git2` crate) 直接操作 Git 仓库。

## ✨ 主要功能

*   **完全独立**：无需安装 Git，内置 Git 核心能力。
*   **安全鉴权**：支持 GitHub OAuth Device Flow (设备流登录)，Token 安全存储于 Windows Credential Manager。
*   **仓库管理**：
    *   支持创建新仓库（个人/组织，公开/私有）。
    *   支持选择已有仓库（分页加载 + 搜索）。
*   **智能分支策略**：
    *   自动检测目标仓库状态。
    *   **分支决策保护**：当目标仓库非空且默认分支不是 `main` 时，强制弹窗让用户选择推送目标（防止意外覆盖或混乱）。
*   **模板系统**：
    *   内置常用模板 (`.gitignore`, `README.md`, `LICENSE`)。
    *   支持写入前预览及 Diff 查看，防止覆盖已有文件。
*   **异步体验**：全链路异步操作，UI 流畅不卡顿。

## 🛠 技术栈

*   **Frontend**: React (Vite), TypeScript, Zustand (State Management), React Router
*   **Backend (Host)**: Rust, Tauri v2
*   **Git Core**: `git2` (libgit2 bindings for Rust)
*   **HTTP Client**: `reqwest` (Async)
*   **System Integration**: `keyring` (Credential Manager), `tauri-plugin-shell`, `tauri-plugin-dialog`

## 🚀 快速开始

### 前置要求

*   **Node.js** (推荐 v18+)
*   **Rust** (最新稳定版)
*   **VS C++ Build Tools** (Windows 开发 Rust 必备)

### 安装依赖

```bash
cd github-uploader
npm install
```

### 开发模式运行

首次运行会下载编译 Rust 依赖（包括 libgit2），可能需要几分钟。

```bash
npm run tauri dev
```

### 构建发布包

构建 Windows 安装包 (.msi / .exe)：

```bash
npm run tauri build
```

构建产物位于 `src-tauri/target/release/bundle/nsis/` 下。

## 📂 项目结构

```
github-uploader/
├── src/                  # 前端源码 (React)
│   ├── pages/            # 页面组件 (Auth, RepoSelect, Progress...)
│   ├── store.ts          # Zustand 全局状态
│   └── App.tsx           # 路由配置
├── src-tauri/            # 后端源码 (Rust)
│   ├── src/
│   │   ├── services/     # 核心业务逻辑
│   │   │   ├── auth.rs   # OAuth & Keyring
│   │   │   ├── git.rs    # Libgit2 封装
│   │   │   ├── github.rs # GitHub API Client
│   │   │   └── templates.rs
│   │   ├── commands.rs   # Tauri 暴露给前端的指令
│   │   └── lib.rs        # 应用入口与插件配置
│   ├── tauri.conf.json   # Tauri 配置文件
│   └── Cargo.toml        # Rust 依赖
└── package.json
```

## ⚠️ 注意事项

1.  **Client ID**: 当前项目代码中使用了一个占位符/演示用的 GitHub OAuth Client ID (`Ov23likk6r3pYk7iMv62`)。在生产环境中，请在 GitHub Developer Settings 中注册你自己的 OAuth App，并在 `src-tauri/src/services/github.rs` 和 `src-tauri/src/commands.rs` 中替换它。
2.  **网络问题**: 构建过程中下载 `libgit2` 源码或 `crates.io` 依赖时若遇到网络错误，请检查网络连接或配置 Cargo 镜像源。

## 许可证

MIT
