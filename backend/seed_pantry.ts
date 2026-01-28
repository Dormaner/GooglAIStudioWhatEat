
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const CONDIMENTS = [
    { name: '食盐', icon: '🧂' },
    { name: '白糖', icon: '🍬' },
    { name: '生抽', icon: '🍾' },
    { name: '老抽', icon: '⚫' },
    { name: '料酒', icon: '🍶' },
    { name: '陈醋', icon: '🏺' },
    { name: '米醋', icon: '⚪' },
    { name: '蚝油', icon: '🦪' },
    { name: '芝麻油', icon: '🧴' },
    { name: '玉米淀粉', icon: '🍚' },
    { name: '鸡精', icon: '🐔' },
    { name: '味精', icon: '🧂' },
    { name: '花椒', icon: '🌶️' },
    { name: '干辣椒', icon: '🔥' },
    { name: '八角', icon: '⭐' },
    { name: '桂皮', icon: '🪵' },
    { name: '香叶', icon: '🍃' },
    { name: '豆瓣酱', icon: '🥫' },
    { name: '甜面酱', icon: '🍯' },
    { name: '辣椒粉', icon: '🌶️' },
    { name: '孜然粉', icon: '🍢' },
    { name: '胡椒粉', icon: '🧂' },
];

const KITCHENWARE = [
    { name: '炒锅', icon: '🍳' },
    { name: '电饭煲', icon: '🍚' },
    { name: '菜刀', icon: '🔪' },
    { name: '砧板', icon: '🪵' },
    { name: '锅铲', icon: '🥄' },
    { name: '汤勺', icon: '🥣' },
    { name: '蒸锅', icon: '♨️' },
    { name: '砂锅', icon: '🍲' },
    { name: '空气炸锅', icon: '🍟' },
    { name: '烤箱', icon: '🥐' },
    { name: '微波炉', icon: '📻' },
];

async function seedPantry() {
    console.log('Seeding pantry items...');

    // 1. Upsert Condiments
    for (const item of CONDIMENTS) {
        const { error } = await supabase
            .from('ingredients')
            .upsert({
                name: item.name,
                category: 'condiment',
                icon: item.icon
            }, { onConflict: 'name' });

        if (error) console.error(`Failed to upsert ${item.name}:`, error.message);
        else console.log(`Upserted condiment: ${item.name}`);
    }

    // 2. Upsert Kitchenware
    for (const item of KITCHENWARE) {
        const { error } = await supabase
            .from('ingredients')
            .upsert({
                name: item.name,
                category: 'kitchenware',
                icon: item.icon
            }, { onConflict: 'name' });

        if (error) console.error(`Failed to upsert ${item.name}:`, error.message);
        else console.log(`Upserted kitchenware: ${item.name}`);
    }

    console.log('Seeding complete!');
}

seedPantry();
