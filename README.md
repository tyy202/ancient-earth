# 古地球（Ancient Earth）

一个展示从 6 亿年前到现代海陆分布变化的互动三维地球仪，使用 Three.js / WebGL 在浏览器中渲染，提供 26 个年代的地图和科普说明。

本项目 Fork 自 **[typpo/ancient-earth](https://github.com/typpo/ancient-earth)**，原作者为 Ian Webster。本 Fork 在原项目基础上进行了中文化、离线化、手机适配和 Docker 部署支持。

- 原始仓库：https://github.com/typpo/ancient-earth
- 当前 Fork：https://github.com/tyy202/ancient-earth

## 本 Fork 修改了什么

| 修改方向 | 具体内容 |
| --- | --- |
| 简体中文 | 翻译界面、年代选项、事件菜单、科普说明和错误提示；年代数值与显示文字分离。 |
| 离线运行 | 移除 Google 字体、Google Analytics、Mixpanel、社交分享和外站入口，使用系统字体及本地脚本、图片。 |
| PC 与手机布局 | 电脑保留全屏地球和侧边说明；手机竖屏使用上下控制区，横屏使用右侧控制区，说明可折叠。 |
| 手机交互 | 增大触摸按钮，支持单指旋转、双指缩放及手势衔接，适配安全区和动态视口高度。 |
| 操作与资源管理 | 云层和自转支持关闭后恢复；画布随布局变化调整尺寸；切换年代释放旧材质和纹理。 |
| Docker 部署 | 增加 Dockerfile、Compose 和构建文件过滤规则；部署端直接拉取私有仓库镜像，附带健康检查、重启策略和日志限制。 |
| 自动化验证 | 增加桌面、手机竖屏及横屏的浏览器检查，覆盖年代选择、触摸操作、布局和离线资源访问。 |

地图和年代数据沿用原项目，未新增板块运动计算或城市位置追踪。年代切换通过加载已有地图贴图实现，不是连续的地质演化模拟。

## Docker 一键运行（推荐）

安装并启动 Docker（Windows 使用 Docker Desktop 的 Linux 容器模式），将 `compose.yaml` 放到部署目录后执行：

```sh
docker compose pull
docker compose up -d
```

电脑打开 `http://localhost:8080`；同一 Wi-Fi 下的手机打开 `http://电脑的局域网IP:8080`。请确保防火墙允许专用网络访问该端口。

Compose 直接使用私有仓库中的 `192.168.18.100:5000/ancient-earth:v1.0`，不在部署机器上构建，也不需要源码。首次部署前，请先按下文构建并推送该镜像。拉取镜像时需要能访问私有仓库，启动后网站无需访问外网。宿主机需要保持 Docker 运行。

常用命令：

```sh
# 仓库发布新镜像后，拉取并更新容器
docker compose pull
docker compose up -d

# 查看运行状态和日志
docker compose ps
docker compose logs --tail=100

# 停止并移除本项目容器
docker compose down
```

容器名固定为 `ancient-earth`，使用 `bridge` 网络，默认端口为 `8080`。如需修改端口，在 `compose.yaml` 所在目录创建 `.env`，例如写入 `PORT=8090`，然后重新执行启动命令。容器配置了健康检查、自动重启和日志大小限制，不需要挂载数据目录。

### 构建并推送镜像（开发机器）

在包含源码和 Dockerfile 的项目目录执行：

```sh
docker build -t 192.168.18.100:5000/ancient-earth:v1.0 .
docker push 192.168.18.100:5000/ancient-earth:v1.0
```

发布新版本时，请同时更新构建命令、推送命令和 `compose.yaml` 中的镜像标签，确保三者一致。

Dockerfile 使用私有仓库中的 `192.168.18.100:5000/nginx:stable-alpine` 作为基础镜像，只打包网页、样式、脚本和实际使用的地图图片，无需 Node.js、Python 或数据库。基础镜像需要预先存在于该仓库中。如果仓库启用了认证，先运行 `docker login 192.168.18.100:5000`。

## 本地运行

在项目目录中运行：

```sh
python -m http.server 8000 --bind 127.0.0.1
```

然后使用支持 WebGL 的浏览器打开 `http://127.0.0.1:8000`。

所有运行所需的脚本、地图和图片都已包含在本地。页面使用系统字体，不加载外部字体或统计脚本，也不包含社交分享和外站跳转入口。本地服务运行时，无需连接互联网。

## 操作方式

- 拖动地球改变观察角度，滚动鼠标滚轮缩放。
- 使用顶部下拉菜单或左右方向键切换年代。
- 使用“跳转到”菜单查看预设的地质时期或生命演化事件。
- 点击“隐藏云层”或“停止自转”调整展示效果。
- 再次点击“显示云层”或“恢复自转”可恢复对应效果。
- 网址中的 `#600` 表示 6 亿年前，`#0` 表示现代。

中文说明依据原项目文字翻译，沿用原项目的年代与事件对应关系。

## 手机使用

电脑和手机共用同一地址，根据屏幕宽度和触摸设备自动切换布局：

- 电脑：全屏地球、右上方控制区、左下方年代说明，支持鼠标和键盘操作。
- 手机竖屏：顶部大按钮，中间独立地球区域，底部说明默认折叠。
- 手机横屏：控制区和说明移到右侧，给地球保留独立区域。
- 手机用单指旋转、双指缩放；支持缩放后继续单指拖动。为避免误操作，手机禁用三指平移。
- 适配 iPhone 安全区和浏览器动态高度；切换横竖屏或展开说明时，画布自动调整大小。

目标浏览器为安卓 Chrome（包括小米手机）和 iOS Safari，需要设备支持 WebGL。自动化验证使用 Chromium 的桌面及手机触摸模拟，不能替代小米和 iPhone 真机测试。

手机与电脑连接同一个 Wi-Fi 后，在电脑的项目目录运行：

```sh
python -m http.server 8000 --bind 0.0.0.0
```

手机访问 `http://电脑的局域网IP:8000`。可用 Windows 的 `ipconfig` 查看当前 Wi-Fi 的 IPv4 地址。如果无法连接，请检查本地防火墙是否允许该服务通过专用网络。电脑需保持服务运行，手机不能使用电脑的 `127.0.0.1` 地址。

## 开发验证

在已安装 Playwright 及 Chromium 的开发环境中运行 `node tests/responsive.cjs`。可通过 `CHROME_PATH` 指定浏览器可执行文件，通过 `SCREENSHOT_DIR` 指定已存在的截图目录。测试覆盖桌面/手机横竖屏、触摸旋转与缩放、年代切换、说明折叠、控件尺寸和离线资源访问。Playwright 仅用于测试，网站运行不依赖它。

## 来源与致谢

- 原始仓库：[typpo/ancient-earth](https://github.com/typpo/ancient-earth)，作者 Ian Webster。

- [原项目在线展示](http://dinosaurpictures.org/ancient-earth/#600)
- 地图纹理由[北亚利桑那大学](http://www2.nau.edu/rcb7/rect_globe.html)提供。

以上链接仅用于来源说明，不是运行依赖。保留原项目版权声明与许可证，详见 [LICENSE](LICENSE)。
