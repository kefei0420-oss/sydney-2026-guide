# 悉尼六天五晚

2026年12月6日至11日，悉尼六天五晚图文攻略。

静态网页保留 TREK 的互动地图、六天日期切换、景点照片、航班与住宿信息。朋友无需登录，不依赖本地 Docker。

运行 `npm ci && npm run build`，将 `docs/` 发布到 GitHub Pages。修改 `trip.json` 后重新构建并推送即可更新。

验证：`CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm test`；验证线上可另设 `GUIDE_URL`。

两程航班及 Airbnb 住宿均已由用户确认，房东也已确认到达日可以寄存行李。网页不包含门牌号、订单号、凭据和后台接口。地图虚线只表示顺序，不是实际道路或航线。

实景图片已下载到仓库。Wikimedia Commons 图片按各自许可署名，Airbnb 室内照片来自用户指定的公开房源页面，版权归原权利人；网页的「图片来源」和 photo-credits.json 保留来源。代码许可证不适用于照片。

基于 [TREK](https://github.com/liketrek/TREK/tree/b98787f83698f3beee1b9a8475121c52f0caf07c)，代码遵循 AGPL-3.0，见 LICENSE。页面源码在 vendor/，静态适配器和构建代码在根目录。地图使用 OpenFreeMap，需要联网。

开放和交通信息于2026年11月3日核对；出发前看官方公告、天气和航班动态。
