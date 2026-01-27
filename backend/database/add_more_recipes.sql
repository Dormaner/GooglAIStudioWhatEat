-- 添加更多菜谱数据以填充 9 宫格
-- 在 Supabase SQL Editor 中运行此脚本

-- 插入 5 个新菜谱
INSERT INTO recipes (name, image, insight) VALUES
('薄脆意式披萨', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=400', ''),
('香烤辣子鸡丁', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=400', ''),
('包菜厚蛋烧', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=400', ''),
('黄金法式吐司', 'https://images.unsplash.com/photo-1484723088339-fe2a7a8f1d82?auto=format&fit=crop&q=80&w=400', ''),
('凉拌洋葱丝', 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&q=80&w=400', '');

-- 为新菜谱添加默认步骤
DO $$
DECLARE
    recipe_record RECORD;
BEGIN
    FOR recipe_record IN 
        SELECT id FROM recipes WHERE name IN ('薄脆意式披萨', '香烤辣子鸡丁', '包菜厚蛋烧', '黄金法式吐司', '凉拌洋葱丝')
    LOOP
        INSERT INTO recipe_steps (recipe_id, step_order, title, description, image) VALUES
        (recipe_record.id, 1, '准备食材', '将所有主料洗净切好,调料按比例准备妥当。建议在切配前先清点一遍,确保没有遗漏关键调料。', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=800'),
        (recipe_record.id, 2, '开火热锅', '锅中倒入适量底油,大火加热至微微冒烟。此时下入姜片和葱段煸炒出香味,这是菜品底味的关键。', 'https://images.unsplash.com/photo-1556910116-e220f712735d?auto=format&fit=crop&q=80&w=800'),
        (recipe_record.id, 3, '翻炒收汁', '加入食材快速翻炒均匀。最后根据口味加入适量食盐和糖,焖煮至汤汁浓稠,完美裹在食材表面。', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=800');
    END LOOP;
END $$;

-- 验证总数
SELECT '菜谱总数:', COUNT(*) FROM recipes;
