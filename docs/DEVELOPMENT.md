# 开发与迭代流程

代码历史由 Git 保存，当前行为由 OpenSpec 主规格说明，每轮变更的动机、设计、任务及验证由变更目录保存。`CHANGELOG.md` 提供面向人的交付摘要。项目已安装固定版本的 OpenSpec，执行 `npm ci` 后即可使用，无需全局安装。

## 目录与职责

| 位置                                               | 保存的内容                                                   |
| -------------------------------------------------- | ------------------------------------------------------------ |
| `AGENTS.md`                                        | 后续 AI 协作者必须读取的项目约定                             |
| `openspec/config.yaml`                             | 项目上下文、语言与工件规则                                   |
| `openspec/specs/<capability>/spec.md`              | 已交付行为及验收场景                                         |
| `openspec/changes/<change-id>/`                    | 活动迭代的 proposal、design、spec delta、tasks、verification |
| `openspec/changes/archive/YYYY-MM-DD-<change-id>/` | 已完成迭代的完整记录                                         |
| `.agents/skills/openspec-*/`                       | OpenSpec 官方生成的项目级 Codex 工作流技能                   |
| `CHANGELOG.md`                                     | 每轮交付摘要和对应变更档案链接                               |

主规格只描述已经交付的行为；未来微信小程序、关卡系统等想法在对应提案中讨论，未实现时不写成已支持。

## 一轮迭代

1. **读取现状**：检查 `git status`、相关主规格和活动变更，明确本轮范围。较大变更建立 `feat/<change-id>` 或 `fix/<change-id>` 分支。
2. **记录需求**：创建 kebab-case 命名的变更，如 `add-ocean-collectibles`。在 `proposal.md` 说明原因、范围与受影响能力，在 delta spec 中写验收场景；有技术决策时补 `design.md`，在 `tasks.md` 列可勾选步骤。
3. **实施与同步任务**：按任务修改代码，完成一项再勾选一项。需求变化时同步更新工件。只要求提案的迭代停留在规划阶段；已授权实施的迭代继续实现和验证。
4. **验证并记录**：运行适当检查，把实际命令、结果和限制写进该变更的 `verification.md`；用户可见交付更新 `CHANGELOG.md`。
5. **同步和归档**：任务完成且验证通过后运行归档，CLI 会把 delta 应用到主规格，再将整个变更移入归档。检查主规格及归档内容，再跑规格校验。
6. **形成提交**：检查 `git diff` 与暂存内容，将相关代码、规格、验证记录一起提交。提交后用 `git status` 和 `git log` 确认。除非用户要求，不推送到远程。

### 命令示例

```sh
# 查阅已交付能力与工作中的迭代
npm run spec -- list --specs
npm run spec -- list

# 创建迭代；该命令只建立目录和元数据，不会自动写好提案或实现代码
npm run spec -- new change add-ocean-collectibles
npm run spec -- status --change add-ocean-collectibles
npm run spec -- instructions proposal --change add-ocean-collectibles

# 编写工件后检查结构
npm run spec:validate

# 基础检查：规格与归档任务 + 算法测试 + 类型检查和生产构建
npm run check

# 涉及游戏输入、页面交互、布局时执行完整检查
npm run check:full

# 所有任务完成且检查通过后，归档并同步主规格
npm run spec -- archive add-ocean-collectibles --yes
npm run spec:validate

# 查看历史及本轮修改
git log --oneline
git diff
git status --short
```

`npm run spec:validate` 分别校验现行规格／活动变更的结构和归档任务完成度；它不能代替对实现是否符合规格的人工核对与测试。`npm run check:full` 的浏览器测试需要本机安装 Google Chrome；环境不具备时记录限制，不把未运行的检查写为通过。

### 在对话中使用

可以直接说：“新增一个……功能，按项目 OpenSpec 流程完成并保存迭代记录”。项目规则会让协作者把本轮工作落到变更档案与 Git 提交中。

OpenSpec 初始化为 Codex 生成了 propose、apply、update、sync、archive、explore 六个技能。需要单独调用技能时，可使用 `$openspec-propose`、`$openspec-apply-change`、`$openspec-update-change`、`$openspec-sync-specs`、`$openspec-archive-change`、`$openspec-explore`。新生成的技能可能需要重新打开会话才能被发现；在此之前 CLI 命令和项目文档已经可用。只调用 propose 时仅产出提案，之后再发起实施请求。

### 一个验收场景的格式

```markdown
## ADDED Requirements

### Requirement: 海洋收集物

系统 SHALL 在海洋主题的指定通道显示本轮定义的收集物。

#### Scenario: 小动物经过收集物

- **WHEN** 小动物沿可通行路径进入收集物所在格子
- **THEN** 该收集物被标记为已收集且角色仍不能穿墙
```

已有能力变更使用 `MODIFIED Requirements`，并给出该 Requirement 更新后的完整描述与场景；移除行为使用 `REMOVED Requirements`。标题、标识与英文关键词保留标准格式，正文使用中文。

## Git 约定

- `main` 保存项目当前基线；单个逻辑迭代优先对应一个清晰的提交或功能分支。
- 提交消息示例：`feat: add ocean collectibles`、`fix: preserve drag position after touch release`。
- 提交相关源码、锁文件、现行规格、归档、验证记录及变更摘要。
- 本项目当前仅建立本地仓库，远程备份需要后续指定 Git 托管地址。首次克隆使用 `npm ci` 安装锁定依赖。
- 极小的无行为维护允许直接提交，避免为一个错别字创建完整工件；行为变更和缺陷修复仍走 OpenSpec。

## 验证记录建议

在 `verification.md` 中写清：用户原始诉求、本轮范围、实施结果、关键决策、每条检查命令及实际结果、未解决事项。Git 保存精确差异与提交时间，文档保存原因和验收依据，不需要把每次提交哈希重复抄进规格。

当前基线档案位于 `openspec/changes/archive/2026-11-04-establish-project-baseline/`，可作为第一轮参考。

## 官方参考

- [OpenSpec 项目](https://github.com/Fission-AI/OpenSpec)
- [项目初始化](https://openspec.dev/docs/setup)
- [CLI 参考](https://openspec.dev/docs/cli)

## 离线能力维护

- `scripts/offline-build.ts` 将 Worker 与应用一同编译，自动为实际构建输出与 public 静态资源生成 SHA-256 预缓存清单。增加资源时需确认扩展名在允许列表内，所有游戏资源均应来自受版本管理的本地文件。
- `src/sw.js` 负责 Workbox 预缓存、缓存健康查询和用户触发的版本激活；`src/offline.ts` 管理注册与状态，`src/OfflineNotice.tsx` 展示反馈。不要在开发服务器启用离线服务。
- 执行 `npm run offline` 在 4173 体验生产构建；Remote-SSH 使用 localhost 端口转发，手机需使用受信任 HTTPS。浏览器会按地址隔离离线包。
- `tests/offline.spec.ts` 使用真实 Worker 和禁止 HTTP 缓存的生产资源服务器，验证离线重开、完整玩法、故障恢复、版本等待与缓存边界。不要用页面路由拦截冒充 Worker 真实网络失败。
- 不为未来接口、身份或第三方 SDK 默认启用离线缓存。新增网络请求时建立独立变更，明确敏感数据、断网行为、更新策略与缓存撤销规则。
