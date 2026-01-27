# 数据库初始化指南

## 步骤 1: 在 Supabase 中创建数据库表

1. 访问 Supabase Dashboard: https://supabase.com/dashboard
2. 选择你的项目
3. 点击左侧菜单的 **SQL Editor**
4. 点击 **New Query**
5. 复制 `backend/database/schema.sql` 文件的全部内容
6. 粘贴到 SQL 编辑器中
7. 点击 **Run** 按钮执行

## 步骤 2: 验证表是否创建成功

在 SQL Editor 中运行以下查询：

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

你应该看到以下表：
- users
- recipes
- ingredients
- recipe_ingredients
- recipe_steps
- user_ingredients
- user_favorites

## 步骤 3: 运行种子数据脚本

在项目根目录的 backend 文件夹中运行：

```bash
cd backend
npm run seed
```

这将导入示例菜谱和食材数据。

## 步骤 4: 验证数据

在 Supabase Dashboard 中：
1. 点击左侧菜单的 **Table Editor**
2. 查看 `recipes` 表，应该有 4 条记录
3. 查看 `ingredients` 表，应该有约 30 条记录

## 完成！

现在你可以启动应用了：

### 启动后端（终端 1）
```bash
cd backend
npm run dev
```

### 启动前端（终端 2）
```bash
npm run dev
```

访问 http://localhost:5173 查看应用！
