# 迷路小森林

为学前儿童制作的中文迷宫小游戏，使用 React + TypeScript + Vite。本地运行，无需后端。

## 启动

需要 Node.js 22.18+（推荐 24 LTS）和 npm。已安装依赖时直接执行：

```sh
npm run dev
```

首次获取项目时先运行 `npm install`。在浏览器打开终端显示的地址，通常为 http://localhost:5173 。开发服务器监听局域网；手机与电脑在同一网络时，可打开终端显示的 Network 地址体验触屏操作。

```sh
npm run build       # 类型检查与生产构建，输出 dist/
npm run preview     # 预览生产构建
npm test            # 迷宫算法测试
npm run test:e2e    # 通过本机 Google Chrome 验证交互
```

端到端测试默认使用已安装的 Google Chrome，无需额外下载浏览器。`npm run test:e2e` 会先构建离线资源；若已手动运行开发服务器，确保其端口为 5173。

## 玩法

- 三档难度：轻松、探索、挑战，尺寸上限为 6×8、8×10、10×12（列×行）。根据可用游戏区域和格子目标大小自动下调尺寸，显示本局实际网格。默认轻松档，4×4 作为可跳过的拖动练习。
- 手机开始后收起设置和装饰，扩大棋盘；可返回设置并继续当前冒险。旋转或调整窗口只重排，不改变当前局尺寸、布局和进度；新冒险才重新适配屏幕。
- 三种场景：奇妙森林、蓝色海洋、梦幻星空。
- 四位角色及对应目标：小兔与胡萝卜、小猫与毛线球、小熊与蜂蜜、小牛伊一与蝴蝶。
- 按住小动物沿通道拖动，支持鼠标和触屏；松手后可以接着走，也可以使用方向按钮、方向键或 WASD。
- 点击“开始冒险”进入游戏；也可以直接拖动角色。游戏中点击“开启新冒险”会生成新迷宫。
- 右上角重试按钮回到当前迷宫起点，保留迷宫布局。切换难度会生成新的对应尺寸迷宫；切换主题、角色不会丢失当前进度。
- 提示显示接下来的几步，3.5 秒后消失；移动后也会消失。
- 到达终点获得三颗星星，显示庆祝弹窗。星星累计及静音偏好保存在当前浏览器的 localStorage；游戏进度不跨刷新保存。
- 无倒计时、扣分或失败惩罚。音效可关闭，系统要求减少动态效果时会关闭动画。

## 代码结构

```text
src/
  App.tsx             # 设置、游戏状态、输入、音效与弹窗
  Artwork.tsx         # 角色头像、目标及主题装饰
  assets/yiyi-avatar.png # 小牛伊一的本地照片头像
  styles.css          # 响应式样式与主题颜色
  game/
    maze.ts           # 独立于 React 的生成、移动规则和寻路
    maze.test.ts      # 固定种子验证矩形迷宫与难度分布
    difficulty.ts     # 难度档位与可用区域适配
tests/game.spec.ts    # 浏览器交互与桌面/手机布局验证
```

迷宫使用随机生长树生成矩形布局，每一格可达，任意两格之间只有一条路径。每局从有限候选中综合路线长度、有效岔路和错路深度选择布局，同尺寸下也保留结构难度梯度。手机三档格宽目标为 56、44、35 CSS 像素；极矮窗口允许滚动，进行中的迷宫不会因旋转而重生成。这些参数是第一版试玩起点，仍需根据儿童实际体验调整。寻路使用广度优先搜索。拖动对指针经过的线段采样并逐格校验墙体，快速拖动也不能穿墙。

“小牛伊一”使用用户照片主体裁切的本地头像，其余角色与场景使用项目内 SVG。头像与其他运行资源一同加入离线包，运行时不需要远程图片或字体，也没有分析、登录或数据上传逻辑。

## 离线体验

游戏现在会在首次联网访问时自动保存完整离线包，包括页面、代码、样式、全部主题与角色。等待页面顶部出现 **离线可用** 后，就可以断网刷新或在同一浏览器重新打开原地址。无需手动下载压缩包，也无需先逐个打开主题。

```sh
npm run offline
```

该命令构建正式资源并在 **4173** 端口启动预览。开发模式 `npm run dev` 不注册离线服务，避免缓存影响热更新。

### Remote-SSH 访问

在编辑器的 Ports／端口转发中，将远程主机的 **4173** 转发到本机 **4173**，然后用本机浏览器打开 **http://localhost:4173/**。首次保存完成后，即使远程主机暂时不可达，也可以在同一浏览器重新打开这个地址游玩。

若使用命令行，可在客户端建立隧道：

```sh
ssh -N -L 4173:127.0.0.1:4173 <你的SSH主机别名>
```

