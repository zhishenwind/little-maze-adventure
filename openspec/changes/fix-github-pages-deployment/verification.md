# 验证记录

日期：2026-11-04（Asia/Shanghai）

## 问题与证据

用户报告 `https://zhishenwind.github.io/little-maze-adventure/` 白屏。

- 线上 HTML 返回 200，但 root 为空，仍引用开发入口 `/src/main.tsx`。
- 真实 Chrome 记录 `/src/main.tsx` 与 `/favicon.svg` 返回 404，React 未启动。
- GitHub Pages API 显示 `build_type: legacy`、source 为 main 的 `/`，构建任务虽然成功，却只发布源码目录。
- Vite 默认根路径构建无法满足仓库子目录，应用清单也硬编码了根路径入口与图标。

## 修复

- 增加 `build:pages` 与 `preview:pages`，使用 `/little-maze-adventure/` 前缀与独立 `dist-pages/`，保留本地根路径构建。
- 清单改为相对 id、start_url、scope 与图标；Vite 正确重写 HTML 的资源 URL，现有 Worker BASE_URL 注册及相对预缓存无需修改。
- 新增 GitHub Pages Actions 工作流，通过锁定依赖安装、类型、规格、算法及浏览器检查后才上传和部署产物。
- 部署任务只在 build 成功后执行，使用 github-pages 环境及限定的 Pages/OIDC 权限。
- 测试静态服务支持指定构建目录与前缀，不为错误路径返回首页，防止开发服务器掩盖路径错误。

## 本地检查

| 命令／检查 | 实际结果 |
| --- | --- |
| `npm run build:pages` | 类型检查与生产构建通过；HTML 使用 `/little-maze-adventure/assets/`、正确清单及图标地址，无开发入口 |
| `npx playwright test tests/pages.spec.ts` | 3 项通过：子目录资源、照片和清单；Worker 作用域及断网新标签页通关；手机边界阻挡、松手续拖及离线通关 |
| `npm run check:full` | 严格规格校验、11 项算法测试、两个生产构建与全部 23 项浏览器测试通过 |
| 工作流 YAML | 使用项目已安装的 yaml 解析，并核对 main 触发、deploy 依赖 build、上传目录为 dist-pages，检查通过 |
| `git diff --check` | 通过，无空白错误 |
| `git check-ignore dist/index.html dist-pages/index.html` | 两个产物目录均被忽略，不提交构建产物或测试截图 |

专项浏览器测试确认：JavaScript、CSS、图标及照片均从仓库目录加载，没有资源 404 或页面异常；应用清单所有入口正确解析到该目录。Worker 的 registration scope 和全部预缓存 URL 均在该目录，其他应用的导航仍返回 404，没有被游戏首页替代。

## 发布与线上验收

待完成：现有 GitHub OAuth 授权缺少 workflow 权限，需通过官方浏览器流程补充后推送工作流，切换 Pages 为 workflow 来源，等待云端部署并复查真实 HTTPS 地址。本地验收不等同于线上已经修复，此处在实际发布后补充结果。

## 范围与限制

- 没有修改迷宫算法、游戏交互或新增运行时接口／SDK；预缓存边界仍只包含本地构建资源。
- 保留既有站点地址、HTTPS 和已启用的公开访问方式，不改变仓库可见性。
- GitHub Pages 不支持自定义每项资源的响应头；继续使用资源哈希、Worker 更新与用户主动激活机制。
- 手机验收为 Chrome 触屏模拟，不代表已创建或验收微信小程序工程。
