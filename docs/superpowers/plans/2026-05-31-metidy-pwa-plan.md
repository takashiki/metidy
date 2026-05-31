# Metidy PWA 物品管理系统 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个可在手机安装的 PWA 物品管理系统，支持动态分类字段、位置嵌套树、EAV 模式数据存储。

**Architecture:** UI层(React + shadcn/ui) → Hooks层 → Service层(纯JS业务逻辑) → Data层(Dexie.js + IndexedDB)。三层严格分离，加同步层时只改Service层。

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Dexie.js, React Router v6, vite-plugin-pwa, Vitest + @testing-library/react

---

## 文件结构总览

```
metidy/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── icon-192.png
│   └── icon-512.png
├── src/
│   ├── types/
│   │   └── index.ts           # 所有核心类型定义
│   ├── db/
│   │   ├── database.ts        # Dexie 实例 + 初始化
│   │   ├── schema.ts          # 数据库 schema + 版本定义
│   │   └── seed.ts            # 种子数据
│   ├── services/
│   │   ├── itemService.ts     # 物品 CRUD + EAV 组装/拆分
│   │   ├── categoryService.ts
│   │   ├── channelService.ts
│   │   ├── locationService.ts
│   │   ├── fieldService.ts
│   │   └── syncService.ts     # 占位 interface
│   ├── hooks/
│   │   ├── useLiveQuery.ts    # Dexie 实时查询包装 hook
│   │   ├── useItems.ts
│   │   ├── useCategories.ts
│   │   ├── useFields.ts
│   │   ├── useLocations.ts
│   │   └── useChannels.ts
│   ├── components/
│   │   ├── ui/                # shadcn/ui 自动生成的组件
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx  # 全局布局（响应式侧边栏/底部Tab）
│   │   │   ├── Sidebar.tsx    # 桌面端侧边导航
│   │   │   └── MobileNav.tsx  # 移动端底部Tab导航
│   │   ├── items/
│   │   │   ├── ItemCard.tsx        # 物品卡片
│   │   │   ├── ItemList.tsx        # 物品列表（列表/分组视图）
│   │   │   ├── ItemForm.tsx        # 公共字段表单
│   │   │   └── ItemFilterBar.tsx   # 筛选栏
│   │   ├── fields/
│   │   │   ├── DynamicFormSection.tsx  # 动态字段表单渲染引擎
│   │   │   └── FieldEditor.tsx         # 字段定义编辑器
│   │   ├── locations/
│   │   │   ├── LocationTree.tsx    # 位置树组件
│   │   │   └── LocationPicker.tsx  # 位置选择器
│   │   └── settings/
│   │       ├── CategoryManager.tsx
│   │       ├── ChannelManager.tsx
│   │       └── FieldManager.tsx
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── ItemsPage.tsx
│   │   ├── ItemAddPage.tsx
│   │   ├── ItemEditPage.tsx
│   │   ├── ItemDetailPage.tsx
│   │   ├── LocationsPage.tsx
│   │   └── SettingsPage.tsx
│   ├── lib/
│   │   ├── utils.ts           # cn() helper for shadcn/ui
│   │   └── validators.ts      # 表单校验工具
│   ├── App.tsx                # 路由 + 全局 Layout
│   ├── main.tsx               # 入口 + PWA 注册
│   └── index.css              # Tailwind 引入
├── tests/
│   ├── setup.ts               # 测试环境配置（fake-indexeddb）
│   └── services/
│       ├── itemService.test.ts
│       ├── categoryService.test.ts
│       ├── channelService.test.ts
│       ├── fieldService.test.ts
│       └── locationService.test.ts
├── .gitignore
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── components.json            # shadcn/ui 配置
└── index.html
```

---

## Phase 1: 项目脚手架

### Task 1: Vite + React + TypeScript 项目初始化

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `.gitignore`

- [ ] **Step 1: 创建 Vite 项目**

```bash
cd /Users/dowding/Workspace/metidy
npm create vite@latest . -- --template react-ts
```

Expected: 生成标准 Vite + React + TS 项目文件。

- [ ] **Step 2: 安装基础依赖**

```bash
npm install
```

Expected: 无报错。

- [ ] **Step 3: 验证项目可运行**

```bash
npm run dev
```

在浏览器打开 http://localhost:5173，看到 Vite + React 默认页面。

- [ ] **Step 4: 清理默认内容**

在 `src/App.tsx` 中替换默认内容为：

```tsx
function App() {
  return <div className="min-h-screen bg-background text-foreground">Metidy — 物品管理系统</div>;
}

export default App;
```

删除 `src/App.css`，清空 `src/index.css` 中默认样式。

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: init Vite React TypeScript project"
```

### Task 2: Tailwind CSS + shadcn/ui 配置

**Files:**
- Modify: `src/index.css`, `tailwind.config.ts`, `vite.config.ts`
- Create: `components.json`, `src/lib/utils.ts`

- [ ] **Step 1: 安装 Tailwind CSS**

```bash
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 2: 配置 Vite plugin**

修改 `vite.config.ts`：

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

- [ ] **Step 3: 添加 Tailwind 到入口 CSS**

修改 `src/index.css`：

```css
@import "tailwindcss";
```

- [ ] **Step 4: 配置 shadcn/ui**

```bash
npx shadcn@latest init
```

选择：TypeScript, Default style, Neutral base color, CSS variables: yes, 默认配置路径。

这会生成 `components.json` 和更新 `src/index.css`（添加 CSS variables）。

- [ ] **Step 5: 添加 shadcn/ui 基础组件**

```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add select
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add label
npx shadcn@latest add separator
npx shadcn@latest add tabs
npx shadcn@latest add textarea
npx shadcn@latest add form
```

验证 `src/components/ui/` 下有对应的组件文件。

- [ ] **Step 6: 根据设计文档定制主题颜色**

在 `src/index.css` 中添加 P3 色域和基础主题变量（shadcn 初始化已生成 CSS variables，保持默认即可，后续可调）。

- [ ] **Step 7: 验证**

```bash
npm run dev
```

确认页面无样式报错，Tailwind 生效。

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: add Tailwind CSS and shadcn/ui"
```

### Task 3: React Router + Vitest 配置

**Files:**
- Create: `tests/setup.ts`, `src/pages/` (empty dirs for now)
- Modify: `vite.config.ts`

- [ ] **Step 1: 安装依赖**

```bash
npm install react-router-dom
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom fake-indexeddb
```

- [ ] **Step 2: 配置 Vitest**

修改 `vite.config.ts`，在已有配置上添加 test 字段：

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
  },
});
```

- [ ] **Step 3: 创建测试环境配置**

创建 `tests/setup.ts`：

```ts
import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
```

- [ ] **Step 4: 添加 package.json 测试脚本**

在 `package.json` 中添加：

```json
"scripts": {
  "test": "vitest",
  "test:run": "vitest run"
}
```

- [ ] **Step 5: 骨架路由 + 页面占位**

修改 `src/App.tsx`：

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

创建 `src/pages/HomePage.tsx`（占位，后续正式实现）：

```tsx
export function HomePage() {
  return <div className="p-4"><h1 className="text-2xl font-bold">Metidy</h1><p>物品管理</p></div>;
}
```

创建其余页面占位文件（`ItemsPage.tsx`, `ItemAddPage.tsx`, `ItemEditPage.tsx`, `ItemDetailPage.tsx`, `LocationsPage.tsx`, `SettingsPage.tsx`），每个导出同名的空组件。

删掉 `src/App.css`（如果还在）。

- [ ] **Step 6: 验证**

```bash
npm run dev   # 确认路由 + 页面正常
npx vitest run  # 确认测试框架就绪（0 tests 也应该是 OK）
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: add React Router and Vitest config"
```

---

## Phase 2: 类型定义与数据层

### Task 4: 核心类型定义

**Files:**
- Create: `src/types/index.ts`

所有类型集中定义，确保 Service 层、Hooks 层、UI 层使用同一套类型。

- [ ] **Step 1: 创建类型文件**

```ts
// src/types/index.ts

// ---- 枚举 ----
export type ItemStatus = '在用' | '闲置' | '已出' | '已弃' | '借出';
export type Importance = '低' | '中' | '高' | '关键';
export type DataType = 'text' | 'number' | 'date' | 'enum' | 'boolean';
export type LocationType = '房间' | '家具' | '容器';

// ---- 数据库主表 ----
export interface Item {
  id: string;          // uuid
  name: string;
  category_id: string;
  brand_model?: string;
  quantity: number;
  status: ItemStatus;
  location_id?: string;
  channel_id?: string;
  acquired_date?: string;   // ISO date string
  price?: number;
  currency: string;         // 默认 CNY
  rating?: number;          // 1-5
  importance?: Importance;
  warranty_until?: string;  // ISO date string
  notes?: string;
  created_at: string;       // ISO timestamp
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  parent_id?: string;
  icon?: string;
  sort_order: number;
}

export interface Channel {
  id: string;
  name: string;
  icon?: string;
  sort_order: number;
  usage_count: number;
  created_at: string;
}

export interface Field {
  id: string;
  category_id?: string;  // null = 全局
  key: string;
  label: string;
  data_type: DataType;
  options?: string[];     // data_type=enum 时的可选项
  unit?: string;
  required: boolean;
  sort_order: number;
}

export interface ItemFieldValue {
  item_id: string;
  field_id: string;
  value: any;  // JSON，按 Field.data_type 解读
}

export interface Location {
  id: string;
  name: string;
  parent_id?: string;
  type: LocationType;
}

export interface Photo {
  id: string;
  item_id: string;
  blob: Blob;
  is_primary: boolean;
  created_at: string;
}

// ---- 复合/展示类型 ----
export interface FieldDefinition {
  id: string;
  category_id?: string;
  key: string;
  label: string;
  data_type: DataType;
  options?: string[];
  unit?: string;
  required: boolean;
  sort_order: number;
}

export interface ItemDetail extends Item {
  category_name?: string;
  location_name?: string;
  channel_name?: string;
  custom_fields?: Record<string, any>;  // field.key → value
  photos?: Photo[];
}

export interface ItemListItem {
  id: string;
  name: string;
  brand_model?: string;
  category_id: string;
  category_name?: string;
  status: ItemStatus;
  location_name?: string;
  rating?: number;
  importance?: Importance;
  created_at: string;
  display_label: string;  // itemService.getDisplayLabel() 的结果
}

export interface ItemFormData {
  name: string;
  category_id: string;
  brand_model?: string;
  quantity: number;
  status: ItemStatus;
  location_id?: string;
  channel_id?: string;
  acquired_date?: string;
  price?: number;
  currency?: string;
  rating?: number;
  importance?: Importance;
  warranty_until?: string;
  notes?: string;
  custom_fields?: Record<string, any>;
}

export interface ItemFilter {
  search?: string;
  category_id?: string;
  status?: ItemStatus;
  location_id?: string;
  channel_id?: string;
}

export interface LocationTreeNode extends Location {
  children: LocationTreeNode[];
  item_count: number;
}
```

- [ ] **Step 2: 验证类型编译**

```bash
npx tsc --noEmit
```

