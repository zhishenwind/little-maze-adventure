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
| `npm run check:full` | 初版 23 项浏览器测试通过；补充触控配置与快速点按回归后，严格规格校验、11 项算法测试、两个生产构建与全部 24 项浏览器测试通过 |
| 工作流 YAML | 使用项目已安装的 yaml 解析，并核对 main 触发、deploy 依赖 build、上传目录为 dist-pages，检查通过 |
| `git diff --check` | 通过，无空白错误 |
| `git check-ignore dist/index.html dist-pages/index.html` | 两个产物目录均被忽略，不提交构建产物或测试截图 |

专项浏览器测试确认：JavaScript、CSS、图标及照片均从仓库目录加载，没有资源 404 或页面异常；应用清单所有入口正确解析到该目录。Worker 的 registration scope 和全部预缓存 URL 均在该目录，其他应用的导航仍返回 404，没有被游戏首页替代。

## 发布与线上验收

- 用户已通过官方浏览器流程补充 workflow 授权，Pages 已从 legacy 切为 workflow 来源，保持原有地址及公开访问设置。
- 首次云端运行 [41799944473](https://github.com/zhishenwind/little-maze-adventure/actions/runs/41799944473)：安装、规格、算法及双构建通过，浏览器 20 项通过、3 项拖动后的按钮测试失败，部署被阻止。本机 Chrome 为 156.0.8078.80，云端安装 Chrome 157.0.8103.38；补充按钮触控属性与逐次点按回归，并保存后续 CI 失败诊断。
- 待完成：重新执行云端检查与部署，并复查真实 HTTPS 地址。此处在实际发布后补充结果。
- 后续运行 41801163715 与原生事件诊断运行 41802268602 仍被同一类按钮回归阻止。诊断确认：按钮内 SVG 收到 pointerdown、pointerup 和 touchend，但没有 click；开始按钮的文字目标可正常触发 click。隔离的 macOS Chrome 157.0.8103.38 完整 24 项仍通过。将装饰 SVG 从按钮命中测试中排除，使按钮承接触控；保留相同回归以在云端验证。

## 范围与限制

- 没有修改迷宫算法或新增运行时接口／SDK；按钮仅补足触控属性，操作规则保持不变，预缓存边界仍只包含本地构建资源。
- 保留既有站点地址、HTTPS 和已启用的公开访问方式，不改变仓库可见性。
- GitHub Pages 不支持自定义每项资源的响应头；继续使用资源哈希、Worker 更新与用户主动激活机制。
- 手机验收为 Chrome 触屏模拟，不代表已创建或验收微信小程序工程。
