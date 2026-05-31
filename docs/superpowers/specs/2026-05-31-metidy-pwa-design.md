# Metidy — PWA 物品管理系统设计文档

> 一句话目标：把"我拥有的所有东西"做成结构化数据管理，解决 Obsidian 在动态字段、分类特有字段、查询筛选、移动端录入上的固有别扭。

## 1. 核心决策

| 决策项 | 选择 | 理由 |
|---|---|---|
| 数据存储 | 渐进式（先本地 IndexedDB，后加同步层） | 符合 PRD 精神——MVP 最快出，后续架构演进改动最小 |
| 前端框架 | React + Vite | 生态最成熟、AI 编程工具支持最好、CRUD+表单正是甜区 |
| UI 组件库 | shadcn/ui + Tailwind CSS | 复制代码模式拥有完整控制权，定制自由度最高 |
| 本地数据库 | IndexedDB + Dexie.js | PWA 生态最成熟方案，API 友好，React 集成方便 |
| 架构模式 | 分层（UI → Service → Data） | 加同步层时只改 Service，UI 零改动；业务逻辑集中一处 |
| 移动端策略 | 响应式单版 | 一套代码适配手机/平板/桌面，开发成本最低 |
| MVP 范围 | 基础 CRUD + 动态字段(EAV) + 位置体系 | 照片功能留后续版本 |

## 2. 架构设计

### 三层职责划分

```
React Components (shadcn/ui + 自定义)
    ↕ hooks (React 状态管理 + 实时查询)
Service Layer (业务逻辑：CRUD、EAV 组装、动态表单渲染、位置树)
    ↕ Dexie.js ORM
IndexedDB (7 张表 + EAV)
```

| 层 | 职责 | 依赖方向 |
|---|---|---|
| **UI 层** (components + pages + hooks) | 渲染、交互、表单状态 | → 调用 Service |
| **Service 层** (services/) | 业务逻辑：CRUD、EAV 组装拆分、位置树遍历、字段渲染规则、displayLabel 计算 | → 调用 DB 层 |
| **Data 层** (db/) | Dexie schema、数据存取、种子数据 | → IndexedDB |

**关键约束**：
- 组件只调 hooks，hooks 调 Service，Service 调 DB
- Service 层函数是纯 JS（不含 React 依赖），未来加同步层只需在 Service 层加 sync adapter
- hooks 使用 Dexie 的 `useLiveQuery` 实现数据实时响应

## 3. 数据模型

### 整体设计原则

- 公共字段尽量少而稳，超过一半物品用得上 → items 公共列；只有少数分类才有 → EAV 扩展层
- 所有"变化的东西"都不写死在表结构里，加新字段 = 往 fields 插一行
- 每条 item = 一个物理实体，uuid id 是唯一标识，无业务层面 unique key
- name 保持语义简洁（"手机""充电线""剪刀"），UI 展示靠 displayLabel 组合区分

### 3.1 items — 公共字段

| 字段 | 类型 | Dexie 索引 | 说明 |
|---|---|---|---|
| id | uuid | PK | 主键 |
| name | text | ✅ | 物品名称（必填），保持语义简洁 |
| category_id | fk | ✅ | 分类，决定挂哪些特有字段（必填） |
| brand_model | text | | 品牌型号 |
| quantity | int | | 数量，默认 1 |
| status | enum | ✅ | 在用 / 闲置 / 已出 / 已弃 / 借出 |
| location_id | fk | ✅ | 当前所在位置 |
| channel_id | fk | | 购入渠道 |
| acquired_date | date | ✅ | 购入日期 |
| price | decimal | | 价格 |
| currency | text | | 币种，默认 CNY |
| rating | int | | 评分 1–5 |
| importance | enum | | 低 / 中 / 高 / 关键 |
| warranty_until | date | | 保修到期（可接提醒） |
| notes | text | | 自由备注 |
| created_at | timestamp | | 审计 |
| updated_at | timestamp | | 审计 |