确保无类型错误。

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add core type definitions"
```

### Task 5: Dexie 数据库 Schema

**Files:**
- Create: `src/db/schema.ts`, `src/db/database.ts`

- [ ] **Step 1: 定义 Dexie Schema**

创建 `src/db/schema.ts`：

```ts
// 定义表的索引结构类型（用于类型约束，非运行时）
export const SCHEMA_V1 = {
  items:              'id, name, category_id, status, location_id, channel_id, acquired_date',
  categories:         'id, name, parent_id',
  channels:           'id, name, sort_order',
  fields:             'id, category_id, key, data_type, sort_order',
  item_field_values:  '[item_id+field_id], item_id, field_id',
  locations:          'id, name, parent_id, type',
  photos:             'id, item_id, is_primary',
};
```

创建 `src/db/database.ts`：

```ts
import Dexie, { type EntityTable } from 'dexie';
import type { Item, Category, Channel, Field, ItemFieldValue, Location, Photo } from '../types';
import { SCHEMA_V1 } from './schema';

export class MetidyDatabase extends Dexie {
  items!: EntityTable<Item, 'id'>;
  categories!: EntityTable<Category, 'id'>;
  channels!: EntityTable<Channel, 'id'>;
  fields!: EntityTable<Field, 'id'>;
  item_field_values!: EntityTable<ItemFieldValue, '[item_id+field_id]'>;
  locations!: EntityTable<Location, 'id'>;
  photos!: EntityTable<Photo, 'id'>;

  constructor() {
    super('metidy');
    this.version(1).stores(SCHEMA_V1);
  }
}

export const db = new MetidyDatabase();
```

- [ ] **Step 2: 验证数据库可创建**

创建临时测试：写一个快速脚本运行 `db.items.toArray()` 确认返回空数组。

（不需要正式测试文件——数据库创建是 Dexie 的行为，在 Service 层测试中会被继承验证。）

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add Dexie database schema"
```

### Task 6: 种子数据

**Files:**
- Create: `src/db/seed.ts`

- [ ] **Step 1: 编写种子数据**

创建 `src/db/seed.ts`：

```ts
import { db } from './database';
import type { Category, Channel, Field } from '../types';
import { v4 as uuidv4 } from 'uuid';

// 生成确定性 UUID（不加新依赖——用简单的确定性 ID）
// 直接使用固定 ID 更直观
const ID = {
  // 分类
  cat_appliance: 'cat-001',
  cat_consumable: 'cat-002',
  cat_electronics: 'cat-003',
  cat_books: 'cat-004',
  cat_clothing: 'cat-005',
  cat_tools: 'cat-006',
  // 渠道
  ch_jd: 'ch-001',
  ch_taobao: 'ch-002',
  ch_pdd: 'ch-003',
  ch_xianyu: 'ch-004',
  ch_offline: 'ch-005',
  // 字段
  fld_plug_type: 'fld-001',
  fld_power: 'fld-002',
  fld_room: 'fld-003',
  fld_fixed: 'fld-004',
  fld_maintain: 'fld-005',
  fld_expiry: 'fld-006',
  fld_open_shelf: 'fld-007',
  fld_stock_warn: 'fld-008',
  fld_serial: 'fld-009',
  fld_charge: 'fld-010',
  fld_firmware: 'fld-011',
  fld_author: 'fld-012',
  fld_isbn: 'fld-013',
  fld_read: 'fld-014',
  fld_size: 'fld-015',
  fld_season: 'fld-016',
  fld_wash: 'fld-017',
};

const categories: Category[] = [
  { id: ID.cat_appliance, name: '家用电器', icon: '⚡', sort_order: 1 },
  { id: ID.cat_consumable, name: '消耗品', icon: '🧴', sort_order: 2 },
  { id: ID.cat_electronics, name: '电子设备', icon: '📱', sort_order: 3 },
  { id: ID.cat_books, name: '书籍', icon: '📚', sort_order: 4 },
  { id: ID.cat_clothing, name: '衣物', icon: '👔', sort_order: 5 },
  { id: ID.cat_tools, name: '工具', icon: '🔧', sort_order: 6 },
];

const channels: Channel[] = [
  { id: ID.ch_jd, name: '京东', sort_order: 1, usage_count: 0, created_at: '' },
  { id: ID.ch_taobao, name: '淘宝', sort_order: 2, usage_count: 0, created_at: '' },
  { id: ID.ch_pdd, name: '拼多多', sort_order: 3, usage_count: 0, created_at: '' },
  { id: ID.ch_xianyu, name: '闲鱼', sort_order: 4, usage_count: 0, created_at: '' },
  { id: ID.ch_offline, name: '线下', sort_order: 5, usage_count: 0, created_at: '' },
];

const fields: Field[] = [
  // 家用电器
  { id: ID.fld_plug_type, category_id: ID.cat_appliance, key: 'plug_type', label: '插座类型', data_type: 'enum', options: ['两脚', '三脚', 'USB'], required: false, sort_order: 1 },
  { id: ID.fld_power, category_id: ID.cat_appliance, key: 'power', label: '功率', data_type: 'number', unit: 'W', required: false, sort_order: 2 },
  { id: ID.fld_room, category_id: ID.cat_appliance, key: 'room', label: '安装房间', data_type: 'enum', options: ['客厅', '主卧', '次卧', '厨房', '卫生间', '阳台'], required: false, sort_order: 3 },
  { id: ID.fld_fixed, category_id: ID.cat_appliance, key: 'fixed_install', label: '是否需固定安装', data_type: 'boolean', required: false, sort_order: 4 },
  { id: ID.fld_maintain, category_id: ID.cat_appliance, key: 'maintain_cycle', label: '保养周期', data_type: 'number', unit: '月', required: false, sort_order: 5 },
  // 消耗品/食品
  { id: ID.fld_expiry, category_id: ID.cat_consumable, key: 'expiry_date', label: '保质期至', data_type: 'date', required: false, sort_order: 1 },
  { id: ID.fld_open_shelf, category_id: ID.cat_consumable, key: 'open_shelf_life', label: '开封后保质', data_type: 'number', unit: '天', required: false, sort_order: 2 },
  { id: ID.fld_stock_warn, category_id: ID.cat_consumable, key: 'stock_warn_threshold', label: '囤货量预警阈值', data_type: 'number', required: false, sort_order: 3 },
  // 电子设备
  { id: ID.fld_serial, category_id: ID.cat_electronics, key: 'serial_number', label: '序列号', data_type: 'text', required: false, sort_order: 1 },
  { id: ID.fld_charge, category_id: ID.cat_electronics, key: 'charge_port', label: '充电接口', data_type: 'enum', options: ['USB-C', 'Lightning', 'Micro-USB', 'USB-A'], required: false, sort_order: 2 },
  { id: ID.fld_firmware, category_id: ID.cat_electronics, key: 'firmware_version', label: '固件/系统版本', data_type: 'text', required: false, sort_order: 3 },
  // 书籍
  { id: ID.fld_author, category_id: ID.cat_books, key: 'author', label: '作者', data_type: 'text', required: false, sort_order: 1 },
  { id: ID.fld_isbn, category_id: ID.cat_books, key: 'isbn', label: 'ISBN', data_type: 'text', required: false, sort_order: 2 },
  { id: ID.fld_read, category_id: ID.cat_books, key: 'is_read', label: '读完', data_type: 'boolean', required: false, sort_order: 3 },
  // 衣物
  { id: ID.fld_size, category_id: ID.cat_clothing, key: 'size', label: '尺码', data_type: 'text', required: false, sort_order: 1 },
  { id: ID.fld_season, category_id: ID.cat_clothing, key: 'season', label: '季节', data_type: 'enum', options: ['春', '夏', '秋', '冬', '全年'], required: false, sort_order: 2 },
  { id: ID.fld_wash, category_id: ID.cat_clothing, key: 'wash_method', label: '洗涤方式', data_type: 'text', required: false, sort_order: 3 },
];

export async function seedDatabase(): Promise<void> {
  const catCount = await db.categories.count();
  if (catCount > 0) return; // 已播种，跳过

  const now = new Date().toISOString();
  const channelsWithTime = channels.map(c => ({ ...c, created_at: now }));

  await db.categories.bulkAdd(categories);
  await db.channels.bulkAdd(channelsWithTime);
  await db.fields.bulkAdd(fields);
}

export { ID as SEED_IDS };
```

**注意**：用固定 ID 替代 uuid，方便种子数据引用和删除级联。`uuid` 包在不需要使用的地方不再引入——不用 `v4 as uuidv4` 也不需要安装 `uuid`。

实际上显式固定 ID 即可，不必引入 uuid 依赖。修正 `seed.ts` 去掉 uuid 导入。

- [ ] **Step 2: 在应用入口调用种子**

修改 `src/main.tsx`：

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { seedDatabase } from './db/seed';
import './index.css';

seedDatabase().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
```

- [ ] **Step 3: 验证种子数据**

在浏览器 DevTools → Application → IndexedDB → metidy 中确认有 categories（6条）、channels（5条）、fields（17条）。

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add seed data for categories, channels, and fields"
```

---

## Phase 3: Service 层（TDD）

**此阶段严格 TDD：先写测试 → 验证失败 → 再写实现。**

### Task 7: categoryService（TDD）

**Files:**
- Create: `tests/services/categoryService.test.ts`, `src/services/categoryService.ts`

- [ ] **Step 1: 编写测试**

```ts
// tests/services/categoryService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../src/db/database';
import { seedDatabase } from '../../src/db/seed';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../src/services/categoryService';

describe('categoryService', () => {
  beforeEach(async () => {
    await db.categories.clear();
    await seedDatabase();
  });

  it('getAllCategories() returns all categories ordered by sort_order', async () => {
    const cats = await getAllCategories();
    expect(cats.length).toBe(6);
    expect(cats[0].name).toBe('家用电器');
    expect(cats[0].sort_order).toBe(1);
  });

  it('getCategoryById() returns correct category', async () => {
    const cat = await getCategoryById('cat-001');
    expect(cat?.name).toBe('家用电器');
  });

  it('getCategoryById() returns null for unknown id', async () => {
    const cat = await getCategoryById('nonexistent');
    expect(cat).toBeNull();
  });

  it('createCategory() inserts and returns new category', async () => {
    const created = await createCategory({ name: '运动器材', sort_order: 7 });
    expect(created.id).toBeDefined();
    expect(created.name).toBe('运动器材');
    const all = await getAllCategories();
    expect(all.length).toBe(7);
  });

  it('updateCategory() modifies existing category', async () => {
    await updateCategory('cat-001', { name: '家电' });
    const cat = await getCategoryById('cat-001');
    expect(cat?.name).toBe('家电');
  });

  it('deleteCategory() removes category', async () => {
    await deleteCategory('cat-006');
    const all = await getAllCategories();
    expect(all.length).toBe(5);
  });
});
```

- [ ] **Step 2: 运行测试——确认失败**

```bash
npx vitest run tests/services/categoryService.test.ts
```

Expected: FAIL — 模块未找到。

- [ ] **Step 3: 实现 categoryService**

