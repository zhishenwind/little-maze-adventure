# Design

## Context

线上已通过真实 Chrome 复现：root 为空，`/src/main.tsx` 与 `/favicon.svg` 返回 404。Pages source 为 main 的 `/`，build_type 为 legacy。现有 Worker 已通过 Vite BASE_URL 注册，预缓存 URL 相对 Worker 所在目录；应用清单硬编码根路径。

## Goals / Non-Goals

- 修复同一线上地址，保留本地根路径预览和现有缓存边界。
- 发布产物与源代码、根路径测试产物与 Pages 测试产物分别保存。
- 本轮聚焦构建、资源路径和发布，不修改已有页面交互或算法。

## Decisions

- 独立 `build:pages` 命令传递 Vite base `/little-maze-adventure/`，输出 `dist-pages/`。默认 build 仍输出根路径 `dist/`，两个目录都不提交。
- 应用清单 id、start_url、scope 使用 `./`，图标使用相对 URL；HTML 公共资源链接由 Vite 根据 base 重写。现有 Worker 注册和预缓存逻辑无需修改。
- `check:pages` 专门校验类型、规格、Pages 构建、实际子目录资源与离线包。算法和通用交互保留独立完整检查入口，避免与白屏原因无关的环境差异阻塞部署修复。
- GitHub Actions 在 main 推送或手动触发时执行锁定安装、配套 Chromium 安装及部署检查，再上传 `dist-pages/`，由依赖 build 的单独任务发布。权限限制到 Pages 和 OIDC，使用 github-pages 环境。
- 将 Pages 来源从 legacy 切换为 workflow，保持 URL、HTTPS 与既有访问方式。以远程运行成功、线上真实脚本响应及浏览器渲染作为交付依据。
- 静态测试服务器支持构建目录和路径前缀，子目录外返回 404，不提供开发服务器式首页回退，避免掩盖错误路径。
- 浏览器失败时保留 trace、截图和三天的 CI 诊断产物，不写入源码或 Pages 站点。

## Risks / Trade-offs

- 推送工作流需要 GitHub workflow 权限 → 通过官方浏览器流程授权，不在文件或 URL 保存 Token。
- 浏览器与 CDN 保留旧 HTML → 发布后复查真实入口和资源，不能只看 Actions 成功。
- 已有离线用户继续旧版本 → 保留主动更新，不强制清缓存或丢失星星。

## Migration Plan

先完成本地部署检查，提交并配置 Pages 为 workflow 来源，推送 main 后等待部署并检查线上。回滚重跑先前成功的生产构建，不恢复直接发布 React 源码的配置。
