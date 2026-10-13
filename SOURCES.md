# 世界视觉档案：图片与参考来源

## 当前真实星空与轨道模型

- 背景原图：[The Milky Way panorama](https://www.eso.org/public/images/eso0932a/)，ESO/S. Brunier，6000×3000真实全天实拍拼接；下载地址 https://cdn.eso.org/images/large/eso0932a.jpg ，本地 `assets/eso-milkyway-6k.jpg`。遵循 [ESO CC BY 4.0 使用条款](https://www.eso.org/public/outreach/copyright/)，网页保留清晰、可点击署名。只做天球投影、观察方向旋转，没有AI修改。
- [Spacekit](https://github.com/typpo/spacekit)、[Stellarium Web Engine](https://github.com/Stellarium/stellarium-web-engine)、[Three.js CSS3DRenderer](https://threejs.org/docs/pages/CSS3DRenderer.html) 为功能和架构研究参考，未复制代码、未新增运行时依赖。
- 导航小星球为实时三维网格设计符号；轨道遵循设计参数下的二体开普勒模型。轨道辅助线、时间加速和尺寸比例均为交互示意，不是实测天体。旧版AI银河及球体图保留在目录中，但不再用于当前WebGL场景。

南昌画册使用用户提供的 79 张旅行影像；其余三本主题画册使用 Unsplash 的高分辨率影像。此文件保留每张素材的原始页面，便于复核作者与许可信息。

## 3D 地球贴图

- 当前银河背景与十个彩色小星球为内置图像生成的独立美术素材，分别保存在 `assets/galaxy-reference.jpg` 和 `assets/planets/`。提示词：深黑银河、左侧蓝紫尘埃、密集微星、中心留暗；十色立体小星球、冷色侧光、真实透明背景。它们是视觉设计，不是实测天体。
- 城市地图道路、水系、岸线来源：OpenStreetMap contributors，经公开 Overpass 只读接口一次提取并缓存。南昌 7774 个地图元素，直岛 2323 个地图元素。现场地图保留可见署名。许可与来源：https://www.openstreetmap.org/copyright 。非导航用途，旅游地标点为示意定位。
- 冰岛、摩洛哥地图沿用 Natural Earth 国家边界。公开道路接口返回超时，因此未伪造国家内部路网。
- 当前投影参照用户的 Venice 图片复现地图编辑样式，使用 Georgia / Times New Roman 衬线字形、细白线、地标引线、公里尺及北向标。未复制威尼斯地图到南昌，也不声称拥有参考图的原始字体文件。

- 夜间灯光：NASA Earth Observatory / Black Marble 2016，官方页面 https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps/ 。原始 13500 × 6750 彩色全球图：https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/144000/144898/BlackMarble_2016_3km.jpg 。网页使用 4096 × 2048 本地副本，按真实经纬度叠加到 WebGL 球面上。夜间地图是卫星数据合成，不是实时城市灯光。
- 夜景表现参考用户提供的 SpaceEngine 截图；未复制截图、水印或 SpaceEngine 软件资源。光照、夜面灯光发射、云层和薄层大气辉光由项目独立渲染。
- 全部画册投影地图使用真实坐标。南昌使用江西地级市边界；冰岛、日本、摩洛哥使用 Natural Earth 1:50m 国家边界（公开领域）：https://www.naturalearthdata.com/about/terms-of-use/ 。这些是旅行定位示意，不用于导航。
- 小行星美术 `assets/asteroid.png`：用内置图像生成工具生成的透明岩石素材，轨道倾角、节点、深度排序、变形与选择行为均由代码计算。并非真实小行星观测资料。

- 当前 4K 贴图 `assets/earth-blue-marble-4k.jpg` 由 NASA SVS 的 8192 × 4096 原图缩小到 4096 × 2048，以兼顾细节与加载速度。原图：https://svs.gsfc.nasa.gov/vis/a000000/a003600/a003615/flat_earth_Largest_still.0330.jpg
- 星空、银河尘埃、辉光及投影光束由代码绘制。画册轨道为两层空间圆环，悬停时停止旋转。
- 十本画册的投影照片 `assets/orbit/` 从原画册已有照片生成。南昌使用用户原始南昌站旅行照片，未新增个人资料来源。

- 当前贴图 `assets/earth-blue-marble-2k.jpg`：NASA/Goddard Space Flight Center Scientific Visualization Studio，Equirectangular Projected Earth for LARGEST，2048 × 1024。https://svs.gsfc.nasa.gov/3615/
- 江西地图行政区域：阿里云 DataV 地理边界服务，江西省各地级市边界。https://geo.datav.aliyun.com/areas_v3/bound/360000_full.json 。南昌定位为 28.68° N，115.86° E。
- 高清贴图与区域地图直接嵌入 `system.js`；通过 WebGL 球体网格实时旋转、缩放，并以同一地理坐标变换投影地点标记。

- `assets/earth-blue-marble.jpg`：NASA Goddard Space Flight Center Scientific Visualization Studio，Blue Marble 2015 平面地图贴图（1024 × 512）。原始页面：https://svs.gsfc.nasa.gov/30763
- 网页在本地 Canvas 中对该等距柱状投影贴图进行球面采样、明暗计算与大气辉光渲染；星空、轨道、地点标记和流光均由项目代码实时生成。

## 火与冰 / Iceland

- Markus Wagner — [Black sand beach](https://unsplash.com/photos/a-black-sand-beach-with-a-cliff-in-the-background-litQKjb5tK8)
- Dmitri Zotov — [Volcanic landscape](https://unsplash.com/photos/a-large-mountain-with-a-lot-of-lava-on-top-of-it-fOddl0TBg54)
- Jonas Degener — [Ocean waves](https://unsplash.com/photos/HaSfqc6UaXs)
- Chris Turgeon — [Solitary figure](https://unsplash.com/photos/drQTbSFO5oc)
- Bernd Dittrich — [Aerial coast](https://unsplash.com/photos/qRjb6veWdp4)
- Theodor Vasile — [Yellow figure](https://unsplash.com/photos/717kr1-K744)

## 岛与几何 / Setouchi

- Urusy — [Sea bridge](https://unsplash.com/photos/LXhDi2S0t0o)
- wwonderlust.com — [Metal pier](https://unsplash.com/photos/a-metal-pier-leads-to-the-calm-ocean-SdjFmoOpQlM)
- wwonderlust.com — [Island road](https://unsplash.com/photos/CWcDZm6O9uQ)
- Hotaria N — [Lighthouse](https://unsplash.com/photos/cFeTuDnGXPs)
- Susan Q Yin — [Blue grid](https://unsplash.com/photos/I7I4cir4dTc)
- Steph Smith — [Long pier](https://unsplash.com/photos/wV5vDyHrNfA)

## 风与土 / Morocco

- Unsplash contributor — [Kasbah](https://unsplash.com/photos/SvTSY3KznIU)
- Unsplash contributor — [Fortress](https://unsplash.com/photos/QBJxERZgw74)
- Unsplash contributor — [Courtyard](https://unsplash.com/photos/J6vFNS5Itcs)
- Unsplash contributor — [Old city walkway](https://unsplash.com/photos/9UdGLlw-Sfk)
- Mohamed Abira — [Desert dunes and tents](https://unsplash.com/photos/desert-landscape-with-sand-dunes-and-tents-l6xIabuySWg)
- Maciej Cisowski — [Desert camp](https://unsplash.com/photos/bfBApvKdkS4)

## 交互与版式研究

- [Complete Shelf](https://github.com/mengto/complete-shelf) — 多书脊选择与抽取交互参考。
- 用户上传视频 — 书架到单本预览的动效节奏参考。

图片版权归各作者所有；Unsplash 素材按其当前许可条款使用。产品化或公开发布前，建议再次打开上述页面核对署名与许可状态。
