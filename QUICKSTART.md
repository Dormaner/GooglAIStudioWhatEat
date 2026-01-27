# WhatEat 快速启动指南

## ⚡ 快速开始（5 分钟）

### 第一步：配置 Supabase

1. 访问 https://supabase.com/ 并登录
2. 点击 "New Project" 创建新项目
3. 等待项目初始化完成
4. 进入项目后，点击左侧菜单的 "SQL Editor"
5. 点击 "New Query"
6. 复制并粘贴 `backend/database/schema.sql` 的内容
7. 点击 "Run" 执行 SQL
8. 在项目设置中获取：
   - Project URL
   - Anon/Public Key

### 第二步：配置环境变量

**后端配置** (`backend/.env`)
```env
SUPABASE_URL=你的项目URL
SUPABASE_ANON_KEY=你的Anon密钥
PORT=3001
```

**前端配置** (`.env.local`)
```env
VITE_SUPABASE_URL=你的项目URL
VITE_SUPABASE_ANON_KEY=你的Anon密钥
VITE_API_URL=http://localhost:3001
```

### 第三步：安装依赖

打开两个终端窗口：

**终端 1 - 前端**
```bash
npm install
```

**终端 2 - 后端**
```bash
cd backend
npm install
```

### 第四步：初始化数据

在后端终端中运行：
```bash
npm run seed
```

你应该看到类似输出：
```
🌱 Starting database seeding...
📦 Seeding ingredients...
✅ Inserted 28 ingredients
🍳 Seeding recipes...
  ✓ Created recipe: 家常红烧肉
  ✓ Created recipe: 缤纷果仁沙拉
  ✓ Created recipe: 低脂鸡肉暖碗
  ✓ Created recipe: 灵魂土豆丸子
✅ Successfully seeded 4 recipes!
🎉 Database seeding completed successfully!
```

### 第五步：启动应用

**终端 1 - 后端**
```bash
cd backend
npm run dev
```

看到：`🚀 WhatEat API server is running on http://localhost:3001`

**终端 2 - 前端**
```bash
npm run dev
```

看到：`Local: http://localhost:5173/`

### 第六步：打开浏览器

访问 http://localhost:5173

---

## 🎯 功能测试清单

- [ ] 查看菜谱列表
- [ ] 点击"换一组"切换菜谱
- [ ] 切换到"有什么食材"标签
- [ ] 选择多个食材
- [ ] 点击"模糊匹配"搜索菜谱
- [ ] 点击"严格匹配"搜索菜谱
- [ ] 点击菜谱查看详情
- [ ] 切换视频/图文模式
- [ ] 点击"进入烹饪模式"
- [ ] 在烹饪模式中浏览步骤

---

## 🐛 常见问题

### 问题：前端无法连接后端
**解决**：确保后端已启动并运行在 `http://localhost:3001`

### 问题：数据库连接失败
**解决**：检查 `.env` 文件中的 Supabase 配置是否正确

### 问题：种子数据导入失败
**解决**：确保已在 Supabase 中执行了 `schema.sql`

### 问题：Tailwind 样式不生效
**解决**：运行 `npm install` 确保所有依赖已安装

---

## 📚 API 端点测试

使用 curl 或 Postman 测试：

```bash
# 健康检查
curl http://localhost:3001/health

# 获取所有菜谱
curl http://localhost:3001/api/recipes

# 获取食材库
curl http://localhost:3001/api/ingredients

# 搜索菜谱
curl -X POST http://localhost:3001/api/search/by-ingredients \
  -H "Content-Type: application/json" \
  -d '{"ingredients":["土豆","鸡蛋"],"strict":false}'
```

---

## 🎨 技术栈

- **前端**: React 19 + TypeScript + Vite + Tailwind CSS
- **后端**: Node.js + Express + TypeScript  
- **数据库**: Supabase (PostgreSQL)
- **UI**: Lucide React Icons

---

## 📝 下一步

1. 尝试添加新菜谱
2. 自定义食材库
3. 探索烹饪模式的沉浸式体验
4. 查看代码了解实现细节
