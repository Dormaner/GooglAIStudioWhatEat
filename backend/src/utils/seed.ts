import { supabase } from '../config/supabase.js';

// Mock data from frontend constants
const INGREDIENTS_DATA = {
    vegetables: [
        { name: '土豆', icon: '🥔' }, { name: '胡萝卜', icon: '🥕' }, { name: '花菜', icon: '🥦' }, { name: '白萝卜', icon: '🥣' },
        { name: '西葫芦', icon: '🥒' }, { name: '番茄', icon: '🍅' }, { name: '芹菜', icon: '🌿' }, { name: '黄瓜', icon: '🥒' },
        { name: '洋葱', icon: '🧅' }, { name: '莴笋', icon: '🎋' }, { name: '菌菇', icon: '🍄' }, { name: '茄子', icon: '🍆' },
        { name: '豆腐', icon: '🍲' }, { name: '包菜', icon: '🥦' }, { name: '白菜', icon: '🥬' }
    ],
    meats: [
        { name: '午餐肉', icon: '🥓' }, { name: '香肠', icon: '🌭' }, { name: '腊肠', icon: '🌭' }, { name: '鸡肉', icon: '🐥' },
        { name: '猪肉', icon: '🐷' }, { name: '鸡蛋', icon: '🥚' }, { name: '虾', icon: '🦐' }, { name: '牛肉', icon: '🐂' },
        { name: '骨头', icon: '🦴' }, { name: '鱼', icon: '🐟' }
    ],
    staples: [
        { name: '面食', icon: '🍜' }, { name: '面包', icon: '🍞' }, { name: '米', icon: '🍚' }
    ]
};

const DEFAULT_STEPS = [
    {
        title: '准备食材',
        description: '将所有主料洗净切好,调料按比例准备妥当。建议在切配前先清点一遍,确保没有遗漏关键调料。',
        image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: '开火热锅',
        description: '锅中倒入适量底油,大火加热至微微冒烟。此时下入姜片和葱段煸炒出香味,这是菜品底味的关键。',
        image: 'https://images.unsplash.com/photo-1556910116-e220f712735d?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: '翻炒收汁',
        description: '加入食材快速翻炒均匀。最后根据口味加入适量食盐和糖,焖煮至汤汁浓稠,完美裹在食材表面。',
        image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=800'
    }
];

const RECIPES_DATA = [
    {
        name: '家常红烧肉',
        image: 'https://images.unsplash.com/photo-1527324688151-0e627063f2b1?auto=format&fit=crop&q=80&w=400',
        insight: '上次尝试加了两颗山楂,肉烂得更快而且解腻效果很好。下次可以试着减少5g冰糖。',
        ingredients: {
            main: [
                { name: '精品五花肉', amount: '500g' },
                { name: '大葱', amount: '适量' },
                { name: '生姜', amount: '适量' }
            ],
            condiments: [
                { name: '冰糖', amount: '30g' },
                { name: '生抽', amount: '2勺' }
            ]
        },
        steps: [
            {
                title: '食材准备',
                description: '五花肉切成2.5cm见方的块,生姜切片。肉块大小要均匀,这样受热才一致。',
                image: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&q=80&w=800'
            },
            {
                title: '焯水：冷水下锅',
                description: '放入姜片、料酒,开大火煮沸,撇去表面浮沫后捞出洗净。一定要冷水下锅,才能把血水煮出来。',
                image: 'https://images.unsplash.com/photo-1590671886400-8f8088b97cb0?auto=format&fit=crop&q=80&w=800'
            },
            {
                title: '炒糖色',
                description: '锅内放少量油,下冰糖小火炒至枣红色,下肉块翻炒均匀上色。注意火候,糖色过头会发苦。',
                image: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&q=80&w=800'
            },
            {
                title: '小火焖煮',
                description: '加入热水没过肉块,大火烧开转小火焖煮40-60分钟。期间不要频繁开盖,保持锅内蒸汽。',
                image: 'https://images.unsplash.com/photo-1590671886400-8f8088b97cb0?auto=format&fit=crop&q=80&w=800'
            }
        ]
    },
    {
        name: '缤纷果仁沙拉',
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400',
        insight: '',
        ingredients: { main: [{ name: '坚果', amount: '50g' }, { name: '牛油果', amount: '1个' }], condiments: [] },
        steps: DEFAULT_STEPS
    },
    {
        name: '低脂鸡肉暖碗',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400',
        insight: '',
        ingredients: { main: [{ name: '鸡胸肉', amount: '200g' }], condiments: [] },
        steps: DEFAULT_STEPS
    },
    {
        name: '灵魂土豆丸子',
        image: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&q=80&w=400',
        insight: '土豆泥一定要压得细腻,加入适量淀粉可以增加Q弹口感。',
        ingredients: {
            main: [
                { name: '大土豆', amount: '2个' },
                { name: '培根', amount: '3片' }
            ],
            condiments: []
        },
        steps: DEFAULT_STEPS
    }
];