```ts
// src/services/categoryService.ts
import { db } from '../db/database';
import type { Category } from '../types';

export async function getAllCategories(): Promise<Category[]> {
  return db.categories.orderBy('sort_order').toArray();
}

export async function getCategoryById(id: string): Promise<Category | null> {
  return (await db.categories.get(id)) ?? null;
}

export async function createCategory(input: Partial<Category>): Promise<Category> {
  const category: Category = {
    id: crypto.randomUUID(),
    name: input.name ?? '',
    parent_id: input.parent_id,
    icon: input.icon,
    sort_order: input.sort_order ?? 99,
  };
  await db.categories.add(category);
  return category;
}

export async function updateCategory(id: string, input: Partial<Category>): Promise<void> {
  await db.categories.update(id, input);
}

export async function deleteCategory(id: string): Promise<void> {
  await db.categories.delete(id);
}
```

- [ ] **Step 4: 运行测试——确认通过**

```bash
npx vitest run tests/services/categoryService.test.ts
```

Expected: 所有 6 个测试 PASS。

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add categoryService with TDD"
```

### Task 8: channelService（TDD）

**Files:**
- Create: `tests/services/channelService.test.ts`, `src/services/channelService.ts`

- [ ] **Step 1: 编写测试**

```ts
// tests/services/channelService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../src/db/database';
import { seedDatabase } from '../../src/db/seed';
import {
  getAllChannels,
  incrementChannelUsage,
  createChannel,
} from '../../src/services/channelService';

describe('channelService', () => {
  beforeEach(async () => {
    await db.channels.clear();
    await seedDatabase();
  });

  it('getAllChannels() returns channels ordered by usage_count DESC', async () => {
    const chs = await getAllChannels();
    expect(chs.length).toBe(5);
    expect(chs[0].name).toBeDefined();
  });

  it('incrementChannelUsage() increases usage_count', async () => {
    await incrementChannelUsage('ch-001');
    const ch = await db.channels.get('ch-001');
    expect(ch?.usage_count).toBe(1);

    // 再次增加后应按 usage_count 排最前
    const sorted = await getAllChannels();
    expect(sorted[0].id).toBe('ch-001');
  });

  it('createChannel() inserts with default usage_count=0', async () => {
    const created = await createChannel({ name: 'Costco' });
    expect(created.usage_count).toBe(0);
    expect(created.name).toBe('Costco');
  });
});
```

- [ ] **Step 2-4: 实现 channelService 并验证**

```ts
// src/services/channelService.ts
import { db } from '../db/database';
import type { Channel } from '../types';

export async function getAllChannels(): Promise<Channel[]> {
  // 按 usage_count 降序，辅助 sort_order
  return db.channels.toArray().then(chs =>
    chs.sort((a, b) => b.usage_count - a.usage_count || a.sort_order - b.sort_order)
  );
}

export async function incrementChannelUsage(id: string): Promise<void> {
  const ch = await db.channels.get(id);
  if (ch) {
    await db.channels.update(id, { usage_count: (ch.usage_count ?? 0) + 1 });
  }
}

export async function createChannel(input: Partial<Channel>): Promise<Channel> {
  const channel: Channel = {
    id: crypto.randomUUID(),
    name: input.name ?? '',
    icon: input.icon,
    sort_order: input.sort_order ?? 99,
    usage_count: 0,
    created_at: new Date().toISOString(),
  };
  await db.channels.add(channel);
  return channel;
}

export async function updateChannel(id: string, input: Partial<Channel>): Promise<void> {
  await db.channels.update(id, input);
}

export async function deleteChannel(id: string): Promise<void> {
  await db.channels.delete(id);
}
```

验证：`npx vitest run tests/services/channelService.test.ts` → PASS。

- [ ] **Step 5: Commit**

### Task 9: fieldService（TDD）

**Files:**
- Create: `tests/services/fieldService.test.ts`, `src/services/fieldService.ts`

- [ ] **Step 1: 编写测试**

```ts
// tests/services/fieldService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../src/db/database';
import { seedDatabase } from '../../src/db/seed';
import { getFieldsByCategory, getGlobalFields, createField, deleteField } from '../../src/services/fieldService';

describe('fieldService', () => {
  beforeEach(async () => {
    await db.fields.clear();
    await seedDatabase();
  });

  it('getFieldsByCategory() returns fields for a specific category', async () => {
    const fields = await getFieldsByCategory('cat-001');
    expect(fields.length).toBe(5);  // 家用电器 5 个特有字段
    expect(fields[0].key).toBe('plug_type');
  });

  it('getFieldsByCategory() returns empty array for unknown category', async () => {
    const fields = await getFieldsByCategory('unknown');
    expect(fields.length).toBe(0);
  });

  it('getGlobalFields() returns fields with null category_id', async () => {
    // 当前种子数据没有全局字段，手动插入一条
    await createField({ key: 'notes_extra', label: '额外备注', data_type: 'text', required: false, sort_order: 1 });
    const fields = await getGlobalFields();
    expect(fields.length).toBe(1);
    expect(fields[0].key).toBe('notes_extra');
  });

  it('createField() adds field to category', async () => {
    const created = await createField({ category_id: 'cat-001', key: 'energy_grade', label: '能效等级', data_type: 'enum', options: ['一级', '二级', '三级'], required: false, sort_order: 6 });
    expect(created.key).toBe('energy_grade');
    const fields = await getFieldsByCategory('cat-001');
    expect(fields.length).toBe(6);
  });

  it('deleteField() removes field', async () => {
    await deleteField('fld-001');
    const fields = await getFieldsByCategory('cat-001');
    expect(fields.length).toBe(4);
  });
});
```

- [ ] **Step 2-4: 实现 fieldService 并验证**

```ts
// src/services/fieldService.ts
import { db } from '../db/database';
import type { Field, FieldDefinition, DataType } from '../types';

export async function getFieldsByCategory(categoryId: string): Promise<FieldDefinition[]> {
  const fields = await db.fields
    .where('category_id')
    .equals(categoryId)
    .sortBy('sort_order');
  return fields.map(toFieldDefinition);
}

export async function getGlobalFields(): Promise<FieldDefinition[]> {
  const fields = await db.fields
    .filter(f => f.category_id === undefined || f.category_id === null)
    .sortBy('sort_order');
  return fields.map(toFieldDefinition);
}

export async function createField(input: Partial<Field>): Promise<Field> {
  const field: Field = {
    id: input.id ?? crypto.randomUUID(),
    category_id: input.category_id,
    key: input.key ?? '',
    label: input.label ?? '',
    data_type: input.data_type ?? 'text',
    options: input.options,
    unit: input.unit,
    required: input.required ?? false,
    sort_order: input.sort_order ?? 99,
  };
  await db.fields.add(field);
  return field;
}

export async function updateField(id: string, input: Partial<Field>): Promise<void> {
  await db.fields.update(id, input);
}

export async function deleteField(id: string): Promise<void> {
  // 级联删除关联的 EAV 值
  await db.item_field_values.where('field_id').equals(id).delete();
  await db.fields.delete(id);
}

function toFieldDefinition(field: Field): FieldDefinition {
  return {
    id: field.id,
    category_id: field.category_id === undefined ? undefined : field.category_id,
    key: field.key,
    label: field.label,
    data_type: field.data_type,
    options: field.options,
    unit: field.unit,
    required: field.required,
    sort_order: field.sort_order,
  };
}
```

验证：`npx vitest run tests/services/fieldService.test.ts` → PASS。

- [ ] **Step 5: Commit**

### Task 10: locationService（TDD）

**Files:**
- Create: `tests/services/locationService.test.ts`, `src/services/locationService.ts`

- [ ] **Step 1: 编写测试**

```ts
// tests/services/locationService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../src/db/database';
import {
  createLocation,
  getLocationTree,
  getDescendantIds,
  deleteLocation,
} from '../../src/services/locationService';

describe('locationService', () => {
  beforeEach(async () => {
    await db.locations.clear();
  });

  it('createLocation() adds a top-level location', async () => {
    const loc = await createLocation({ name: '主卧', type: '房间' });
    expect(loc.name).toBe('主卧');
    expect(loc.parent_id).toBeUndefined();
  });

  it('getLocationTree() builds nested tree', async () => {
    const room = await createLocation({ name: '主卧', type: '房间' });
    const cabinet = await createLocation({ name: '衣柜', type: '家具', parent_id: room.id });
    await createLocation({ name: '书桌', type: '家具', parent_id: room.id });

    const tree = await getLocationTree();
    expect(tree.length).toBe(1);
    expect(tree[0].children.length).toBe(2);
  });

  it('getDescendantIds() returns recursive children', async () => {
    const room = await createLocation({ name: '储物间', type: '房间' });
    const box = await createLocation({ name: '储物箱A', type: '容器', parent_id: room.id });
    await createLocation({ name: '小盒子', type: '容器', parent_id: box.id });

    const ids = await getDescendantIds(room.id);
    expect(ids.length).toBe(2);
    expect(ids).toContain(box.id);
  });

  it('deleteLocation() removes location', async () => {
    const loc = await createLocation({ name: '杂物间', type: '房间' });
    await deleteLocation(loc.id);
    const all = await db.locations.toArray();
    expect(all.length).toBe(0);
  });
});
```

- [ ] **Step 2-4: 实现 locationService 并验证**

```ts
// src/services/locationService.ts
import { db } from '../db/database';
import type { Location, LocationTreeNode, LocationType } from '../types';

export async function createLocation(input: Partial<Location>): Promise<Location> {
  const location: Location = {
    id: crypto.randomUUID(),
    name: input.name ?? '',
    parent_id: input.parent_id,
    type: input.type ?? '房间',
  };
  await db.locations.add(location);
  return location;
}

export async function updateLocation(id: string, input: Partial<Location>): Promise<void> {
  await db.locations.update(id, input);
}

export async function deleteLocation(id: string): Promise<void> {
  // 递归删除子节点
  const children = await db.locations.where('parent_id').equals(id).toArray();
  for (const child of children) {
    await deleteLocation(child.id);
  }
  // 将关联物品的 location_id 置空
  const items = await db.items.where('location_id').equals(id).toArray();
  for (const item of items) {
    await db.items.update(item.id, { location_id: undefined });
  }
  await db.locations.delete(id);
}

export async function getDescendantIds(locationId: string): Promise<string[]> {
  const result: string[] = [];
  const children = await db.locations.where('parent_id').equals(locationId).toArray();
  for (const child of children) {
    result.push(child.id);
    const grandChildren = await getDescendantIds(child.id);
    result.push(...grandChildren);
  }
  return result;
}

export async function getLocationTree(): Promise<LocationTreeNode[]> {
  const all = await db.locations.toArray();
  const itemCounts = await countItemsByLocation();

  function buildTree(parentId?: string): LocationTreeNode[] {
    return all
      .filter(l => l.parent_id === parentId)
      .map(l => ({
        ...l,
        children: buildTree(l.id),
        item_count: (itemCounts.get(l.id) ?? 0) + sumChildItemCounts(l.id),
      }));
  }

  function sumChildItemCounts(locationId: string): number {
    return all
      .filter(l => l.parent_id === locationId)
      .reduce((sum, child) => sum + (itemCounts.get(child.id) ?? 0) + sumChildItemCounts(child.id), 0);
  }

  async function countItemsByLocation(): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    const items = await db.items.toArray();
    for (const item of items) {
      if (item.location_id) {
        map.set(item.location_id, (map.get(item.location_id) ?? 0) + 1);
      }
    }
    return map;
  }

  return buildTree();
}
```

验证：`npx vitest run tests/services/locationService.test.ts` → PASS。

- [ ] **Step 5: Commit**

### Task 11: itemService 第一部分——基础 CRUD（TDD）

**Files:**
- Create: `tests/services/itemService.test.ts`, `src/services/itemService.ts`

- [ ] **Step 1: 编写基础 CRUD 测试**

```ts
// tests/services/itemService.test.ts (第一部分: 基础 CRUD)
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../src/db/database';
import { seedDatabase } from '../../src/db/seed';
import { createItem, getItemDetail, updateItem, deleteItem, listItems, getDisplayLabel } from '../../src/services/itemService';

