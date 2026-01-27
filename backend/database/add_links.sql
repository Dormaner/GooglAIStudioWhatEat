-- Add link column to recipes table
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS link TEXT;

-- Update existing recipes with Bilibili links (Sample links)
UPDATE recipes SET link = 'https://www.bilibili.com/video/BV1Ux411T744' WHERE name = '家常红烧肉';
UPDATE recipes SET link = 'https://www.bilibili.com/video/BV1rx411T744' WHERE name = '缤纷果仁沙拉';
UPDATE recipes SET link = 'https://www.bilibili.com/video/BV15x411T744' WHERE name = '低脂鸡肉暖碗';
UPDATE recipes SET link = 'https://www.bilibili.com/video/BV1Yx411T744' WHERE name = '灵魂土豆丸子';
UPDATE recipes SET link = 'https://www.bilibili.com/video/BV1Gx411T744' WHERE name = '薄脆意式披萨';
UPDATE recipes SET link = 'https://www.bilibili.com/video/BV1qx411T744' WHERE name = '香烤辣子鸡丁';
UPDATE recipes SET link = 'https://www.bilibili.com/video/BV1Xx411T744' WHERE name = '包菜厚蛋烧';
UPDATE recipes SET link = 'https://www.bilibili.com/video/BV1kx411T744' WHERE name = '黄金法式吐司';
UPDATE recipes SET link = 'https://www.bilibili.com/video/BV1Ax411T744' WHERE name = '凉拌洋葱丝';
