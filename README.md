# Hackathon Atlas · 全球黑客松地图

**在线地址：<https://hannahlovegood.github.io/hackathon-atlas/>**

实时聚合四个公开数据源的真实黑客松，放在一张暗色世界地图上，按多个维度筛选：

- **数据源**：Devpost（官方 JSON 接口）· MLH（页面内嵌 JSON）· ETHGlobal（RSC 数据流解析）· HackerEarth（插件接口）
- **筛选维度**：举办时间（进行中/本月/下月/3个月内）· 大洲地区/线上 · 国家 · 类别（AI/Web3/学生/公益/金融/游戏/硬件/安全）· 持续时间 · 奖金池（≥$10K/≥$100K）
- **地图**：Leaflet + markercluster + CARTO 暗色底图；青色点=精确城市定位，紫色点=国家级近似定位（离线地理编码，零 API Key）
- **自动更新**：GitHub Actions 每天 06:00（北京时间）重抓数据并提交

## 架构

```
fetch.mjs   零依赖 Node 抓取器：四源并发 → 归一化 → 去重 → 离线地理编码 → data.js / data.json
index.html  地图页面，只消费 data.js —— 两者互不覆盖，改页面不会被每日任务冲掉
update.yml  每日定时跑 fetch.mjs，数据有变化才提交
```

## 本地运行

```bash
node fetch.mjs      # 生成 data.js（Node 18+，零依赖）
open index.html     # 直接浏览器打开即可（file:// 可用）
```

## 已知边界

- 地理编码是离线表（约 300 城市 + 国家中心点兜底），小城市会落到国家中心点（紫色点）。
- Devpost 奖金按接口给的主奖金额解析；MLH / ETHGlobal 不公布统一奖金池，计为 0。
- DoraHacks 有 AWS WAF 人机验证，云端抓不了，未接入。

MIT License.