const baseItem = {
  name: '手机',
  category_id: 'cat-003',  // 电子设备
  quantity: 1,
  status: '在用' as const,
  currency: 'CNY',
};

describe('itemService — basic CRUD', () => {
  beforeEach(async () => {
    await db.items.clear();
    await db.item_field_values.clear();
    await db.categories.clear();
    await seedDatabase();
  });

  it('createItem() creates item with public fields', async () => {
    const item = await createItem({ ...baseItem, brand_model: 'iPhone 15 Pro' });
    expect(item.id).toBeDefined();
    expect(item.name).toBe('手机');
    expect(item.brand_model).toBe('iPhone 15 Pro');
  });

  it('getItemDetail() returns item with category name', async () => {
    const item = await createItem({ ...baseItem });
    const detail = await getItemDetail(item.id);
    expect(detail?.category_name).toBe('电子设备');
  });

  it('updateItem() modifies public fields', async () => {
    const item = await createItem({ ...baseItem });
    await updateItem(item.id, { name: '备用手机', rating: 4 });
    const updated = await db.items.get(item.id);
    expect(updated?.name).toBe('备用手机');
    expect(updated?.rating).toBe(4);
  });

  it('deleteItem() removes item and cascades', async () => {
    const item = await createItem({ ...baseItem });
    await deleteItem(item.id);
    const found = await db.items.get(item.id);
    expect(found).toBeUndefined();
  });

  it('listItems() filters by category', async () => {
    await createItem({ ...baseItem, category_id: 'cat-003' });
    await createItem({ ...baseItem, category_id: 'cat-001', name: '冰箱' });
    const items = await listItems({ category_id: 'cat-003' });
    expect(items.length).toBe(1);
    expect(items[0].name).toBe('手机');
  });

  it('listItems() filters by status', async () => {
    await createItem({ ...baseItem, status: '在用' });
    await createItem({ ...baseItem, status: '闲置', name: '平板' });
    const items = await listItems({ status: '闲置' });
    expect(items.length).toBe(1);
  });

  it('listItems() search by name', async () => {
    await createItem({ ...baseItem, name: '手机' });
    await createItem({ ...baseItem, name: '充电器' });
    const items = await listItems({ search: '手机' });
    expect(items.length).toBe(1);
  });
});
```

- [ ] **Step 2: 实现基础 CRUD**

```ts
// src/services/itemService.ts
import { db } from '../db/database';
import type { Item, ItemDetail, ItemListItem, ItemFormData, ItemFilter } from '../types';

function generateId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

export async function createItem(data: ItemFormData): Promise<Item> {
  const item: Item = {
    id: generateId(),
    name: data.name,
    category_id: data.category_id,
    brand_model: data.brand_model,
    quantity: data.quantity ?? 1,
    status: data.status ?? '在用',
    location_id: data.location_id,
    channel_id: data.channel_id,
    acquired_date: data.acquired_date,
    price: data.price,
    currency: data.currency ?? 'CNY',
    rating: data.rating,
    importance: data.importance,
    warranty_until: data.warranty_until,
    notes: data.notes,
    created_at: now(),
    updated_at: now(),
  };
  await db.items.add(item);

  // 写入 EAV 值
  if (data.custom_fields) {
    for (const [key, value] of Object.entries(data.custom_fields)) {
      const field = await db.fields.where({ key, category_id: data.category_id }).first();
      if (field && value !== undefined && value !== '') {
        await db.item_field_values.add({
          item_id: item.id,
          field_id: field.id,
          value,
        });
      }
    }
  }

  return item;
}

export async function getItemDetail(id: string): Promise<ItemDetail | null> {
  const item = await db.items.get(id);
  if (!item) return null;

  const category = item.category_id ? await db.categories.get(item.category_id) : undefined;
  const location = item.location_id ? await db.locations.get(item.location_id) : undefined;
  const channel = item.channel_id ? await db.channels.get(item.channel_id) : undefined;

  // 组装 EAV 值
  const eavRows = await db.item_field_values.where('item_id').equals(id).toArray();
  const custom_fields: Record<string, any> = {};
  for (const row of eavRows) {
    const field = await db.fields.get(row.field_id);
    if (field) {
      custom_fields[field.key] = row.value;
    }
  }

  return {
    ...item,
    category_name: category?.name,
    location_name: location?.name,
    channel_name: channel?.name,
    custom_fields,
  };
}

export async function updateItem(id: string, data: Partial<ItemFormData>): Promise<void> {
  const updateData: Partial<Item> = { ...data, updated_at: now() };
  // 移除 custom_fields，它走 EAV 路径
  delete (updateData as any).custom_fields;
  await db.items.update(id, updateData);

  // EAV 增量更新
  if (data.custom_fields) {
    // 删除当前的 EAV 值
    const existing = await db.item_field_values.where('item_id').equals(id).toArray();
    for (const row of existing) {
      await db.item_field_values.delete([row.item_id, row.field_id]);
    }
    // 重新写入新值
    for (const [key, value] of Object.entries(data.custom_fields)) {
      const field = await db.fields.where({ key, category_id: data.category_id }).first();
      if (field && value !== undefined && value !== '') {
        await db.item_field_values.add({
          item_id: id,
          field_id: field.id,
          value,
        });
      }
    }
  }
}

export async function deleteItem(id: string): Promise<void> {
  // 级联删除 EAV 值
  await db.item_field_values.where('item_id').equals(id).delete();
  // 级联删除照片（预留）
  await db.photos.where('item_id').equals(id).delete();
  await db.items.delete(id);
}

export async function listItems(filter?: ItemFilter): Promise<ItemListItem[]> {
  let collection = db.items.toCollection();

  if (filter?.category_id) {
    collection = collection.filter(i => i.category_id === filter.category_id);
  }
  if (filter?.status) {
    collection = collection.filter(i => i.status === filter.status);
  }
  if (filter?.location_id) {
    collection = collection.filter(i => i.location_id === filter.location_id);
  }
  if (filter?.channel_id) {
    collection = collection.filter(i => i.channel_id === filter.channel_id);
  }

  let items = await collection.toArray();

  if (filter?.search) {
    const q = filter.search.toLowerCase();
    items = items.filter(i =>
      i.name.toLowerCase().includes(q) ||
      (i.brand_model && i.brand_model.toLowerCase().includes(q)) ||
      (i.notes && i.notes.toLowerCase().includes(q))
    );
  }

  // 组装列表项
  const result: ItemListItem[] = [];
  for (const item of items) {
    const location = item.location_id ? await db.locations.get(item.location_id) : undefined;
    const category = await db.categories.get(item.category_id);
    result.push({
      id: item.id,
      name: item.name,
      brand_model: item.brand_model,
      category_id: item.category_id,
      category_name: category?.name,
      status: item.status,
      location_name: location?.name,
      rating: item.rating,
      importance: item.importance,
      created_at: item.created_at,
      display_label: getDisplayLabel(item, location?.name),
    });
  }

  // 按 created_at 倒序
  result.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return result;
}

export function getDisplayLabel(item: Item, locationName?: string): string {
  if (item.brand_model) return item.brand_model;
  if (locationName) return `${item.name} · ${locationName}`;
  return item.name;
}
```

- [ ] **Step 3: 运行测试**

```bash
npx vitest run tests/services/itemService.test.ts
```

Expected: 所有基础 CRUD 测试 PASS。

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add itemService basic CRUD with TDD"
```

### Task 12: itemService 第二部分——EAV 操作测试

**Files:**
- Modify: `tests/services/itemService.test.ts`（添加 EAV 测试）
- Modify: `src/services/itemService.ts`（已含 EAV 逻辑，此 Task 加完整测试覆盖）

- [ ] **Step 1: 添加 EAV 测试用例**

在 `tests/services/itemService.test.ts` 末尾添加：

```ts
describe('itemService — EAV custom fields', () => {
  beforeEach(async () => {
    await db.items.clear();
    await db.item_field_values.clear();
  });

  it('createItem() saves custom field values', async () => {
    const item = await createItem({
      ...baseItem,
      custom_fields: { serial_number: 'SN-12345', charge_port: 'USB-C' },
    });
    const detail = await getItemDetail(item.id);
    expect(detail?.custom_fields?.serial_number).toBe('SN-12345');
    expect(detail?.custom_fields?.charge_port).toBe('USB-C');
  });

  it('updateItem() modifies custom field values', async () => {
    const item = await createItem({
      ...baseItem,
      custom_fields: { serial_number: 'SN-12345' },
    });
    await updateItem(item.id, {
      custom_fields: { serial_number: 'SN-UPDATED', charge_port: 'Lightning' },
    });
    const detail = await getItemDetail(item.id);
    expect(detail?.custom_fields?.serial_number).toBe('SN-UPDATED');
    expect(detail?.custom_fields?.charge_port).toBe('Lightning');
  });

  it('deleteItem() cascades to delete EAV values', async () => {
    const item = await createItem({
      ...baseItem,
      custom_fields: { serial_number: 'SN-12345' },
    });
    await deleteItem(item.id);
    const eavRows = await db.item_field_values.where('item_id').equals(item.id).toArray();
    expect(eavRows.length).toBe(0);
  });

  it('getDisplayLabel() returns brand_model when present', () => {
    const item = { id: '1', name: '手机', brand_model: 'iPhone 15 Pro' } as Item;
    expect(getDisplayLabel(item)).toBe('iPhone 15 Pro');
  });

  it('getDisplayLabel() returns name + location when no brand_model', () => {
    const item = { id: '1', name: '充电线' } as Item;
    expect(getDisplayLabel(item, '主卧')).toBe('充电线 · 主卧');
  });

  it('getDisplayLabel() returns name only when neither', () => {
    const item = { id: '1', name: '剪刀' } as Item;
    expect(getDisplayLabel(item)).toBe('剪刀');
  });
});
```

- [ ] **Step 2: 验证 EAV 测试通过**

```bash
npx vitest run tests/services/itemService.test.ts
```

Expected: 所有测试（基础 CRUD + EAV + displayLabel）PASS。

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add itemService EAV operations tests"
```

---

## Phase 4: React Hooks 层

### Task 13: useLiveQuery 基础 wrapper + 简单 hooks

**Files:**
- Create: `src/hooks/useLiveQuery.ts`, `src/hooks/useCategories.ts`, `src/hooks/useChannels.ts`
- `useLiveQuery` 包装 Dexie 的 `useLiveQuery`，提供统一的 observable 接口。

- [ ] **Step 1: 创建 useLiveQuery wrapper**

Dexie 自带的 `dexie-react-hooks` 已提供 `useLiveQuery`，我们只需确保它已安装并包装一层类型安全抽象：

```bash
npm install dexie-react-hooks
```

创建 `src/hooks/useLiveQuery.ts`：

```ts
import { useLiveQuery as dexieUseLiveQuery } from 'dexie-react-hooks';