async function seedDatabase() {
    console.log('🌱 Starting database seeding...\n');

    try {
        // 1. Seed ingredients
        console.log('📦 Seeding ingredients...');
        const ingredientsToInsert = [
            ...INGREDIENTS_DATA.vegetables.map(i => ({ ...i, category: 'vegetable' })),
            ...INGREDIENTS_DATA.meats.map(i => ({ ...i, category: 'meat' })),
            ...INGREDIENTS_DATA.staples.map(i => ({ ...i, category: 'staple' }))
        ];

        const { data: insertedIngredients, error: ingError } = await supabase
            .from('ingredients')
            .upsert(ingredientsToInsert, { onConflict: 'name', ignoreDuplicates: false })
            .select();

        if (ingError) throw ingError;
        console.log(`✅ Inserted ${insertedIngredients?.length} ingredients\n`);

        // Create ingredient name to ID map
        const ingredientMap = new Map(
            insertedIngredients?.map(ing => [ing.name, ing.id]) || []
        );

        // 2. Seed recipes
        console.log('🍳 Seeding recipes...');
        for (const recipeData of RECIPES_DATA) {
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

            if (recipeError) throw recipeError;
            console.log(`  ✓ Created recipe: ${recipe.name}`);

            // Insert recipe ingredients
            const allIngredients = [
                ...(recipeData.ingredients.main || []).map(ing => ({ ...ing, type: 'main' })),
                ...(recipeData.ingredients.condiments || []).map(ing => ({ ...ing, type: 'condiment' }))
            ];

            for (const ing of allIngredients) {
                let ingredientId = ingredientMap.get(ing.name);

                // If ingredient doesn't exist, create it
                if (!ingredientId) {
                    const { data: newIng } = await supabase
                        .from('ingredients')
                        .insert({ name: ing.name, category: 'condiment', icon: '🧂' })
                        .select()
                        .single();

                    if (newIng) {
                        ingredientId = newIng.id;
                        ingredientMap.set(ing.name, ingredientId);
                    }
                }

                if (ingredientId) {
                    await supabase.from('recipe_ingredients').insert({
                        recipe_id: recipe.id,
                        ingredient_id: ingredientId,
                        amount: ing.amount,
                        type: ing.type
                    });
                }
            }

            // Insert recipe steps
            const stepsData = recipeData.steps.map((step, index) => ({
                recipe_id: recipe.id,
                step_order: index + 1,
                title: step.title,
                description: step.description,
                image: step.image,
                video_url: null
            }));

            await supabase.from('recipe_steps').insert(stepsData);
        }

        console.log(`\n✅ Successfully seeded ${RECIPES_DATA.length} recipes!`);
        console.log('\n🎉 Database seeding completed successfully!\n');
    } catch (error: any) {
        console.error('❌ Error seeding database:', error.message);
        process.exit(1);
    }
}

// Run the seed function
seedDatabase();
