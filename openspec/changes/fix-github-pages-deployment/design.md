# Design

## Context

线上已通过真实 Chrome 复现：root 为空，`/src/main.tsx` 与 `/favicon.svg` 返回 404。Pages 当前 source 为 main 的 `/`，build_type 为 legacy。现有 Worker 已通过 Vite BASE_URL 注册，预缓存 URL 相对 Worker 所在目录；应用清单仍硬编码根路径。

## Goals / Non-Goals

- 修复同一线上地址，保留本地根路径预览和现有缓存边界。
- 发布产物与源代码、根路径测试产物与 Pages 测试产物分别保存。
- 不增加游戏能力、托管平台、运行时网络请求或小程序工程。

## Decisions

- 使用独立 `build:pages` 命令传递 Vite base `/little-maze-adventure/` 并输出到 `dist-pages/`。默认 build 仍输出根路径 `dist/`，避免影响现有本地预览和测试。两个目录都不提交。
- 应用清单的 id、start_url、scope 使用 `./`，图标使用相对 URL；HTML 的公共资源链接由 Vite 根据 base 重写。无需更改已经支持 BASE_URL 的 Worker 注册逻辑。
- GitHub Actions 在 main 推送或手动触发时执行锁定安装、Chrome 安装、完整根路径及子目录检查，再上传 `dist-pages/`，由单独部署任务发布。部署权限限制到 pages 与 OIDC，使用 github-pages 环境；失败检查阻止部署。
- 将 Pages 构建来源从 legacy 切换为 workflow，保持 URL、HTTPS 与既有公开访问方式。以远程 Actions 结果及真实 Chrome 在线／断网复查作为发布验收。
- 静态测试服务器增加可选构建目录和路径前缀，默认行为保留；子目录外请求返回 404，不提供开发服务器式首页回退，确保错误路径不会被测试掩盖。

## Risks / Trade-offs

- GitHub OAuth 需要 workflow 权限才能推送发布配置 → 本地完成可审阅修复与验收后，再通过官方浏览器流程补充该权限。
- 浏览器或 CDN 保留旧 HTML → 发布后核对真实脚本路径、资源响应与首次访问渲染，不仅检查 Actions 为成功。
- 已有离线用户继续旧版本 → 保留主动更新流程，不强制清空缓存或丢失星星。
- CI 与本机平台不同 → 记录本机检查及实际云端构建结果，使用同一 npm 检查入口。

## Migration Plan

先验证两个构建，再提交修复。配置 Pages workflow 来源并推送 main，等待部署后复查线上。回滚时重跑先前成功的生产构建；不恢复直接发布 React 源码的配置。