**displayLabel 计算逻辑**（itemService 提供）：

```ts
getDisplayLabel(item: Item, locationName?: string): string {
  if (item.brand_model) return item.brand_model;
  if (locationName) return `${item.name} · ${locationName}`;
  return item.name;
}
```

### 3.2 categories — 分类

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| name | text | 家用电器 / 电子设备 / 消耗品 / 书籍 / 工具 / 衣物… |
| parent_id | fk → self | 支持子分类（可选） |
| icon | text | 移动端列表图标 |
| sort_order | int | 排列顺序 |

### 3.3 channels — 购入渠道（独立可扩展表）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| name | text | 京东 / 淘宝 / 拼多多 / 闲鱼 / 线下… |
| icon | text | 移动端图标（可选） |
| sort_order | int | 列表排序 |
| usage_count | int | 使用次数，驱动"最近渠道记忆"排序 |
| created_at | timestamp | |

**种子数据**：京东、淘宝、拼多多、闲鱼、线下。用户可自行扩展。

`items.channel_id` 为 fk → channels，替代原 PRD 中的 `channel text`。录入表单中渠道选择器按 usage_count 降序排列，常用渠道排前面。

### 3.4 fields — 字段定义（动态 schema 的发动机）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| category_id | fk | 属于哪个分类（null = 全局可选） |
| key | text | 机器名，如 `plug_type` |
| label | text | 显示名，如"插座类型" |
| data_type | enum | text / number / date / enum / boolean |
| options | json | data_type=enum 时的可选项 |
| unit | text | 单位，如"月""W""ml" |
| required | bool | 该分类下是否必填 |
| sort_order | int | 录入表单顺序 |

**加字段操作**：往 fields 插一行 → 所有该分类的录入表单立刻多出此项，存量数据不受影响、未填即空。

### 3.5 item_field_values — 特有字段值（EAV）

| 字段 | 类型 | 说明 |
|---|---|---|
| item_id | fk → items | 复合索引 `[item_id+field_id]` |
| field_id | fk → fields | |
| value | json | 统一存 JSON，按 field 的 data_type 解读 |

**EAV 查询链式执行**：先查 fields → 再查 item_field_values → 最后批量取 items，Service 层手动组装（Dexie 没有 SQL JOIN）。

### 3.6 locations — 位置/容器（支持嵌套反查）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| name | text | 主卧 / 衣柜 / 储物箱A / 书房第二格 |
| parent_id | fk → self | 嵌套：储物箱A 的 parent 是 储物间 |
| type | enum | 房间 / 家具 / 容器 |

items.location_id 指向最末级位置。可查"主卧里有什么"（递归子节点）与"储物箱A 里有什么"（直接匹配）。

### 3.7 photos — 照片（MVP 预留，不实现）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| item_id | fk → items | |
| blob | Blob | PWA 存 IndexedDB blob |
| is_primary | bool | 列表缩略图用哪张 |
| created_at | timestamp | |

### Dexie.js Schema V1

```js
db.version(1).stores({
  items:              'id, name, category_id, status, location_id, channel_id, acquired_date',
  categories:         'id, name, parent_id',
  channels:           'id, name, sort_order',
  fields:             'id, category_id, key, data_type, sort_order',
  item_field_values:  '[item_id+field_id], item_id, field_id',
  locations:          'id, name, parent_id, type',
  photos:             'id, item_id, is_primary',
});
```

版本迁移策略：Dexie `version()` 只升不降，未来加 sync_status 等字段只需升级版本号，存量数据自动获得新字段（空值）。

### 各分类特有字段种子数据（fields 初始数据）

- **家用电器**：插座类型(enum 两脚/三脚)、功率(number W)、安装房间(enum)、是否需固定安装(boolean)、保养周期(number 月)
- **消耗品/食品**：保质期至(date)、开封后保质(number 天)、囤货量预警阈值(number)
- **电子设备**：序列号(text)、充电接口(enum USB-C/Lightning/…)、固件/系统版本(text)
- **书籍**：作者(text)、ISBN(text)、读完(boolean)
- **衣物**：尺码(text)、季节(enum 春夏秋冬)、洗涤方式(text)

