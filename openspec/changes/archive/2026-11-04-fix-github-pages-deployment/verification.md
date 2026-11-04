# 验证记录

日期：2026-11-04（Asia/Shanghai）

## 问题与证据

用户报告 `https://zhishenwind.github.io/little-maze-adventure/` 只有标题、页面白屏。

- 线上 HTML 返回 200，但 root 为空，仍引用开发入口 `/src/main.tsx`。
- 真实 Chrome 记录 `/src/main.tsx` 与 `/favicon.svg` 返回 404，React 未启动。
- GitHub Pages API 显示 build_type 为 legacy、source 为 main 的 `/`：平台构建成功不代表 React 已被打包，实际发布的是源码目录。
- Vite 默认根路径与仓库子目录不匹配，应用清单也使用根路径入口与图标。

## 最终修复范围

- 使用 `build:pages` 与 `preview:pages`，指定 `/little-maze-adventure/` 前缀并输出独立 `dist-pages/`。
- 应用清单改为相对入口、作用域和图标；Vite 重写 HTML 中的脚本、样式、清单及图标地址。
- Pages 从 legacy 改为 workflow，GitHub Actions 先执行 `check:pages`，成功后上传并发布 `dist-pages/`，不发布源码目录。
- `check:pages` 专门检查类型、规格、生产构建、子目录资源加载、照片、清单与离线范围；不运行算法和通用页面交互测试。
- 不修改游戏源码、算法或原有游戏测试。保留通用完整检查入口，部署与游戏检查职责分开。

## 已运行的本地验证

| 命令／检查 | 实际结果 |
| --- | --- |
| `npm run build:pages` | 类型和生产构建通过；HTML 使用 `/little-maze-adventure/assets/`、正确清单和图标地址，无 `/src/main.tsx` |
| `npx playwright test tests/pages.spec.ts` | 3 项部署验证通过：资源和清单正确；Worker 范围及断网重开正常；子目录生产包触屏可通关 |
| `npm run check:pages` | 规格、类型、Pages 构建与 3 项部署浏览器检查全部通过 |
| 工作流 YAML | 可解析；main 触发；deploy 依赖 build；上传目录为 dist-pages；失败时保留诊断产物 |
| `git diff --check` | 通过 |
| `git check-ignore dist/index.html dist-pages/index.html` | 两个产物目录均被忽略，不提交构建产物 |
| `git diff --exit-code bda6083 -- src/App.tsx src/styles.css tests/game.spec.ts src/game` | 返回 0，无差异；本轮交互实验已撤回 |
| 归档后 `npm run spec:validate`、`npm run spec -- list` | 7 项主规格与 5 项归档全部通过，无活动变更；主规格已逐段核对后再归档 |

## 过程与范围收敛

前期将全部游戏回归放入发布流程，云端的三项模拟触摸后点按检查失败，导致部署任务一直被阻止。运行记录包括 41799944473、41801163715、41802268602、41802766088、41803664916；页面资源与离线专项检查始终通过。相关本机全量检查曾通过，但这些结果不能作为线上已修复的依据。

用户明确要求聚焦 Actions 构建与部署，指出算法和页面逻辑不属于本次白屏排查范围。因此撤回本轮所有交互代码和游戏测试实验，发布门槛改为与白屏直接相关的部署检查；没有删除或放宽已有游戏断言。保留配套测试浏览器及失败诊断，避免系统 Chrome 的每次升级影响部署环境。

## 发布与线上验收

用户已通过官方浏览器流程补充 workflow 权限，Pages 已切换为 workflow 来源，地址、HTTPS 与既有公开访问方式保持不变。

- 修复提交 `75d3da6` 已推送至 main 与修复分支。
- [GitHub Actions 41806036073](https://github.com/zhishenwind/little-maze-adventure/actions/runs/41806036073) 的 build、部署检查、产物上传及 deploy 全部成功；部署于北京时间 2026-11-04 17:17 完成。
- 真实 Chrome 访问用户原始地址，首页返回 200，root 挂载 1 个应用节点，页面标题、设置和迷宫正常显示，无浏览器异常或资源 404。
- `/little-maze-adventure/assets/index-DyfgQ3pv.js` 返回 200，MIME 为 `application/javascript`；CSS 返回 200，MIME 为 `text/css`，不再请求开发入口 `/src/main.tsx`。
- 照片成功解码为 512×512，清单入口和作用域解析到仓库目录；Worker scope 同为该目录，6 项预缓存均位于应用范围内。
- 断网关闭页面后以新标签页重开原地址，返回 200，响应来自 Service Worker，React 正常挂载并显示离线状态。
- 390×844 手机视口正常渲染，文档宽度为 390，无横向溢出。人工查看真实站点截图确认页面已恢复，截图未提交。

主规格与归档记录在实际线上验收后同步，文档归档提交使用 `[skip ci]`，避免仅更新验收记录再次构建；线上代码对应已成功部署的 `75d3da6`，没有未发布的运行代码改动。

## 边界

未新增运行时接口、SDK 或依赖，离线边界仍只包含本地构建资源。线上手机验证采用浏览器触屏模拟，不等同于微信小程序真机验收。
