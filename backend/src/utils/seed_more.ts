import { supabase } from '../config/supabase.js';

const EXTRA_RECIPES = [
    {
        name: '薄脆意式披萨',
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=400',
        insight: '',
        steps: [
            { title: '准备面团', description: '将面粉、水、酵母混合揉成光滑面团，发酵至两倍大。', image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=800' },
            { title: '铺料烘烤', description: '涂抹番茄酱，撒上奶酪和喜欢的配料，放入预热好的烤箱烘烤。', image: 'https://images.unsplash.com/photo-1556910116-e220f712735d?auto=format&fit=crop&q=80&w=800' }
        ]
    },
    {
        name: '香烤辣子鸡丁',
        image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=400',
        insight: '',
        steps: [
            { title: '腌制鸡肉', description: '鸡腿肉切丁，加入料酒、生抽、胡椒粉腌制20分钟。', image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=800' },
            { title: '爆炒', description: '锅中多放油，下干辣椒花椒爆香，倒入鸡丁大火快炒。', image: 'https://images.unsplash.com/photo-1556910116-e220f712735d?auto=format&fit=crop&q=80&w=800' }
        ]
    },
    {
        name: '包菜厚蛋烧',
        image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=400',
        insight: '',
        steps: [
            { title: '准备蛋液', description: '鸡蛋打散，加入切碎的包菜丁和胡萝卜丁，加盐调味。', image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=800' },
            { title: '卷蛋烧', description: '平底锅刷油，分次倒入蛋液，从一端卷向另一端。', image: 'https://images.unsplash.com/photo-1556910116-e220f712735d?auto=format&fit=crop&q=80&w=800' }
        ]
    },
    {
        name: '黄金法式吐司',
        image: 'https://images.unsplash.com/photo-1484723088339-fe2a7a8f1d82?auto=format&fit=crop&q=80&w=400',
        insight: '',
        steps: [
            { title: '浸泡吐司', description: '吐司切块，裹满鸡蛋牛奶液。', image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=800' },
            { title: '煎制', description: '黄油融化，放入吐司煎至两面金黄。', image: 'https://images.unsplash.com/photo-1556910116-e220f712735d?auto=format&fit=crop&q=80&w=800' }
        ]
    },
    {
        name: '凉拌洋葱丝',
        image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&q=80&w=400',
        insight: '',
        steps: [
            { title: '处理洋葱', description: '洋葱切丝，放入冰水中浸泡10分钟去除辛辣味。', image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=800' },
            { title: '调味', description: '沥干水分，加入生抽、醋、香油拌匀。', image: 'https://images.unsplash.com/photo-1556910116-e220f712735d?auto=format&fit=crop&q=80&w=800' }
        ]
    }
];

async function seedMore() {
    console.log('🌱 Adding extra recipes for grid layout...');

    for (const recipeData of EXTRA_RECIPES) {
        // Check if exists
        const { data: existing } = await supabase
            .from('recipes')
            .select('id')
            .eq('name', recipeData.name)
            .single();

        if (existing) {
            console.log(`  - Recipe ${recipeData.name} already exists, skipping.`);
            continue;
        }

        // Insert recipe
        const { data: recipe, error: recipeError } = await supabase
            .from('recipes')
            .insert({
                name: recipeData.name,
                image: recipeData.image,
                insight: recipeData.insight
            })
            .select()
            .single();

        if (recipeError) {
            console.error(`  x Error creating ${recipeData.name}:`, recipeError.message);
            continue;
        }
        console.log(`  ✓ Created recipe: ${recipe.name}`);

        // Insert steps
        const stepsData = recipeData.steps.map((step, index) => ({
            recipe_id: recipe.id,
            step_order: index + 1,
            title: step.title,
            description: step.description,
            image: step.image
        }));

        const { error: stepsError } = await supabase.from('recipe_steps').insert(stepsData);
        if (stepsError) {
            console.error(`  x Error creating steps for ${recipeData.name}:`, stepsError.message);
        }
    }

    console.log('\n✅ Extra recipes added successfully!');
}

seedMore();
