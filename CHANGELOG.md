# 变更记录

## 未发布

### 2026-11-04 · 支持首次保存后的离线游玩

- 首次访问自动保存完整离线游戏，之后从浏览器缓存打开，断网可切换全部设置并通关。
- 新增保存状态、缓存完整性检查、失败重试和主动更新入口；新版下载失败保留旧版，本地星星与偏好不受影响。
- 新增生产构建离线、手机触屏、缓存恢复、更新与缓存边界的浏览器验证。
- 增加 `npm run offline` 与 Remote-SSH localhost 端口转发说明；普通局域网 HTTP 仍为在线体验。
- [完整迭代档案](openspec/changes/archive/2026-11-04-add-offline-support/verification.md)

### 2026-11-04 · 建立 Git 与 OpenSpec 迭代流程

- 将已有迷宫 Web 游戏保存为初始 Git 基线。
- 接入固定版本 OpenSpec，生成项目级 Codex 工作流，新增统一规格与完整检查命令。
- 补录四项游戏能力和开发流程规格，建立中文协作规范、开发指南及验证记录。
- 本次未改变游戏行为，未连接远程 Git 仓库。
- [完整迭代档案](openspec/changes/archive/2026-11-04-establish-project-baseline/verification.md) · [需求提案](openspec/changes/archive/2026-11-04-establish-project-baseline/proposal.md)

## 0.1.0 · 2026-11-04

首个本地 React Web 基线：

- 三档难度、森林／海洋／星空主题、四种动物与对应目标。
- 随机可解迷宫、鼠标及触屏拖拽、键盘与方向按钮。
- 路线提示、重试、通关庆祝、星星累计和可关闭音效。
- 桌面与手机布局、随机迷宫算法测试及浏览器交互测试。

此处版本对应 package.json 的初始版本，尚未发布到线上或微信小程序。