## 4. Service 层设计

### 文件结构

```
services/
├── itemService.ts      # 核心：CRUD + EAV 组装/拆分 + displayLabel
├── categoryService.ts  # 分类树查询
├── channelService.ts   # 渠道 CRUD + usage_count 自增
├── locationService.ts  # 位置树 CRUD + 递归子节点查询
├── fieldService.ts     # 按 category_id 取字段定义（驱动动态表单）
└── syncService.ts      # 占位：interface 定义，V1 空实现
```

### itemService（最核心）

```ts
createItem(data: ItemFormData): Promise<Item>
  // 同时写 items 表 + item_field_values 表

updateItem(id: string, data: ItemFormData): Promise<Item>
  // 公共字段直接更新，EAV 值 diff 后更新（新增/修改/删除）

deleteItem(id: string): Promise<void>
  // 级联删除 item_field_values + photos（预留）

getItemDetail(id: string): Promise<ItemDetail>
  // 一条 items + 关联的 EAV 值组装成完整对象

listItems(filter: ItemFilter): Promise<ItemListItem[]>
  // 支持 category/status/location/channel 筛选 + EAV 值可选附加

getDisplayLabel(item: Item, locationName?: string): string
  // 有 brand_model → 显示 brand_model
  // 有 location 且同 name 多条 → "手机 · 主卧"
  // 否则 → 显示 name
```

### ItemFormData 类型（UI ↔ Service 契约）

```ts
interface ItemFormData {
  name: string;                    // 必填
  category_id: string;             // 必填，决定动态字段
  brand_model?: string;
  quantity: number;                // 默认 1
  status: ItemStatus;
  location_id?: string;
  channel_id?: string;
  acquired_date?: string;
  price?: number;
  currency?: string;               // 默认 CNY
  rating?: number;                 // 1-5
  importance?: Importance;
  warranty_until?: string;
  notes?: string;
  custom_fields?: Record<string, any>;  // key → value，按 field.data_type 校验
}
```

### fieldService（动态表单引擎）

```ts
getFieldsByCategory(categoryId: string): Promise<FieldDefinition[]>
  // 获取某分类的所有字段定义 → 驱动 DynamicFormSection 渲染

getGlobalFields(): Promise<FieldDefinition[]>
  // category_id = null 的全局可选字段

createField / updateField / deleteField
  // Settings 页配置字段
```

### locationService（位置树）

```ts
getDescendantIds(locationId: string): Promise<string[]>
  // 递归获取某位置下所有子节点 ID → 用于"主卧里有什么"查询

getLocationTree(): Promise<LocationTreeNode>
  // 构建整棵位置树（用于选择器 + 位置管理页）

createLocation / updateLocation / deleteLocation
```

### channelService

```ts
listChannels(): Promise<Channel[]>
  // 按 usage_count 降序排列 → 录入表单常用渠道排前面

incrementUsage(channelId: string): Promise<void>
  // 每次录入调用，usage_count +1

createChannel / updateChannel / deleteChannel
```

## 5. UI 层设计

### 页面路由

```
/                    → HomePage     仪表盘概览（物品总数、各状态统计、最近添加）
/items               → ItemsPage    物品列表（筛选、搜索、分组）
/items/add           → ItemAddPage  新增物品
/items/:id           → ItemDetail   物品详情
/items/:id/edit      → ItemEditPage 编辑物品
/locations           → LocationsPage 位置管理（树形展示 + CRUD）
/settings            → SettingsPage 分类管理、字段配置、渠道管理
```

### 响应式布局策略

- **桌面端**：左侧边栏导航 + 右主内容区，列表可多列展示
- **移动端**：底部 Tab 导航（首页/物品/位置/设置），列表单列卡片流，录入页全屏表单

