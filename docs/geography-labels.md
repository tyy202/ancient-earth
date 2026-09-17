# 大陆与大洋名称层

本功能用于基础科普，覆盖页面现有的 26 个年代。名称锚点表示大致位置，不表示大陆边界、海洋范围或完整地质重建。运行时只读取 `js/geography-data.js`，不请求任何在线接口。

## 数据与署名

- 现代名称参考 [Natural Earth 1:10m Physical Labels](https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-physical-labels/)，数据为 [Public Domain](https://www.naturalearthdata.com/about/terms-of-use/)。中文名称经过整理；坐标为人工选择并核对过的文字锚点，不是原数据提供的标注点。澳大利亚大陆不等于整个大洋洲。
- 古陆块锚点来自 Christopher R. Scotese 的 [PALEOMAP PaleoAtlas for GPlates, v3（2016）](https://zenodo.org/records/10251792)，许可 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。先前研究通过悉尼大学 [GPlates Web Service](https://gwsdoc.gplates.org/reconstruction/reconstruct-points/) 将现代参考点重建到各年代；本次将部分结果选作古大陆名称的位置，四舍五入到两位小数，名称和海洋标注为本 Fork 整理添加。在线重建只用于开发阶段，结果已保存在仓库。
- 古大陆和海洋名称的科普参考：[Scripps / UC San Diego：Pangaea, Gondwanaland, Laurasia and Tethys](https://earthguide.ucsd.edu/eoc/eoc_teachers_hs_earth/content_tectonics/p_definition_pangaea.html)，以及原项目的年代说明。参考点本身并不包含古地名，不能把现代种子点的名称直接当作古大陆名称。
- 初次数据比对过程和候选点保留在 [研究报告](research/label-data-audit.md) 与 `data/label-candidates/` 中。研究文件不参与网页运行。

## 本版采用的取舍

| 年代（百万年前） | 主要名称 |
| --- | --- |
| 600、560 | 潘诺西亚重建示意、正在形成的冈瓦纳及部分陆块；海洋仅称“古大洋” |
| 540—450 | 冈瓦纳、劳伦、波罗的、西伯利亚等；泛大洋 |
| 430—340 | 冈瓦纳、欧美大陆、西伯利亚等；泛大洋 |
| 300—200 | 盘古大陆、泛大洋、古特提斯洋／特提斯洋 |
| 170、150 | 劳亚、冈瓦纳、泛大洋、特提斯洋 |
| 120—20 | 主要大陆及太平洋、大西洋、印度洋；较老时期保留特提斯洋，较年轻时期补充极地海洋 |
| 现代 | 七个大陆名称及主要大洋；太平洋、大西洋分南北标注 |

这些分组是离散年代的简化展示，不是大陆形成、分裂或洋盆消失的精确时间表。古特提斯洋与特提斯洋可能同时存在，本版只标其中主要名称。600 Ma 沿用原地图的潘诺西亚重建解释，不能视为不存在争议的定论。

古大陆锚点保守选自上一轮通过检查的参考点；被判为海岸或浅海候选的点暂不采用，所以有些年代缺少个别陆块名称。海洋位置是对照现有贴图人工选取的示意点，没有海洋边界数据。现代欧洲、亚洲在古代仅指其主体陆块所在区域。后续可逐年代修订 `js/geography-data.js`，不需要更改渲染逻辑。

名称跟随球体旋转和视角变化。背面、球体边缘、视口外以及互相重叠的文字会隐藏；因此当前视角看不到某个名称，不代表当时不存在该大陆或海洋。缩放过远时标注会更少。

## 验证

`tests/responsive.cjs` 使用本机安装的 Playwright 和 Chromium，检查桌面及四种手机尺寸、触摸拖拽与缩放、名称开关、年代切换、遮挡、文字避让和离线请求。手机模拟不能代替 Android Chrome / iOS Safari 真机验证。
