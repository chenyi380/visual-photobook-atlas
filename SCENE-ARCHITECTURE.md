# 场景方案与参考项目分析

## 2026-10-15：按视频拆分的实现

| 对照项目 | 功能与架构 | 本次取舍 |
| --- | --- | --- |
| [BlueWebber/3d-carousel](https://github.com/BlueWebber/3d-carousel) | 原生 Web Component、共享圆柱旋转，ISC | 借鉴共享相位，不引入逐卡边界读取的 overlay；自身不提供曲面或地球遮挡 |
| [bizarro/infinite-circular-webgl-gallery](https://github.com/bizarro/infinite-circular-webgl-gallery) | OGL/GLSL 曲面与惯性，MIT | 借鉴曲率模型；原项目关闭深度写入且有旧构建依赖，不直接移植 |
| [bobbyroe/threejs-earth](https://github.com/bobbyroe/threejs-earth) | 多层 Earth、夜灯与 Fresnel，MIT | 保留本站 NASA 贴图和按时间旋转；不换成随机星场或固定每帧旋转 |
| [pmndrs/postprocessing](https://github.com/pmndrs/postprocessing) | 合并后处理与受控 Bloom，Zlib | 发光仅限星带/流光，避免全背景泛白；现有原生渲染不必迁移 Three.js |
| [irma-book](https://github.com/fabiosantaniellobruun/irma-book) | 厚书封壳/书脊/合页，MIT | 借鉴真实厚度与合页，不替换已存在的原画册阅读器 |

研究结论是分层实现，不安装整套过时示例。上述项目没有直接提供所上传视频的完整效果，也没有复制其代码。视频手掌是视觉主体，不是摄像头手势需求。

`handheld-cosmos.js` 按 Word 中的四秒顺序驱动握拳、展掌、蓝色月坑能量球、卫星渐现、内部漩涡和手退出；画册模式仍使用地理地球。`nebula-ring.js` 单次全屏 WebGL 绘制三层流动密度采样，包含宽幅蓝青星云、尘粒和球体遮挡，不再堆叠平行椭圆细线。导航为设计轨道而非实测太阳系。地球使用高精网格，小星体使用简化索引网格，减小 GPU 开销。`orbit-library.js` 将原生播放器内容分为三十一片共面投影，轮廓则是单一连续曲面；抬高的观察角让上下边、进度线和文字均有可见弓形。三层共享相位与透视，按时间解析阻尼暂停/恢复。

`book-journey.js` 使用单一 8 秒时间轴和重叠过渡：departure → space → atmosphere → clouds → destination → materialize → opening → reader。宽幅金色尾光从空间滑向云海，在同册真实目的地摄影前凝聚为金边精装书；原生透视几何与十一张弯曲书页使其倾斜为 V 形展开，不是竖立的矩形门板。目的地为同册真实摄影而非虚构城市航拍。电影云海与三种手姿新生成，原始旅行照片不重绘。红点只标大致区域，旅程目标与地图共用 marker 坐标；Escape、重复点击锁和减少动态均保留。用户已确认只需网页实时动画，不导出 MP4。

摄影地图按图片留白分配约 15%–25% 的范围，使用真实局部 OSM 线条与公里比例尺，明暗适配；不再用整片灰色天空底色。原照片完整画幅、原光色与主体保持。精确源字体未提供，使用接近参考的字形，不声称字体或视频像素完全相同。

## 2026-10-14 更新

本轮新增 `scene-navigation.js`：以同一可逆进度控制全场景等比例缩放、两种模式融合和中心布局，反向滚轮不重置轨道相位。画册在倾斜空间圆轨道上使用同一观察者透视，按帧时间解析积分减速/启动，选中尺寸平滑变化，不采用瞬时停顿和屏幕椭圆补偿。

`book-journey.js` 独立负责流光飞行、临时穿梭覆盖层和阅读器交接；普通点击先动画，深链接仍直接定位阅读。飞行目标与投影地图红点共用归一化坐标，防止动画飞向错误位置。动画中阻止重复进入，Esc 取消，减少动态效果只保留 220ms 淡入。穿梭中的光线是临时电影效果，不是恒星运动，也不重新引入星球尾巴。

地图按源摄影画幅建立完整矢量图层，局部 OSM 街道、海岸与水体填色覆盖上方负空间；低饱和地理底色与细线相互分层。南昌屋顶、直岛山脊与塔架有独立保护遮罩，源照片没有重绘、改色或强制裁切。地理红点为大致区域，不能作为精确拍摄 GPS。

星空替换为 NASA 8K 星表背景，使用真实星表分布而非随机粒子。保留多轨道二体模型，补光和尺寸为展示设计。`globe-drag.js` 提供指针捕获、方向控制、限纬和减速；`orbit-library.js` 的连续圆柱切线片提供弧面画册。`travel-photo-layers.mjs` 将 OSM 真实地方几何写成透明叠图，与不改色、不裁切的原摄影独立显示；所有照片仅标大致区域。外部封面和地图许可详见 `MEDIA-SOURCES.md`。下文记录前版技术选型。

## 参考项目

| 项目 | 功能和架构 | 对本项目的适用边界 |
| --- | --- | --- |
| [Spacekit](https://github.com/typpo/spacekit) | Simulation组织对象；Ephem/Orbit计算开普勒位置；Skybox/Stars分离天球与星表 | 借鉴模型分层；整套引入会附带引擎、资源和坐标单位，画册仍须定制 |
| [Stellarium Web Engine](https://github.com/Stellarium/stellarium-web-engine) | C天文模块经WebAssembly运行；星表、巡天图与观察者投影分离 | 专业天文馆能力超出当前需求；构建链与数据管线成本较高 |
| [Three.js CSS3DRenderer](https://threejs.org/docs/pages/CSS3DRenderer.html) | 将真实DOM元素以三维变换放入WebGL组合界面 | 适合可点击卡片；不自动解决DOM和网格深度遮挡，官方另列100%缩放限制 |

以上是对本项目的适用性分析，不是对项目整体质量的排名。未复制这些项目的代码或引入其依赖。

## 实施方案

- `orbital-model.js`：独立纯函数。解开普勒方程，使用半长轴、偏心率、倾角、升交点和近心点参数。周期服从同一中心引力下的a^(3/2)比例；近心点更快、远心点更慢。
- `sky-renderer.js`：ESO实拍6000×3000全天全景映射到天球。观察者方向缓慢转动，星体间的真实相对位置不随机漂移，不增加人为闪烁、假流星或AI星云。
- `earth-renderer.js`：NASA昼夜贴图的真实网格地球和十个独立网格球体，共用深度缓冲，背面对象被地球遮挡。
- `orbit-library.js`：DOM按钮保持可访问；行星模式读取开普勒位置，画册模式采用图一的两层透视选择环。画册选择环是UI，不冒充天体轨道。
- `atlas-controller.js`：负责预览、目的地转向和阅读器切换；阅读器内容不变。
- 本站部署全部素材，不在浏览时依赖第三方CDN或星表服务。

## 真实与示意的边界

背景是实拍星空，不是实时观测；其运动代表观察方向变化。十颗小星球是画册导航符号，并非真实地球卫星或行星星历。轨道模型为设计参数下的二体模型、缩放和加速演示，不包含摄动、碰撞模拟或真实质量。不同轨道投影偶尔相交是正常现象，不把屏幕相交误认为物理碰撞。轨道细线为辅助线，真实宇宙中没有发光轨道或彩色尾巴。

## 素材和许可

[ESO/S. Brunier — The Milky Way panorama](https://www.eso.org/public/images/eso0932a/)；[ESO使用条款](https://www.eso.org/public/outreach/copyright/)；网页保留清晰、可点击署名。全景只进行球面投影和观察方向变化，没有AI修改。原画册旅行照片与内容保留。
