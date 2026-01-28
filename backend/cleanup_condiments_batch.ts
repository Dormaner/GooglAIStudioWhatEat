
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

const SAFE_CONDIMENTS = [
    '食盐', '白糖', '生抽', '老抽', '料酒', '陈醋', '米醋', '蚝油', '芝麻油',
    '玉米淀粉', '鸡精', '味精', '花椒', '干辣椒', '八角', '桂皮', '香叶',
    '豆瓣酱', '甜面酱', '辣椒粉', '孜然粉', '胡椒粉', '冰糖', '红糖'
];

async function cleanupCondiments() {
    console.log('Cleaning up condiments (BATCH MODE)...');

    // Move all condiments NOT in the safe list to 'other'
    // Using .not() filter seems supported by Supabase JS

    const { error, count } = await supabase
        .from('ingredients')
        .update({ category: 'other' })
        .eq('category', 'condiment')
        .not('name', 'in', `(${SAFE_CONDIMENTS.join(',')})`); // Syntax might be tricky, let's try fetch-filter-update if this fails, but hopefully .in() works?
    // Actually .not('name', 'in', array) is correct syntax for supbase-js v2

    // Wait, .not('name', 'in', ...) requires the value to be formatted correctly.
    // safer: .filter('name', 'not.in', `(${SAFE_CONDIMENTS.map(s => `"${s}"`).join(',')})`)

    // Let's try the .not operator properly
    const { data, error: updateError } = await supabase
        .from('ingredients')
        .update({ category: 'other' })
        .eq('category', 'condiment')
        .not('name', 'in', `(${SAFE_CONDIMENTS.map(s => `"${s}"`).join(',')})`)
        .select();

    if (updateError) {
        console.error('Batch update failed:', updateError);
        // Fallback?
    } else {
        console.log(`Cleaned up ${data?.length} mislabeled condiments.`);
    }
}

cleanupCondiments();