浏览器的 Service Worker 要求 **HTTPS 或 localhost**。普通 `http://192.168.x.x:4173` 局域网地址可以在线访问，但不能启用离线保存；手机离线体验需部署到浏览器信任的 HTTPS 地址。不要通过关闭浏览器安全检查来绕过这一要求。

### 状态、更新与数据

- 页面会显示保存中、离线可用、正在离线游玩或未保存完成；资源保存失败可点击 **重试保存**，不影响当前在线游戏。
- 联网重新访问时检查新版本，后台下载；新包准备完成后显示 **更新并重新打开**。点击前不打断当前迷宫，更新后重新开始当前局，累计星星和静音偏好保留。
- 新版下载失败时继续使用原有可用版本。发现离线缓存不完整时可以重新保存，不以旧的完成标记冒充离线就绪。
- 离线包属于当前浏览器与当前地址（协议、主机和端口）。清理网站数据、换浏览器或换地址后，需要再次联网保存。浏览器可能回收网站缓存，离线存储不等同于永久备份。
- 当前没有接口或第三方 SDK，预缓存只包含构建出的本地游戏资源。未来增加网络能力时，另开 OpenSpec 变更明确数据、身份、SDK 和离线边界。

### 部署与验证

部署 `dist/` 到 HTTPS 静态站点即可，无需后端。`index.html` 和 `sw.js` 建议使用 `Cache-Control: no-cache`，带哈希的 `assets/` 资源可长期缓存；每次部署应保留 Worker 和全部对应构建资源。应用清单提供独立窗口信息，当前验收目标是浏览器离线运行，未承诺各平台的桌面安装体验。

`npm run check:full` 同时验证原有游戏和真实生产离线包，包括断网新开页面、手机触屏通关、下载失败重试、缓存丢失、新版等待／失败恢复与接口缓存边界。测试使用禁止 HTTP 缓存的静态服务器，避免把普通浏览器缓存误当成离线包。

### GitHub Pages

正式地址：[迷路小森林](https://zhishenwind.github.io/little-maze-adventure/)。Pages 的发布来源使用 **GitHub Actions**，不要直接发布 `main` 的源码目录；浏览器不能直接执行 `/src/main.tsx`。

`.github/workflows/pages.yml` 在 `main` 推送或手动运行时安装锁定依赖，执行完整检查，再发布 `dist-pages/`。任一检查失败都不会部署本次产物。GitHub Pages 的子目录构建与本地根路径构建分开：

```sh
npm run build:pages
npm run preview:pages -- --port 4174
# 打开 http://localhost:4174/little-maze-adventure/
```

该构建的脚本、样式、照片、图标和 Worker 使用 `/little-maze-adventure/` 前缀；应用清单的启动地址和作用域也限定在该目录。首次出现“离线可用”后可在相同地址断网重开。默认 `npm run build`、`npm run preview` 继续使用根路径。

`npm run test:e2e` 和 `npm run check:full` 会构建并验证两种部署路径。构建目录 `dist/` 与 `dist-pages/` 均不提交到源码仓库。

## 后续微信小程序迁移

当前版本是 React Web，尚未包含微信小程序工程。`src/game/maze.ts` 是纯 TypeScript，可直接复用规则与寻路。后续可选用 Taro 的 React 方案，再替换 Web SVG、Pointer Events、Web Audio、全屏 API 及 localStorage；或将棋盘视图改为 Canvas，对接小程序触摸与存储 API。保持算法与渲染分离，方便后续迁移。

玩法参考：[Google Play 的 Maze for Kids](https://play.google.com/store/apps/details?id=hu.crabs.kidmaze)。本项目的界面、角色与场景为独立实现。

## 版本管理与需求迭代

项目使用 Git 保存代码历史，使用 OpenSpec 保存需求、验收场景、设计和完成记录。后续功能与修复遵循 [开发与迭代流程](docs/DEVELOPMENT.md)，交付摘要见 [CHANGELOG.md](CHANGELOG.md)，AI 协作约定见 [AGENTS.md](AGENTS.md)。

```sh
npm run spec -- list --specs  # 查看当前能力规格
npm run spec -- list          # 查看活动迭代
npm run check                 # 规格、归档任务、算法测试与生产构建
npm run check:full            # 再加桌面与手机浏览器交互验证
git log --oneline             # 查看迭代提交
```

OpenSpec 安装为固定版本的开发依赖；在其他机器上执行 `npm ci` 即可恢复同样的工具版本。远程仓库为 [zhishenwind/little-maze-adventure](https://github.com/zhishenwind/little-maze-adventure)，源码与 OpenSpec 迭代记录一同通过 Git 保存。

```sh
git clone https://github.com/zhishenwind/little-maze-adventure.git
cd little-maze-adventure
npm ci
npm run dev
```
