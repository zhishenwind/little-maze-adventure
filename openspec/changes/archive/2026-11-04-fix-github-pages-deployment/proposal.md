# Proposal

## Why

当前 GitHub Pages 直接发布 main 根目录，线上 HTML 引用未构建的 `/src/main.tsx` 并返回 404，导致白屏。站点部署在 `/little-maze-adventure/`，构建资源、应用入口和离线作用域都需要遵守该前缀。

## What Changes

- 使用 GitHub Actions 安装锁定依赖、执行部署检查并发布生产产物，替代源码目录发布。
- 增加仓库子目录的专用构建、预览和部署检查命令，保留默认根路径本地构建。
- 让图标、应用清单、启动地址和 Service Worker 在根路径及仓库子目录均正确解析，缓存不越过应用作用域。
- 补充真实子目录静态服务的加载与离线验证，并在发布后复查线上页面。

## Capabilities

### New Capabilities

- `static-deployment`：构建产物发布、子目录资源定位和发布前检查。

### Modified Capabilities

- `offline-play`：子目录中的入口、作用域与离线资源边界。

## Impact

涉及 npm 构建命令、应用清单、GitHub Actions、Pages 发布来源、静态测试服务、部署验证与文档。不修改迷宫算法或现有页面交互，不增加运行时接口、第三方 SDK 或依赖。线上地址及其既有公开访问方式保持不变。