// 薄封装，未来可在加同步层时在此拦截
export function useLiveQuery<T>(query: () => Promise<T>, deps: any[] = []): T | undefined {
  return dexieUseLiveQuery(query, deps);
}
```

- [ ] **Step 2: 创建 useCategories hook**

```ts
// src/hooks/useCategories.ts
import { useLiveQuery } from './useLiveQuery';
import { getAllCategories, getCategoryById } from '../services/categoryService';
import type { Category } from '../types';

export function useCategories(): Category[] | undefined {
  return useLiveQuery(() => getAllCategories());
}

export function useCategory(id?: string): Category | null | undefined {
  return useLiveQuery(() => id ? getCategoryById(id) : Promise.resolve(null), [id]);
}
```

- [ ] **Step 3: 创建 useChannels hook**

```ts
// src/hooks/useChannels.ts
import { useLiveQuery } from './useLiveQuery';
import { getAllChannels } from '../services/channelService';
import type { Channel } from '../types';

export function useChannels(): Channel[] | undefined {
  return useLiveQuery(() => getAllChannels());
}
```

- [ ] **Step 4: 验证——在 HomePage 中测试**

临时修改 `src/pages/HomePage.tsx`：

```tsx
import { useCategories } from '../hooks/useCategories';

export function HomePage() {
  const categories = useCategories();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Metidy</h1>
      <ul className="mt-4">
        {categories?.map(c => (
          <li key={c.id}>{c.icon} {c.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

运行 `npm run dev` 确认页面显示 6 个分类。

- [ ] **Step 5: 恢复 HomePage 占位并 Commit**

```bash
git add -A && git commit -m "feat: add useLiveQuery, useCategories, useChannels hooks"
```

### Task 14: 剩余 hooks

**Files:**
- Create: `src/hooks/useItems.ts`, `src/hooks/useFields.ts`, `src/hooks/useLocations.ts`

- [ ] **Step 1: 创建 useItems hook**

```ts
// src/hooks/useItems.ts
import { useLiveQuery } from './useLiveQuery';
import { listItems, getItemDetail } from '../services/itemService';
import type { ItemDetail, ItemListItem, ItemFilter } from '../types';

export function useItemList(filter?: ItemFilter): ItemListItem[] | undefined {
  return useLiveQuery(() => listItems(filter), [JSON.stringify(filter)]);
}

export function useItemDetail(id?: string): ItemDetail | null | undefined {
  return useLiveQuery(
    () => id ? getItemDetail(id) : Promise.resolve(null),
    [id]
  );
}
```

- [ ] **Step 2: 创建 useFields hook**

```ts
// src/hooks/useFields.ts
import { useLiveQuery } from './useLiveQuery';
import { getFieldsByCategory, getGlobalFields } from '../services/fieldService';
import type { FieldDefinition } from '../types';

export function useFieldsForCategory(categoryId?: string): FieldDefinition[] | undefined {
  return useLiveQuery(
    () => categoryId ? getFieldsByCategory(categoryId) : Promise.resolve([]),
    [categoryId]
  );
}

export function useGlobalFields(): FieldDefinition[] | undefined {
  return useLiveQuery(() => getGlobalFields());
}
```

- [ ] **Step 3: 创建 useLocations hook**

```ts
// src/hooks/useLocations.ts
import { useLiveQuery } from './useLiveQuery';
import { getLocationTree } from '../services/locationService';
import type { LocationTreeNode } from '../types';

export function useLocationTree(): LocationTreeNode[] | undefined {
  return useLiveQuery(() => getLocationTree());
}
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add remaining hooks (useItems, useFields, useLocations)"
```

---

## Phase 5: UI 布局框架

### Task 15: 全局响应式布局组件

**Files:**
- Create: `src/components/layout/AppLayout.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/layout/MobileNav.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: 安装图标依赖**

```bash
npm install lucide-react
```

- [ ] **Step 2: 创建 Sidebar（桌面端）**

```tsx
// src/components/layout/Sidebar.tsx
import { NavLink } from 'react-router-dom';
import { Home, Package, MapPin, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: Home, label: '首页' },
  { to: '/items', icon: Package, label: '物品' },
  { to: '/locations', icon: MapPin, label: '位置' },
  { to: '/settings', icon: Settings, label: '设置' },
];

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-56 border-r bg-muted/30 min-h-screen p-4 gap-2">
      <h1 className="text-xl font-bold px-3 py-4">Metidy</h1>
      {NAV_ITEMS.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`
          }
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </NavLink>
      ))}
    </aside>
  );
}
```

- [ ] **Step 3: 创建 MobileNav（移动端底部 Tab）**

```tsx
// src/components/layout/MobileNav.tsx
import { NavLink } from 'react-router-dom';
import { Home, Package, MapPin, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: Home, label: '首页' },
  { to: '/items', icon: Package, label: '物品' },
  { to: '/locations', icon: MapPin, label: '位置' },
  { to: '/settings', icon: Settings, label: '设置' },
];

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background z-50">
      <div className="flex justify-around items-center h-14 safe-area-bottom">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 text-xs ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
```

- [ ] **Step 4: 创建 AppLayout**

```tsx
// src/components/layout/AppLayout.tsx
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

export function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pb-16 md:pb-0">
        <div className="container max-w-4xl mx-auto p-4">
          <Outlet />
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
```

- [ ] **Step 5: 更新 App.tsx 使用布局路由**

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { ItemsPage } from './pages/ItemsPage';
import { ItemAddPage } from './pages/ItemAddPage';
import { ItemEditPage } from './pages/ItemEditPage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { LocationsPage } from './pages/LocationsPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/items" element={<ItemsPage />} />
          <Route path="/items/add" element={<ItemAddPage />} />
          <Route path="/items/:id" element={<ItemDetailPage />} />
          <Route path="/items/:id/edit" element={<ItemEditPage />} />
          <Route path="/locations" element={<LocationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

- [ ] **Step 6: 验证**

```bash
npm run dev
```

在浏览器中可见侧边栏（桌面）或底部 Tab（移动/缩小窗口），点击导航切换页面。

- [ ] **Step 7: Delete App.css if exists, then Commit**

```bash
rm -f src/App.css
git add -A && git commit -m "feat: add responsive layout (sidebar + mobile nav)"
```

---

## Phase 6: 核心功能页面

### Task 16: 物品列表页（ItemsPage + ItemCard + ItemFilterBar）

**Files:**
- Create: `src/components/items/ItemCard.tsx`, `src/components/items/ItemFilterBar.tsx`, `src/components/items/ItemList.tsx`
- Modify: `src/pages/ItemsPage.tsx`

- [ ] **Step 1: 创建 ItemCard 组件**

```tsx
// src/components/items/ItemCard.tsx
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/card';
import type { ItemListItem } from '../../types';

const STATUS_COLORS: Record<string, string> = {
  '在用': 'bg-green-100 text-green-800',
  '闲置': 'bg-yellow-100 text-yellow-800',
  '已出': 'bg-gray-100 text-gray-800',
  '已弃': 'bg-red-100 text-red-800',
  '借出': 'bg-blue-100 text-blue-800',
};

interface ItemCardProps {
  item: ItemListItem;
}

export function ItemCard({ item }: ItemCardProps) {
  return (
    <Link to={`/items/${item.id}`}>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-base">{item.display_label}</CardTitle>
              <CardDescription className="text-xs mt-1">
                {item.category_name} · {item.location_name ?? '未放置'}
              </CardDescription>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status] ?? ''}`}>
              {item.status}
            </span>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 2: 创建 ItemFilterBar 组件**

```tsx
// src/components/items/ItemFilterBar.tsx
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Search, X } from 'lucide-react';
import type { ItemStatus, Category } from '../../types';
import { useState } from 'react';

const STATUS_OPTIONS: ItemStatus[] = ['在用', '闲置', '已出', '已弃', '借出'];

interface ItemFilterBarProps {
  categories: Category[] | undefined;
  onFilterChange: (filters: { search?: string; category_id?: string; status?: ItemStatus }) => void;
}

export function ItemFilterBar({ categories, onFilterChange }: ItemFilterBarProps) {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  const apply = () => {
    onFilterChange({
      search: search || undefined,
      category_id: categoryId || undefined,
      status: (status || undefined) as ItemStatus | undefined,
    });
  };

  const clear = () => {
    setSearch('');
    setCategoryId('');
    setStatus('');
    onFilterChange({});
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索物品..."
          className="pl-8"
          value={search}
          onChange={(e) => { setSearch(e.target.value); apply(); }}
        />
      </div>
      <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); apply(); }}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="全部分类" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部分类</SelectItem>
          {categories?.map(c => (
            <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={status} onValueChange={(v) => { setStatus(v); apply(); }}>
        <SelectTrigger className="w-[110px]">
          <SelectValue placeholder="全部状态" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部状态</SelectItem>
          {STATUS_OPTIONS.map(s => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {(search || categoryId || status) && (
        <Button variant="ghost" size="icon" onClick={clear}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: 创建 ItemList**

```tsx
// src/components/items/ItemList.tsx
import { ItemCard } from './ItemCard';
import type { ItemListItem } from '../../types';

interface ItemListProps {
  items: ItemListItem[] | undefined;
}

export function ItemList({ items }: ItemListProps) {
  if (!items) {
    return <div className="text-muted-foreground text-sm py-8 text-center">加载中...</div>;
  }
  if (items.length === 0) {
    return <div className="text-muted-foreground text-sm py-12 text-center">没有物品，点击右下角 + 添加第一个</div>;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {items.map(item => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: 实现 ItemsPage**

```tsx
// src/pages/ItemsPage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ItemFilterBar } from '../components/items/ItemFilterBar';
import { ItemList } from '../components/items/ItemList';
import { useItemList } from '../hooks/useItems';
import { useCategories } from '../hooks/useCategories';
import type { ItemFilter, ItemStatus } from '../types';

export function ItemsPage() {
  const categories = useCategories();
  const [filters, setFilters] = useState<ItemFilter>({});
  const items = useItemList(filters);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">物品</h1>
        <Link to="/items/add">
          <Button size="sm"><Plus className="h-4 w-4 mr-1" />新增</Button>
        </Link>
      </div>
      <ItemFilterBar
        categories={categories}
        onFilterChange={(f) => setFilters(f)}
      />
      <ItemList items={items} />
    </div>
  );
}
```

- [ ] **Step 5: 验证并 Commit**

```bash
npm run dev  # 访问 /items 确认列表 + 筛选 UI
git add -A && git commit -m "feat: add items list page with filter bar"
```

### Task 17: DynamicFormSection（动态表单渲染引擎—MVP 最关键组件）

**Files:**
- Create: `src/components/fields/DynamicFormSection.tsx`

- [ ] **Step 1: 实现 DynamicFormSection**

```tsx
// src/components/fields/DynamicFormSection.tsx
import { useFieldsForCategory } from '../../hooks/useFields';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';  // ← 需要执行 npx shadcn@latest add switch
import type { FieldDefinition } from '../../types';

// 补充 Switch 组件: npx shadcn@latest add switch

interface DynamicFormSectionProps {
  categoryId?: string;
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
}

export function DynamicFormSection({ categoryId, values, onChange }: DynamicFormSectionProps) {
  const fields = useFieldsForCategory(categoryId);

  if (!categoryId || !fields || fields.length === 0) {
    return null;
  }

  const setValue = (key: string, value: any) => {
    onChange({ ...values, [key]: value });
  };

  const renderField = (field: FieldDefinition) => {
    const currentValue = values[field.key];

    switch (field.data_type) {
      case 'text':
        return (
          <Input
            value={currentValue ?? ''}
            onChange={(e) => setValue(field.key, e.target.value)}
            placeholder={field.label}
          />
        );

      case 'number':
        return (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={currentValue ?? ''}
              onChange={(e) => setValue(field.key, e.target.value ? Number(e.target.value) : undefined)}
              placeholder={field.label}
              className="flex-1"
            />
            {field.unit && <span className="text-sm text-muted-foreground whitespace-nowrap">{field.unit}</span>}
          </div>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={currentValue ?? ''}
            onChange={(e) => setValue(field.key, e.target.value || undefined)}
          />
        );

      case 'enum':
        return (
          <Select
            value={currentValue ?? ''}
            onValueChange={(v) => setValue(field.key, v || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`选择${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="empty">— 不填 —</SelectItem>
              {field.options?.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'boolean':
        return (
          <div className="flex items-center gap-3">
            <Switch
              checked={currentValue === true}
              onCheckedChange={(checked) => setValue(field.key, checked || undefined)}
            />
            <span className="text-sm">{field.label}</span>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <fieldset className="border rounded-lg p-4 space-y-4">
      <legend className="text-sm font-medium text-muted-foreground px-1">分类特有字段</legend>
      {fields.map(field => (
        <div key={field.id} className="space-y-1.5">
          <Label>
            {field.label}
            {field.required && <span className="text-destructive ml-0.5">*</span>}
          </Label>
          {renderField(field)}
        </div>
      ))}
    </fieldset>
  );
}
```

先用 `npx shadcn@latest add switch` 安装 Switch 组件。

- [ ] **Step 2: 验证——在 ItemAddPage 中测试**

临时修改 ItemAddPage 渲染 DynamicFormSection（后续 Task 18 正式实现）：

```tsx
// 临时测试代码——验证 DynamicFormSection 渲染
import { useState } from 'react';
import { DynamicFormSection } from '../components/fields/DynamicFormSection';
import { useCategories } from '../hooks/useCategories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';

export function ItemAddPage() {
  const categories = useCategories();
  const [categoryId, setCategoryId] = useState<string>('');
  const [customFields, setCustomFields] = useState<Record<string, any>>({});

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">新增物品</h1>
      <div>
        <Label>分类 *</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger>
            <SelectValue placeholder="选择分类" />
          </SelectTrigger>
          <SelectContent>
            {categories?.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DynamicFormSection
        categoryId={categoryId}
        values={customFields}
        onChange={setCustomFields}
      />
    </div>
  );
}
```

运行 `npm run dev`，访问 /items/add：
1. 不选分类 → 只显示"分类 *"，无动态字段 ✅
2. 选"电子设备" → 展开序列号、充电接口、固件版本三个字段 ✅
3. 选"书籍" → 展开作者、ISBN、读完三个字段 ✅
4. 切换到空分类 → 动态字段消失 ✅

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add DynamicFormSection - EAV-driven form rendering engine"
```

### Task 18: ItemForm（公共字段 + 动态字段合体）

**Files:**
- Create: `src/components/items/ItemForm.tsx`
- Modify: `src/pages/ItemAddPage.tsx`（正式实现）

- [ ] **Step 1: 创建 ItemForm 组件**

```tsx
// src/components/items/ItemForm.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { DynamicFormSection } from '../fields/DynamicFormSection';
import { useCategories } from '../../hooks/useCategories';
import { useChannels } from '../../hooks/useChannels';
import { useLocationTree } from '../../hooks/useLocations';
import { createItem, updateItem } from '../../services/itemService';
import { incrementChannelUsage } from '../../services/channelService';
import type { ItemFormData, ItemDetail, ItemStatus, Importance } from '../../types';

const STATUS_OPTIONS: ItemStatus[] = ['在用', '闲置', '已出', '已弃', '借出'];
const IMPORTANCE_OPTIONS: Importance[] = ['低', '中', '高', '关键'];

interface ItemFormProps {
  editItem?: ItemDetail;  // undefined = 新增模式
}

export function ItemForm({ editItem }: ItemFormProps) {
  const navigate = useNavigate();
  const categories = useCategories();
  const channels = useChannels();
  const locationTree = useLocationTree();

  const isNew = !editItem;

  // 表单状态
  const [name, setName] = useState(editItem?.name ?? '');
  const [categoryId, setCategoryId] = useState(editItem?.category_id ?? '');
  const [brandModel, setBrandModel] = useState(editItem?.brand_model ?? '');
  const [quantity, setQuantity] = useState(editItem?.quantity ?? 1);
  const [status, setStatus] = useState<ItemStatus>(editItem?.status ?? '在用');
  const [locationId, setLocationId] = useState(editItem?.location_id ?? '');
  const [channelId, setChannelId] = useState(editItem?.channel_id ?? '');
  const [acquiredDate, setAcquiredDate] = useState(editItem?.acquired_date ?? '');
  const [price, setPrice] = useState(editItem?.price?.toString() ?? '');
  const [rating, setRating] = useState(editItem?.rating?.toString() ?? '');
  const [importance, setImportance] = useState(editItem?.importance ?? '');
  const [warrantyUntil, setWarrantyUntil] = useState(editItem?.warranty_until ?? '');
  const [notes, setNotes] = useState(editItem?.notes ?? '');
  const [customFields, setCustomFields] = useState<Record<string, any>>(editItem?.custom_fields ?? {});
  const [saving, setSaving] = useState(false);

  // 编辑模式初始化后如有 category 不清空
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (editItem && !initialized) {
      setCustomFields(editItem.custom_fields ?? {});
      setInitialized(true);
    }
  }, [editItem, initialized]);

  // 收集扁平 location 列表
  const flatLocations = locationTree ? flattenLocations(locationTree) : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !categoryId) return;

    setSaving(true);
    const data: ItemFormData = {
      name: name.trim(),
      category_id: categoryId,
      brand_model: brandModel.trim() || undefined,
      quantity,
      status,
      location_id: locationId || undefined,
      channel_id: channelId || undefined,
      acquired_date: acquiredDate || undefined,
      price: price ? Number(price) : undefined,
      rating: rating ? Number(rating) : undefined,
      importance: (importance || undefined) as Importance | undefined,
      warranty_until: warrantyUntil || undefined,
      notes: notes.trim() || undefined,
      custom_fields: Object.keys(customFields).length > 0 ? customFields : undefined,
    };

    try {
      if (editItem) {
        await updateItem(editItem.id, data);
      } else {
        await createItem(data);
      }
      // 增加渠道使用计数
      if (channelId) {
        await incrementChannelUsage(channelId);
      }
      navigate(editItem ? `/items/${editItem.id}` : '/items');
    } catch (err) {
      console.error('保存失败', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本字段（闪电录入：name + category 即可） */}
      <fieldset className="border rounded-lg p-4 space-y-4">
        <legend className="text-sm font-medium text-muted-foreground px-1">基本信息</legend>

        <div>
          <Label>名称 *</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="手机" required />
        </div>

        <div>
          <Label>分类 *</Label>
          <Select value={categoryId} onValueChange={setCategoryId} required>
            <SelectTrigger><SelectValue placeholder="选择分类" /></SelectTrigger>
            <SelectContent>
              {categories?.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>品牌型号</Label>
          <Input value={brandModel} onChange={e => setBrandModel(e.target.value)} placeholder="iPhone 15 Pro" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>数量</Label>
            <Input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min={1} />
          </div>
          <div>
            <Label>状态</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ItemStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </fieldset>

      {/* 动态字段：按分类渲染 */}
      <DynamicFormSection
        categoryId={categoryId}
        values={customFields}
        onChange={setCustomFields}
      />

      {/* 扩展字段 */}
      <fieldset className="border rounded-lg p-4 space-y-4">
        <legend className="text-sm font-medium text-muted-foreground px-1">详细信息（可选）</legend>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>位置</Label>
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger><SelectValue placeholder="选择位置" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="empty">— 不填 —</SelectItem>
                {flatLocations.map(loc => (
                  <SelectItem key={loc.id} value={loc.id}>{'　'.repeat(loc.depth)}{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>购入渠道</Label>
            <Select value={channelId} onValueChange={setChannelId}>
              <SelectTrigger><SelectValue placeholder="选择渠道" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="empty">— 不填 —</SelectItem>
                {channels?.map(ch => (
                  <SelectItem key={ch.id} value={ch.id}>{ch.name} {ch.usage_count > 0 ? `(${ch.usage_count})` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>购入日期</Label>
            <Input type="date" value={acquiredDate} onChange={e => setAcquiredDate(e.target.value)} />
          </div>
          <div>
            <Label>价格</Label>
            <Input type="number" value={price} onChange={e => setPrice(e.target.value)} step="0.01" placeholder="0.00" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>评分</Label>
            <Select value={rating} onValueChange={setRating}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="empty">— 不填 —</SelectItem>
                {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{'★'.repeat(n)}{'☆'.repeat(5-n)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>重要性</Label>
            <Select value={importance} onValueChange={setImportance}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="empty">— 不填 —</SelectItem>
                {IMPORTANCE_OPTIONS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>保修到期</Label>
          <Input type="date" value={warrantyUntil} onChange={e => setWarrantyUntil(e.target.value)} />
        </div>

        <div>
          <Label>备注</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="自由备注..." />
        </div>
      </fieldset>

      <div className="flex gap-3 justify-end sticky bottom-16 md:bottom-0 bg-background py-4 border-t md:border-t-0">
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>取消</Button>
        <Button type="submit" disabled={saving || !name.trim() || !categoryId}>
          <Save className="h-4 w-4 mr-1" />
          {saving ? '保存中...' : '保存'}
        </Button>
      </div>
    </form>
  );
}

// 工具：展平位置树（用于 Select）
function flattenLocations(nodes: any[], depth = 0): any[] {
  const result: any[] = [];
  for (const node of nodes) {
    result.push({ id: node.id, name: node.name, depth });
    result.push(...flattenLocations(node.children, depth + 1));
  }
  return result;
}
```

- [ ] **Step 2: 正式实现 ItemAddPage**

```tsx
// src/pages/ItemAddPage.tsx
import { ItemForm } from '../components/items/ItemForm';

export function ItemAddPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">新增物品</h1>
      <ItemForm />
    </div>
  );
}
```

- [ ] **Step 3: Confirm textarea component exists**

```bash
npx shadcn@latest add textarea  # if not already added in Task 2
```

- [ ] **Step 4: 验证**

```bash
npm run dev
```

流程：
1. 访问 /items/add
2. 填写 name="iPhone 15 Pro"，选分类"电子设备"
3. 动态字段展开：序列号、充电接口、固件版本
4. 填完提交 → 跳转到 /items，列表出现
5. 再添加一件"冰箱"（分类"家用电器"） → 动态字段切换为插座类型、功率、安装房间...

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add ItemForm with dynamic EAV field rendering"
```

### Task 19: 物品详情页 + 编辑页

**Files:**
- Modify: `src/pages/ItemDetailPage.tsx`, `src/pages/ItemEditPage.tsx`

- [ ] **Step 1: 实现 ItemDetailPage**

```tsx
// src/pages/ItemDetailPage.tsx
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useItemDetail } from '../hooks/useItems';
import { deleteItem } from '../services/itemService';
import { useState } from 'react';

export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const item = useItemDetail(id);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!id || !confirm('确定删除？')) return;
    setDeleting(true);
    await deleteItem(id);
    navigate('/items');
  }

  if (!item) {
    return <p className="text-muted-foreground py-8 text-center">加载中...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" />返回
        </Button>
        <div className="flex gap-2">
          <Link to={`/items/${item.id}/edit`}>
            <Button variant="outline" size="sm"><Edit className="h-4 w-4 mr-1" />编辑</Button>
          </Link>
          <Button variant="destructive" size="sm" disabled={deleting} onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-1" />{deleting ? '删除中...' : '删除'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {item.brand_model ?? item.name}
            {item.brand_model && item.brand_model !== item.name && (
              <span className="text-sm font-normal text-muted-foreground ml-2">({item.name})</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <DetailRow label="分类" value={item.category_name} />
          <DetailRow label="品牌型号" value={item.brand_model} />
          <DetailRow label="数量" value={String(item.quantity)} />
          <DetailRow label="状态" value={item.status} />
          <DetailRow label="位置" value={item.location_name} />
          <DetailRow label="购入渠道" value={item.channel_name} />
          <DetailRow label="购入日期" value={item.acquired_date} />
          <DetailRow label="价格" value={item.price != null ? `${item.currency ?? 'CNY'} ${item.price}` : undefined} />
          <DetailRow label="评分" value={item.rating ? '★'.repeat(item.rating) + '☆'.repeat(5-item.rating) : undefined} />
          <DetailRow label="重要性" value={item.importance} />
          <DetailRow label="保修到期" value={item.warranty_until} />
          <DetailRow label="备注" value={item.notes} />
          {item.custom_fields && Object.keys(item.custom_fields).length > 0 && (
            <>
              <div className="border-t pt-3 mt-3" />
              <h3 className="text-sm font-medium text-muted-foreground">分类特有字段</h3>
              {Object.entries(item.custom_fields).map(([key, value]) => (
                <DetailRow key={key} label={key} value={value !== undefined ? String(value) : undefined} />
              ))}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (value === undefined || value === '') return null;
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}
```

- [ ] **Step 2: 实现 ItemEditPage**

```tsx
// src/pages/ItemEditPage.tsx
import { useParams } from 'react-router-dom';
import { useItemDetail } from '../hooks/useItems';
import { ItemForm } from '../components/items/ItemForm';

export function ItemEditPage() {
  const { id } = useParams<{ id: string }>();
  const item = useItemDetail(id);

  if (!item) {
    return <p className="text-muted-foreground py-8 text-center">加载中...</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">编辑物品</h1>
      <ItemForm editItem={item} />
    </div>
  );
}
```

- [ ] **Step 3: 验证**

```bash
npm run dev
```

1. 访问 /items/某物品ID → 详情页显示全部字段 + EAV 值
2. 点击"编辑" → 跳转编辑页，表单预填充
3. 修改后保存 → 返回详情页，确认改动
4. 删除 → 回到列表

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add item detail and edit pages"
```

### Task 20: 首页仪表盘

**Files:**
- Modify: `src/pages/HomePage.tsx`

- [ ] **Step 1: 实现 HomePage**

```tsx
// src/pages/HomePage.tsx
import { Link } from 'react-router-dom';
import { Package, MapPin, Settings, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useItemList } from '../hooks/useItems';
import { useCategories } from '../hooks/useCategories';
import { useLocationTree } from '../hooks/useLocations';

export function HomePage() {
  const items = useItemList({});
  const categories = useCategories();
  const locationTree = useLocationTree();

  const statusCounts: Record<string, number> = {};
  items?.forEach(i => {
    statusCounts[i.status] = (statusCounts[i.status] ?? 0) + 1;
  });

  // 计算位置下物品总数
  function countItems(node: any): number {
    return node.item_count + node.children.reduce((s: number, c: any) => s + countItems(c), 0);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Metidy</h1>
      <p className="text-muted-foreground text-sm">物品管理系统</p>

      {/* 快速操作 */}
      <div className="flex gap-2">
        <Link to="/items/add">
          <Button><Plus className="h-4 w-4 mr-1" />新增物品</Button>
        </Link>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="总物品" value={items?.length ?? 0} />
        <StatCard label="在用" value={statusCounts['在用'] ?? 0} />
        <StatCard label="闲置" value={statusCounts['闲置'] ?? 0} />
        <StatCard label="已出/已弃" value={(statusCounts['已出'] ?? 0) + (statusCounts['已弃'] ?? 0)} />
      </div>

      {/* 链接区域 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Link to="/items" className="block">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />物品列表
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{categories?.length ?? 0} 个分类 · {items?.length ?? 0} 件物品</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/locations" className="block">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />位置管理
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{locationTree?.length ?? 0} 个顶层位置</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/settings" className="block">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />设置
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">分类 · 字段 · 渠道</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* 最近添加 */}
      {items && items.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">最近添加</h2>
          <div className="space-y-1">
            {items.slice(0, 5).map(item => (
              <Link key={item.id} to={`/items/${item.id}`} className="block">
                <div className="flex justify-between items-center py-2 px-3 rounded-md hover:bg-muted transition-colors text-sm">
                  <span className="font-medium">{item.display_label}</span>
                  <span className="text-muted-foreground">{item.category_name} · {item.status}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-6 pb-4 text-center">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: 验证**

```bash
npm run dev
```

首页应显示：统计卡片（全部/在用/闲置/已出弃）、快捷导航卡片、最近添加列表。

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add home page dashboard"
```

---

## Phase 7: 管理页面

### Task 21: 位置管理页

**Files:**
- Modify: `src/pages/LocationsPage.tsx`
- Create: `src/components/locations/LocationTree.tsx`

- [ ] **Step 1: 创建 LocationTree 交互组件**

```tsx
// src/components/locations/LocationTree.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronDown, Plus, Pencil, Trash2, FolderOpen, DoorOpen, Box } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useLocationTree } from '../../hooks/useLocations';
import { createLocation, updateLocation, deleteLocation } from '../../services/locationService';
import type { LocationTreeNode, LocationType } from '../../types';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  '房间': <DoorOpen className="h-4 w-4" />,
  '家具': <FolderOpen className="h-4 w-4" />,
  '容器': <Box className="h-4 w-4" />,
};

const LOCATION_TYPES: LocationType[] = ['房间', '家具', '容器'];

export function LocationTree() {
  const tree = useLocationTree();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // 新增/编辑模态
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<LocationType>('房间');
  const [addingUnderId, setAddingUnderId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<LocationType>('容器');

  const toggle = (id: string) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  };

  const handleAdd = async (parentId?: string) => {
    if (!newName.trim()) return;
    await createLocation({ name: newName.trim(), parent_id: parentId, type: newType });
    setNewName('');
    setNewType('容器');
    setAddingUnderId(null);
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    await updateLocation(id, { name: editName.trim(), type: editType });
    setEditingId(null);
  };

  const handleDelete = async (id: string, nodeLabel: string) => {
    if (!confirm(`确定删除 "${nodeLabel}" 及其所有子位置？关联物品的 location 将置空。`)) return;
    await deleteLocation(id);
  };

  const renderNode = (node: LocationTreeNode) => {
    const isExpanded = expanded.has(node.id);
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id} className="ml-4">
        <div className="flex items-center gap-1 py-1 group">
          {hasChildren ? (
            <button onClick={() => toggle(node.id)} className="p-0.5 hover:bg-muted rounded">
              {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          ) : (
            <span className="w-5" />
          )}
          <span className="mr-1">{TYPE_ICONS[node.type]}</span>
          {editingId === node.id ? (
            <div className="flex items-center gap-1 flex-1">
              <Input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="h-7 text-sm flex-1"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleUpdate(node.id)}
              />
              <Select value={editType} onValueChange={(v) => setEditType(v as LocationType)}>
                <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LOCATION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleUpdate(node.id)}>保存</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingId(null)}>取消</Button>
            </div>
          ) : (
            <>
              <Link to={`/items?location=${node.id}`} className="text-sm hover:text-primary flex-1">
                {node.name}
                <span className="text-xs text-muted-foreground ml-1">({node.item_count})</span>
              </Link>
              <div className="hidden group-hover:flex items-center gap-0.5">
                <Button
                  size="sm" variant="ghost" className="h-6 w-6 p-0"
                  onClick={() => { setEditingId(node.id); setEditName(node.name); setEditType(node.type); }}
                ><Pencil className="h-3 w-3" /></Button>
                <Button
                  size="sm" variant="ghost" className="h-6 w-6 p-0"
                  onClick={() => { setAddingUnderId(node.id); setNewName(''); setNewType('容器'); }}
                ><Plus className="h-3 w-3" /></Button>
                <Button
                  size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive"
                  onClick={() => handleDelete(node.id, node.name)}
                ><Trash2 className="h-3 w-3" /></Button>
              </div>
            </>
          )}
        </div>

        {/* 添加子位置 input */}
        {addingUnderId === node.id && (
          <div className="ml-8 flex items-center gap-1 py-1">
            <Input value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="新位置名" className="h-7 text-sm flex-1" autoFocus
              onKeyDown={e => e.key === 'Enter' && handleAdd(node.id)}
            />
            <Select value={newType} onValueChange={(v) => setNewType(v as LocationType)}>
              <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LOCATION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleAdd(node.id)}>确定</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAddingUnderId(null)}>取消</Button>
          </div>
        )}

        {isExpanded && hasChildren && node.children.map(renderNode)}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {/* 根级添加 */}
      <div className="flex items-center gap-1 mb-2">
        <Input value={newName} onChange={e => setNewName(e.target.value)}
          placeholder="添加新位置" className="h-8 text-sm flex-1"
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <Select value={newType} onValueChange={(v) => setNewType(v as LocationType)}>
          <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {LOCATION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" className="h-8" onClick={() => handleAdd()}>
          <Plus className="h-3.5 w-3.5 mr-1" />添加
        </Button>
      </div>
      {tree?.map(renderNode)}
    </div>
  );
}
```

- [ ] **Step 2: 实现 LocationsPage**

```tsx
// src/pages/LocationsPage.tsx
import { LocationTree } from '../components/locations/LocationTree';

export function LocationsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">位置管理</h1>
      <LocationTree />
    </div>
  );
}
```

- [ ] **Step 3: 验证**

```bash
npm run dev
```

访问 /locations：可添加根级位置、展开/折叠、内嵌编辑、添加子位置（如主卧 → 衣柜 → 抽屉）、删除。

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add location management page with tree editor"
```

### Task 22: 设置页（分类 + 字段 + 渠道管理）

**Files:**
- Modify: `src/pages/SettingsPage.tsx`
- Create: `src/components/settings/CategoryManager.tsx`, `src/components/settings/ChannelManager.tsx`, `src/components/settings/FieldManager.tsx`

- [ ] **Step 1: 创建设置页骨架**

```tsx
// src/pages/SettingsPage.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { CategoryManager } from '../components/settings/CategoryManager';
import { ChannelManager } from '../components/settings/ChannelManager';
import { FieldManager } from '../components/settings/FieldManager';

export function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">设置</h1>
      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">分类</TabsTrigger>
          <TabsTrigger value="fields">字段配置</TabsTrigger>
          <TabsTrigger value="channels">渠道</TabsTrigger>
        </TabsList>
        <TabsContent value="categories" className="py-4">
          <CategoryManager />
        </TabsContent>
        <TabsContent value="fields" className="py-4">
          <FieldManager />
        </TabsContent>
        <TabsContent value="channels" className="py-4">
          <ChannelManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

确保 `npx shadcn@latest add tabs` 已安装。

- [ ] **Step 2: CategoryManager**

```tsx
// src/components/settings/CategoryManager.tsx
import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useCategories } from '../../hooks/useCategories';
import { createCategory, updateCategory, deleteCategory } from '../../services/categoryService';

export function CategoryManager() {
  const categories = useCategories();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await createCategory({ name: newName.trim(), sort_order: (categories?.length ?? 0) + 1 });
    setNewName('');
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    await updateCategory(id, { name: editName.trim() });
    setEditingId(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定删除分类"${name}"？`)) return;
    await deleteCategory(id);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input value={newName} onChange={e => setNewName(e.target.value)}
          placeholder="新分类名称" className="flex-1"
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <Button onClick={handleAdd} size="sm"><Plus className="h-4 w-4 mr-1" />添加</Button>
      </div>
      <div className="space-y-1">
        {categories?.map(cat => (
          <div key={cat.id} className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-muted group">
            <span>{cat.icon}</span>
            {editingId === cat.id ? (
              <>
                <Input value={editName} onChange={e => setEditName(e.target.value)}
                  className="h-7 text-sm flex-1" autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleUpdate(cat.id)}
                />
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleUpdate(cat.id)}>保存</Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingId(null)}>取消</Button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm">{cat.name}</span>
                <div className="hidden group-hover:flex gap-0.5">
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
                    onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}><Pencil className="h-3 w-3" /></Button>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive"
                    onClick={() => handleDelete(cat.id, cat.name)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: ChannelManager**

```tsx
// src/components/settings/ChannelManager.tsx
import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useChannels } from '../../hooks/useChannels';
import { createChannel, updateChannel, deleteChannel } from '../../services/channelService';

export function ChannelManager() {
  const channels = useChannels();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await createChannel({ name: newName.trim() });
    setNewName('');
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    await updateChannel(id, { name: editName.trim() });
    setEditingId(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定删除渠道"${name}"？`)) return;
    await deleteChannel(id);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input value={newName} onChange={e => setNewName(e.target.value)}
          placeholder="新渠道名称" className="flex-1"
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <Button onClick={handleAdd} size="sm"><Plus className="h-4 w-4 mr-1" />添加</Button>
      </div>
      <div className="space-y-1">
        {channels?.map(ch => (
          <div key={ch.id} className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-muted group">
            {editingId === ch.id ? (
              <>
                <Input value={editName} onChange={e => setEditName(e.target.value)}
                  className="h-7 text-sm flex-1" autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleUpdate(ch.id)}
                />
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleUpdate(ch.id)}>保存</Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingId(null)}>取消</Button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm">{ch.name}</span>
                <span className="text-xs text-muted-foreground mr-2">使用 {ch.usage_count} 次</span>
                <div className="hidden group-hover:flex gap-0.5">
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
                    onClick={() => { setEditingId(ch.id); setEditName(ch.name); }}><Pencil className="h-3 w-3" /></Button>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive"
                    onClick={() => handleDelete(ch.id, ch.name)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: FieldManager**

```tsx
// src/components/settings/FieldManager.tsx
import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useCategories } from '../../hooks/useCategories';
import { useFieldsForCategory } from '../../hooks/useFields';
import { createField, updateField, deleteField } from '../../services/fieldService';
import type { DataType } from '../../types';

const DATA_TYPES: { value: DataType; label: string }[] = [
  { value: 'text', label: '文本' },
  { value: 'number', label: '数字' },
  { value: 'date', label: '日期' },
  { value: 'enum', label: '枚举(下拉)' },
  { value: 'boolean', label: '布尔(开关)' },
];

export function FieldManager() {
  const categories = useCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  const [adding, setAdding] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<DataType>('text');
  const [newOptions, setNewOptions] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [newRequired, setNewRequired] = useState(false);

  const fields = useFieldsForCategory(selectedCategoryId || undefined);

  const handleAdd = async () => {
    if (!newKey.trim() || !newLabel.trim() || !selectedCategoryId) return;
    await createField({
      category_id: selectedCategoryId,
      key: newKey.trim(),
      label: newLabel.trim(),
      data_type: newType,
      options: newType === 'enum' ? newOptions.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      unit: newUnit.trim() || undefined,
      required: newRequired,
      sort_order: (fields?.length ?? 0) + 1,
    });
    setAdding(false);
    setNewKey(''); setNewLabel(''); setNewType('text'); setNewOptions(''); setNewUnit('');
  };

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`确定删除字段"${label}"？这将同时删除所有物品的该字段值。`)) return;
    await deleteField(id);
  };

  return (
    <div className="space-y-4">
      <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
        <SelectTrigger><SelectValue placeholder="选择分类查看/添加字段" /></SelectTrigger>
        <SelectContent>
          {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {selectedCategoryId && (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">当前分类字段 ({fields?.length ?? 0})</h3>
            <Button size="sm" variant="outline" onClick={() => setAdding(!adding)}>
              <Plus className="h-3.5 w-3.5 mr-1" />添加字段
            </Button>
          </div>

          {adding && (
            <div className="border rounded-lg p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="字段Key (英文)" className="h-8 text-sm" />
                <Input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="显示名称" className="h-8 text-sm" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Select value={newType} onValueChange={(v) => setNewType(v as DataType)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DATA_TYPES.map(dt => <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                {newType === 'enum' && (
                  <Input value={newOptions} onChange={e => setNewOptions(e.target.value)} placeholder="选项,逗号分隔" className="h-8 text-sm" />
                )}
                {newType === 'number' && (
                  <Input value={newUnit} onChange={e => setNewUnit(e.target.value)} placeholder="单位 (W/天/月)" className="h-8 text-sm" />
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAdd}>确定</Button>
                <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>取消</Button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {fields?.map(field => (
              <div key={field.id} className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-muted group">
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{field.data_type}</span>
                <span className="flex-1 text-sm">{field.label}</span>
                <span className="text-xs text-muted-foreground">{field.key}</span>
                {field.required && <span className="text-xs text-destructive">必填</span>}
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hidden group-hover:flex text-destructive"
                  onClick={() => handleDelete(field.id, field.label)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 验证**

```bash
npm run dev
```

访问 /settings：
- 分类 Tab：列表展示、可添加/编辑/删除
- 字段 Tab：先选分类 → 查看已有字段 → 可添加新字段（自动出现在该分类的录入表单中）
- 渠道 Tab：列表展示 + 使用次数 + CRUD

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add settings page with category, field, channel management"
```

---

## Phase 8: PWA 配置

### Task 23: PWA manifest + service worker

**Files:**
- Modify: `vite.config.ts`, `index.html`
- Create: `public/icon-192.png`, `public/icon-512.png`（占位）

- [ ] **Step 1: 安装 vite-plugin-pwa**

```bash
npm install -D vite-plugin-pwa
```

- [ ] **Step 2: 配置 PWA**

修改 `vite.config.ts`：

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Metidy — 物品管理系统',
        short_name: 'Metidy',
        description: '物品管理系统',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
  },
});
```

- [ ] **Step 3: 生成占位图标**

```bash
# 用 sips (macOS 内置) 生成纯色占位图标
sips -z 192 192 -c "#3b82f6" /System/Library/CoreServices/Cursor/EmptyCursor.pdf --out public/icon-192.png 2>/dev/null || \
  convert -size 192x192 xc:#3b82f6 public/icon-192.png 2>/dev/null || \
  echo "手动放置 public/icon-192.png 和 public/icon-512.png"
```

如果 macOS sips 不支持纯色，可以用以下方式：

```bash
python3 -c "
from PIL import Image
img = Image.new('RGB', (192, 192), '#3b82f6')
img.save('public/icon-192.png')
img512 = Image.new('RGB', (512, 512), '#3b82f6')
img512.save('public/icon-512.png')
" 2>/dev/null || echo "需要 Pillow: pip3 install Pillow"
```

最简方案：手动创建两个 PNG 或暂时跳过图标（不影响 PWA 功能）。

- [ ] **Step 4: 添加 service worker 注册**

修改 `src/main.tsx`：

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { seedDatabase } from './db/seed';
import './index.css';

// 注册 PWA service worker
function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // sw.js 由 vite-plugin-pwa 自动生成，开发环境可能不存在
      });
    });
  }
}

async function init() {
  await seedDatabase();
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  registerSW();
}

init();
```

- [ ] **Step 5: 验证**

```bash
npm run build
npm run preview
```

- 浏览器应显示 PWA 安装提示
- DevTools → Application → Service Workers 确认已注册
- Manifest 可见

- [ ] **Step 6: 最终 Commit**

```bash
git add -A && git commit -m "feat: add PWA manifest and service worker"
```

---

## 测试验证总览

完成所有 Task 后运行全部测试：

```bash
npx vitest run
```

确保 Service 层所有测试（categoryService, channelService, fieldService, locationService, itemService）全部通过。

手动功能验收：

| 验收项 | 验证方式 |
|---|---|
| 首页仪表盘 | 打开 / 看到统计卡片 + 最近添加 |
| 新增物品 | /items/add → 选分类 → 动态字段展开 → 保存 → 列表可见 |
| 列表筛选 | /items → 搜索、选分类、选状态 → 列表过滤 |
| 物品详情 | 点击列表卡片 → 详情页全字段 + EAV 值显示 |
| 物品编辑 | 详情页点编辑 → 表单预填充 → 修改保存 |
| 物品删除 | 详情页点删除 → 返回列表 |
| 位置管理 | /locations → 添加/嵌套/编辑/删除位置 |
| 设置页 | /settings → 三个 Tab 各自 CRUD |
| PWA | 构建后移动端可安装、离线可用 |
| 响应式 | 缩小窗口 → 侧边栏变底部 Tab |
| EAV 动态性 | 给分类加字段 → 该分类的录入表单立刻多出此项 |

---

## 服务停止

完成开发后，停止视觉伴侣服务器：

```bash
/Users/dowding/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.7/skills/brainstorming/scripts/stop-server.sh /Users/dowding/Workspace/metidy/.superpowers/brainstorm/2442-1780213065/state
```