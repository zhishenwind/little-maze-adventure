# Proposal

## Why

当前 React 迷宫游戏已可体验，但尚无版本提交和持续需求档案。用户希望将修改迭代沉淀下来，因此本轮建立代码基线、现行行为规格和可复现的迭代流程。

## What Changes

- 将已实现的 Web 游戏保存为 Git 基线提交；不修改当前游戏行为。
- 引入固定版本 OpenSpec 及项目级 Codex 工作流，提供统一 npm 调用和校验入口。
- 将当前游戏的选择、生成、移动、奖励行为补录为规格，作为后续 delta 的依据。
- 建立中文开发指南、AI 协作约定、交付摘要及验证记录，完成首条可追溯归档。
- 非目标：连接远程 Git 平台、发布线上服务、实现微信小程序、新增游戏功能。

## Capabilities

### New Capabilities

以下前四项为对已有实现的首次规格登记，最后一项为本轮新增的开发流程。

- `adventure-settings`：难度、主题、角色选择及其对进度的影响。
- `maze-generation`：随机迷宫的尺寸、连通性、边界与寻路。
- `maze-play`：拖拽、触屏、方向输入、重试和提示。
- `progress-and-feedback`：通关、星星累计、音效和轻松探索反馈。
- `development-workflow`：Git 历史、OpenSpec 迭代工件、验证和归档。

### Modified Capabilities

无。项目接入前没有 OpenSpec 主规格。

## Impact

更新开发依赖与锁文件，新增 `scripts/openspec.mjs`、`AGENTS.md`、`docs/DEVELOPMENT.md`、`CHANGELOG.md` 和 `openspec/`，生成 `.agents/skills/`。React 源码、游戏数据格式与浏览器行为保持不变。复用已有算法与浏览器测试验证工具接入没有引入回归。
