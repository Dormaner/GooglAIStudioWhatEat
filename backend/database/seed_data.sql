-- WhatEat Sample Data for Supabase
-- 在 Supabase SQL Editor 中运行此脚本来导入示例数据

-- 1. 插入食材数据
INSERT INTO ingredients (name, category, icon) VALUES
-- 蔬菜类
('土豆', 'vegetable', '🥔'),
('胡萝卜', 'vegetable', '🥕'),
('花菜', 'vegetable', '🥦'),
('白萝卜', 'vegetable', '🥣'),
('西葫芦', 'vegetable', '🥒'),
('番茄', 'vegetable', '🍅'),
('芹菜', 'vegetable', '🌿'),
('黄瓜', 'vegetable', '🥒'),
('洋葱', 'vegetable', '🧅'),
('莴笋', 'vegetable', '🎋'),
('菌菇', 'vegetable', '🍄'),
('茄子', 'vegetable', '🍆'),
('豆腐', 'vegetable', '🍲'),
('包菜', 'vegetable', '🥦'),
('白菜', 'vegetable', '🥬'),
-- 肉类
('午餐肉', 'meat', '🥓'),
('香肠', 'meat', '🌭'),
('腊肠', 'meat', '🌭'),
('鸡肉', 'meat', '🐥'),
('猪肉', 'meat', '🐷'),
('鸡蛋', 'meat', '🥚'),
('虾', 'meat', '🦐'),
('牛肉', 'meat', '🐂'),
('骨头', 'meat', '🦴'),
('鱼', 'meat', '🐟'),
-- 主食类
('面食', 'staple', '🍜'),
('面包', 'staple', '🍞'),
('米', 'staple', '🍚'),
-- 调料类
('精品五花肉', 'condiment', '🥓'),
('大葱', 'condiment', '🧅'),
('生姜', 'condiment', '🌿'),
('冰糖', 'condiment', '🧂'),
('生抽', 'condiment', '🧂'),
('大土豆', 'vegetable', '🥔'),
('培根', 'meat', '🥓')
ON CONFLICT (name) DO NOTHING;

-- 2. 插入菜谱数据
INSERT INTO recipes (name, image, insight) VALUES
('家常红烧肉', 'https://images.unsplash.com/photo-1527324688151-0e627063f2b1?auto=format&fit=crop&q=80&w=400', '上次尝试加了两颗山楂,肉烂得更快而且解腻效果很好。下次可以试着减少5g冰糖。'),
('缤纷果仁沙拉', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400', ''),
('低脂鸡肉暖碗', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400', ''),
('灵魂土豆丸子', 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&q=80&w=400', '土豆泥一定要压得细腻,加入适量淀粉可以增加Q弹口感。');

-- 3. 为"家常红烧肉"添加食材关联
DO $$
DECLARE
    recipe_id_var UUID;
    ing_id UUID;
BEGIN
    -- 获取菜谱ID
    SELECT id INTO recipe_id_var FROM recipes WHERE name = '家常红烧肉' LIMIT 1;
    
    -- 添加主料
    SELECT id INTO ing_id FROM ingredients WHERE name = '精品五花肉' LIMIT 1;
    INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, type) 
    VALUES (recipe_id_var, ing_id, '500g', 'main');
    
    SELECT id INTO ing_id FROM ingredients WHERE name = '大葱' LIMIT 1;
    INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, type) 
    VALUES (recipe_id_var, ing_id, '适量', 'main');
    
    SELECT id INTO ing_id FROM ingredients WHERE name = '生姜' LIMIT 1;
    INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, type) 
    VALUES (recipe_id_var, ing_id, '适量', 'main');
    
    -- 添加调料
    SELECT id INTO ing_id FROM ingredients WHERE name = '冰糖' LIMIT 1;
    INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, type) 
    VALUES (recipe_id_var, ing_id, '30g', 'condiment');
    
    SELECT id INTO ing_id FROM ingredients WHERE name = '生抽' LIMIT 1;
    INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, type) 
    VALUES (recipe_id_var, ing_id, '2勺', 'condiment');
END $$;

-- 4. 为"灵魂土豆丸子"添加食材关联
DO $$
DECLARE
    recipe_id_var UUID;
    ing_id UUID;
BEGIN
    SELECT id INTO recipe_id_var FROM recipes WHERE name = '灵魂土豆丸子' LIMIT 1;
    
    SELECT id INTO ing_id FROM ingredients WHERE name = '大土豆' LIMIT 1;
    INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, type) 
    VALUES (recipe_id_var, ing_id, '2个', 'main');
    
    SELECT id INTO ing_id FROM ingredients WHERE name = '培根' LIMIT 1;
    INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, type) 
    VALUES (recipe_id_var, ing_id, '3片', 'main');
END $$;

-- 5. 为"家常红烧肉"添加烹饪步骤
DO $$
DECLARE
    recipe_id_var UUID;
BEGIN
    SELECT id INTO recipe_id_var FROM recipes WHERE name = '家常红烧肉' LIMIT 1;
    
    INSERT INTO recipe_steps (recipe_id, step_order, title, description, image) VALUES
    (recipe_id_var, 1, '食材准备', '五花肉切成2.5cm见方的块,生姜切片。肉块大小要均匀,这样受热才一致。', 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&q=80&w=800'),
    (recipe_id_var, 2, '焯水：冷水下锅', '放入姜片、料酒,开大火煮沸,撇去表面浮沫后捞出洗净。一定要冷水下锅,才能把血水煮出来。', 'https://images.unsplash.com/photo-1590671886400-8f8088b97cb0?auto=format&fit=crop&q=80&w=800'),
    (recipe_id_var, 3, '炒糖色', '锅内放少量油,下冰糖小火炒至枣红色,下肉块翻炒均匀上色。注意火候,糖色过头会发苦。', 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&q=80&w=800'),
    (recipe_id_var, 4, '小火焖煮', '加入热水没过肉块,大火烧开转小火焖煮40-60分钟。期间不要频繁开盖,保持锅内蒸汽。', 'https://images.unsplash.com/photo-1590671886400-8f8088b97cb0?auto=format&fit=crop&q=80&w=800');
END $$;

-- 6. 为其他菜谱添加默认步骤
DO $$
DECLARE
    recipe_record RECORD;
BEGIN
    FOR recipe_record IN 
        SELECT id FROM recipes WHERE name IN ('缤纷果仁沙拉', '低脂鸡肉暖碗', '灵魂土豆丸子')
    LOOP
        INSERT INTO recipe_steps (recipe_id, step_order, title, description, image) VALUES
        (recipe_record.id, 1, '准备食材', '将所有主料洗净切好,调料按比例准备妥当。建议在切配前先清点一遍,确保没有遗漏关键调料。', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=800'),
        (recipe_record.id, 2, '开火热锅', '锅中倒入适量底油,大火加热至微微冒烟。此时下入姜片和葱段煸炒出香味,这是菜品底味的关键。', 'https://images.unsplash.com/photo-1556910116-e220f712735d?auto=format&fit=crop&q=80&w=800'),
        (recipe_record.id, 3, '翻炒收汁', '加入食材快速翻炒均匀。最后根据口味加入适量食盐和糖,焖煮至汤汁浓稠,完美裹在食材表面。', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=800');
    END LOOP;
END $$;

-- 验证数据
SELECT '食材总数:', COUNT(*) FROM ingredients;
SELECT '菜谱总数:', COUNT(*) FROM recipes;
SELECT '菜谱步骤总数:', COUNT(*) FROM recipe_steps;
SELECT '菜谱食材关联总数:', COUNT(*) FROM recipe_ingredients;
