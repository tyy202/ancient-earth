# 恐龙化石发现区域（科普示意）

在“生物”菜单选择“恐龙（非鸟类）”，地球显示橙色标记；选择“不显示生物”关闭。地名开关独立控制大陆和大洋名称。生物标记与地名共同避让，重叠时优先显示生物；转到球体背面时隐藏。手机可展开年代说明查看解释。

## 来源与许可

- **Paleobiology Database（PBDB）贡献者**：[数据库](https://paleobiodb.org/)、[查询文档](https://paleobiodb.org/data1.2/occs/list_doc.html)、[官方地图项目中的数据许可说明](https://github.com/paleobiodb/navigator)。使用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 许可，保留署名。本 Fork 对记录做了年代筛选、区域归类和示意标注。
- **Christopher R. Scotese，PALEOMAP PaleoAtlas for GPlates v3（2016）**：[数据与署名](https://zenodo.org/records/10251792)，CC BY 4.0。沿用此前通过 GPlates 获取并本地保存的参考陆块坐标，将其用于区域文字锚点，非化石原址重建。
- 年代背景：[美国国家公园管理局：Major Groups of Dinosaurs](https://www.nps.gov/subjects/fossils/major-groups-of-dinosaurs.htm)、[伦敦自然历史博物馆：Dinosaurs](https://www.nhm.ac.uk/discover/dinosaurs.html)。非鸟类恐龙在约 6600 万年前灭绝，鸟类延续至今。

原始响应的压缩快照、下载时间、查询 URL、SHA-256、区域统计及示例化石／文献编号保存在 `data/dinosaurs/`。首次下载筛选后的响应共 8,439 条，不是整个 PBDB 的恐龙化石总量。`evidence.json` 是处理摘要；对应 `.json.gz` 保存完整查询结果，支持复核。数量不代表动物个体数或当地种群密度。

## 取样和区域规则

1. 查询 `Dinosauria^Aves`，排除鸟类；年代范围 235—66 Ma，至少鉴定到属，并使用 PBDB 的 `genus_certain` 过滤不确定属级鉴定。按数据库现有分类接受记录，并非逐条重新鉴定。
2. 页面已有的 220、200、170、150、120、105、90 Ma 七帧，每帧取前后 5 Ma。仅保留年龄上下限均在 235—66 Ma、跨度不超过 30 Ma，并与该窗口有交集的记录。例如 150 Ma 帧汇总 155—145 Ma 的相关记录，并不表示它们在 150 Ma 那一刻全部共存。
3. 按发现地点所属的现代大陆归组：非洲、南美洲、北美洲、澳大利亚、南极洲、亚洲主体、欧洲。印度及邻近南亚国家（IN、PK、BD、LK、NP、BT）单列印度陆块并从亚洲主体组排除，避免把古印度的记录放到古东亚。国家边界并不严格等于板块边界，这仍是大陆级近似。
4. 有符合条件的记录才生成标记。标记放在该区域对应陆块的 PALEOMAP 参考点，不在各化石发现地点，不能用于定位。名称中的“非洲”等指现代大陆对应的陆块，不声称古代大陆已经与今天相同。亚洲主体使用东亚参考点，因此不能解读为所有记录都发现于东亚。
5. 部分参考点在旧研究中标为海岸或浅海候选。本图层保留这些陆块锚点作为整体区域的标记，即使局部贴图显示浅海，也不意味着化石发现于该海域或恐龙生活在海中。没有绘制推测的栖息边界，也不以记录数量绘制热力图。
6. 240 Ma 及更早帧不在本版展示范围内，不能据此断言更早的恐龙或其近亲不存在。65 Ma 和更年轻的帧不显示非鸟类恐龙；不会把邻近白垩纪的化石混入灭绝后的年代。缺少标记只表示这次筛选没有可显示的记录，不表示当时不存在恐龙。

为避免旧文案与新图层冲突，修正了 220、200、65 Ma 的年代说明，并将事件菜单的 65 Ma 改为“恐龙灭绝之后”。其余原项目说明不属于此次全面科学校订范围。

## 本地生成与验证

需要 Python 3，脚本只使用标准库。

```sh
# 根据仓库快照重新生成，不联网
python scripts/build-dinosaur-data.py

# 主动更新快照，需要联网；应复查新增记录和统计变化
python scripts/build-dinosaur-data.py --refresh

# 离线数据检查
python tests/dinosaur-data.py

# 使用本机安装的 Playwright / Chromium 验证页面
node tests/responsive.cjs
```

网页只加载约 7 KB 的 `js/dinosaur-data.js`，没有运行时 API 请求。Dockerfile 已复制整个 `js` 目录，无需增加数据库、服务或依赖；研究快照不会进入镜像。
