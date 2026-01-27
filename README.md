# WhatEat - 智能菜谱助手

一个集成前后端的智能菜谱管理应用，帮助用户根据现有食材智能推荐菜谱。

## 🏗️ 技术栈

### 前端
- **React 19** + **TypeScript**
- **Vite** - 快速构建工具
- **Tailwind CSS** - 样式框架
- **Lucide React** - 图标库
- **Axios** - HTTP 客户端
- **Supabase Client** - 数据库客户端

### 后端
- **Node.js** + **Express** + **TypeScript**
- **Supabase** (PostgreSQL) - 数据库
- **CORS** - 跨域支持

## 📁 项目结构

```
WhatEat/
├── backend/                 # 后端 API 服务
│   ├── src/
│   │   ├── config/         # 配置文件
│   │   │   └── supabase.ts # Supabase 客户端
│   │   ├── routes/         # API 路由
│   │   │   ├── recipes.ts  # 菜谱 CRUD
│   │   │   ├── ingredients.ts # 食材管理
│   │   │   └── search.ts   # 搜索功能
│   │   ├── types/          # TypeScript 类型
│   │   ├── utils/          # 工具函数
│   │   │   └── seed.ts     # 数据库种子数据
│   │   └── server.ts       # Express 服务器入口
│   ├── database/
│   │   └── schema.sql      # 数据库表结构
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example        # 环境变量模板
│
├── pages/                  # 前端页面组件
│   ├── WhatToEat.tsx       # 今天吃什么
│   ├── WhatIsAvailable.tsx # 有什么食材
│   ├── RecipeDetail.tsx    # 菜谱详情
│   └── CookingMode.tsx     # 烹饪模式
├── services/               # API 服务层
│   └── api.ts              # API 请求封装
├── config/                 # 前端配置
│   └── supabase.ts         # Supabase 客户端
├── components/             # 公共组件
├── types.ts                # TypeScript 类型定义
├── App.tsx                 # 主应用组件
└── package.json
```

## 🚀 快速开始

### 1. 配置 Supabase

1. 访问 [Supabase](https://supabase.com/) 创建新项目
2. 在 Supabase Dashboard 中执行 `backend/database/schema.sql` 创建数据库表
3. 获取项目的 URL 和 Anon Key

### 2. 配置环境变量

#### 后端环境变量
```bash
cd backend
cp .env.example .env
```

编辑 `.env` 文件：
```env
SUPABASE_URL=你的_supabase_项目_url
SUPABASE_ANON_KEY=你的_supabase_anon_key
PORT=3001
NODE_ENV=development
```

#### 前端环境变量
```bash
cd ..
cp .env.example .env.local
```

编辑 `.env.local` 文件：
```env
VITE_SUPABASE_URL=你的_supabase_项目_url
VITE_SUPABASE_ANON_KEY=你的_supabase_anon_key
VITE_API_URL=http://localhost:3001
```

### 3. 安装依赖

#### 后端
```bash
cd backend
npm install
```

#### 前端
```bash
cd ..
npm install
```

### 4. 初始化数据库

运行种子脚本导入示例数据：
```bash
cd backend
npm run seed
```

### 5. 启动应用

#### 启动后端服务器（终端 1）
```bash
cd backend
npm run dev
```
后端将运行在 `http://localhost:3001`

#### 启动前端开发服务器（终端 2）
```bash
npm run dev
```
前端将运行在 `http://localhost:5173`

## 📡 API 端点

### 菜谱 API
- `GET /api/recipes` - 获取所有菜谱
- `GET /api/recipes/:id` - 获取单个菜谱
- `POST /api/recipes` - 创建新菜谱
- `PUT /api/recipes/:id` - 更新菜谱
- `DELETE /api/recipes/:id` - 删除菜谱

### 食材 API
- `GET /api/ingredients` - 获取食材库（按类别分组）
- `GET /api/ingredients/user-ingredients` - 获取用户库存
- `POST /api/ingredients/user-ingredients` - 添加库存食材
- `DELETE /api/ingredients/user-ingredients/:name` - 删除库存食材

### 搜索 API
- `POST /api/search/by-ingredients` - 根据食材搜索菜谱
  - Body: `{ ingredients: string[], strict: boolean }`
  - `strict=false`: 模糊匹配（至少一种食材匹配）
  - `strict=true`: 严格匹配（所有食材都有）
- `GET /api/search/recipes?q=关键词` - 关键词搜索菜谱

## 🗄️ 数据库结构

### 核心表
- **users** - 用户信息
- **recipes** - 菜谱主表
- **ingredients** - 食材库
- **recipe_ingredients** - 菜谱-食材关联
- **recipe_steps** - 菜谱步骤
- **user_ingredients** - 用户库存食材
- **user_favorites** - 用户收藏

## ✨ 主要功能

1. **菜谱浏览** - 浏览所有可用菜谱
2. **智能搜索** - 根据现有食材智能推荐菜谱
   - 模糊匹配：推荐部分食材匹配的菜谱
   - 严格匹配：只显示食材完全满足的菜谱
3. **菜谱详情** - 查看详细的烹饪步骤和食材清单
4. **烹饪模式** - 沉浸式分步指导
5. **视频/图文切换** - 支持视频和图文两种教程模式

## 🔧 开发脚本

### 后端
```bash
npm run dev      # 开发模式（热重载）
npm run build    # 构建生产版本
npm start        # 运行生产版本
npm run seed     # 初始化数据库数据
```

### 前端
```bash
npm run dev      # 开发模式
npm run build    # 构建生产版本
npm run preview  # 预览生产版本
```

## 📝 注意事项

1. 确保 Supabase 项目已正确配置并运行 schema.sql
2. 后端和前端需要同时运行才能正常使用
3. 首次使用请先运行 `npm run seed` 初始化数据
4. 所有 API 请求默认使用 `http://localhost:3001`

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