### 录入页核心交互（ItemAddPage）

1. name + category 必填即可秒存（闪电录入），其余全部可后补
2. category 选定后 → DynamicFormSection 自动展开该分类的特有字段
3. 智能默认值：channel 记最近常用（usage_count）、location 记上次选择、currency 默认 CNY
4. 可随时保存草稿

### DynamicFormSection 组件（MVP 最关键）

读取 fieldService.getByCategory() 获取当前分类的字段定义，根据 data_type 动态渲染：

| data_type | 渲染控件 | shadcn/ui 组件 |
|---|---|---|
| text | 文本输入 | Input |
| number | 数字输入 + 单位后缀 | Input (type=number) + unit label |
| date | 日期选择 | DatePicker (shadcn/ui) |
| enum | 下拉选择 | Select |
| boolean | 开关 | Switch |

## 6. 项目结构

```
metidy/
├── public/                  # PWA manifest, icons
├── src/
│   ├── components/          # UI 组件（shadcn/ui + 自定义）
│   │   ├── ui/              # shadcn/ui 基础组件
│   │   ├── items/           # 物品相关组件
│   │   │   ├── ItemForm.tsx
│   │   │   ├── ItemCard.tsx
│   │   │   ├── ItemDetail.tsx
│   │   │   └── ItemList.tsx
│   │   ├── categories/      # 分类管理
│   │   ├── locations/       # 位置/容器树
│   │   ├── fields/          # 动态字段
│   │   │   ├── FieldEditor.tsx
│   │   │   └── DynamicFormSection.tsx
│   │   └── layout/          # 全局布局
│   ├── services/            # Service 层
│   ├── db/                  # Data 层
│   │   ├── schema.ts
│   │   ├── database.ts
│   │   └── seed.ts
│   ├── hooks/               # React hooks
│   ├── pages/               # 页面路由
│   ├── lib/                 # 工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── docs/superpowers/specs/
├── .gitignore
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── index.html
```

## 7. PWA 配置

- **Vite PWA 插件**：`vite-plugin-pwa`，自动生成 manifest + service worker
- **离线能力**：IndexedDB 天然离线，service worker 缓存静态资源
- **安装体验**：manifest 配 `name: "Metidy"`、`short_name: "Metidy"`
- **更新策略**：service worker 用 `prompt` 模式——有更新时提示用户刷新

## 8. MVP 功能清单

### 必做

- [ ] 项目初始化（Vite + React + TS + Tailwind + shadcn/ui）
- [ ] Dexie.js 数据库 schema + 种子数据
- [ ] Service 层：itemService、categoryService、fieldService、locationService、channelService
- [ ] React hooks：useItems、useCategories、useFields、useLocations、useChannels
- [ ] 全局布局（响应式侧边栏/底部 Tab）
- [ ] 物品列表页（筛选、搜索、分组）
- [ ] 物品新增/编辑页（公共字段 + 动态字段表单）
- [ ] 物品详情页
- [ ] 位置管理页（树形 CRUD）
- [ ] 设置页（分类管理 + 字段配置 + 渠道管理）
- [ ] PWA 配置（manifest + service worker）

### 不做（后续版本）

- [ ] 照片功能（拍照、上传、缩略图）
- [ ] 条码扫描录入
- [ ] 同步层（后端 API + 多设备同步）
- [ ] 保修/保质期到期提醒
- [ ] Obsidian 索引页回链导出
- [ ] CSV/JSON 批量导出

## 9. 未来演进路径

1. **V2：照片功能** — photos 表启用，拍照上传 + 缩略图
2. **V3：条码扫描** — 调用手机摄像头读条码，自动填充 name/brand
3. **V4：同步层** — syncService 实现，后端 API（SQLite/PostgreSQL）+ WebSocket 实时同步
4. **V5：提醒系统** — warranty_until / 保质期 到期推送通知
5. **V6：导出/回链** — CSV/JSON 导出 + Obsidian markdown 索引页生成