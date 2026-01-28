
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
    console.log('Cleaning up condiments...');

    // 1. Fetch all current condiments
    const { data: condiments, error } = await supabase
        .from('ingredients')
        .select('*')
        .eq('category', 'condiment');

    if (error) {
        console.error('Fetch error:', error);
        return;
    }

    console.log(`Found ${condiments.length} items labeled as condiment.`);

    for (const item of condiments) {
        if (SAFE_CONDIMENTS.includes(item.name)) {
            continue; // Keep it
        }

        let newCategory = 'other';
        let newIcon = '🥘';

        // Heuristics
        if (item.name.includes('肉') || item.name.includes('排骨') || item.name.includes('鸡') || item.name.includes('牛') || item.name.includes('鸭') || item.name.includes('蛋')) {
            newCategory = 'meat';
            newIcon = '🥩';
        } else if (item.name.includes('菜') || item.name.includes('菇') || item.name.includes('瓜') || item.name.includes('豆') || item.name.includes('笋') || item.name.includes('茄')) {
            newCategory = 'vegetable';
            newIcon = '🥬';
        } else if (item.name.includes('面') || item.name.includes('粉') || item.name.includes('米') || item.name.includes('饭')) {
            newCategory = 'staple';
            newIcon = '🍚';
        } else if (item.name.includes('酱') || item.name.includes('油') || item.name.includes('醋') || item.name.includes('糖') || item.name.includes('盐')) {
            // Keep as condiment if it looks like one but wasn't in SAFE list
            newCategory = 'condiment';
        }

        if (newCategory !== 'condiment') {
            console.log(`Moving ${item.name} from condiment to ${newCategory}`);
            await supabase
                .from('ingredients')
                .update({ category: newCategory, icon: newIcon })
                .eq('id', item.id);
        } else if (!SAFE_CONDIMENTS.includes(item.name)) {
            // It's a condiment but not in our "Safe Top 20". 
            // We might want to move it to 'other' to hide it from the "Common" list if the user wants it STRICTLY clean.
            // User said "Only 20 common ones".
            // So let's move even "extra" condiments to 'other' (or 'condiment_extra' if we supported it, but 'other' is safer for now to hide it).
            // Actually, let's keep it as condiment if it clearly looks like one, otherwise 'other'.
            // Re-reading user request: "Pick top 20... Others listed were wrong...".
            // User implied the list was too long and contained wrong stuff.
            // So hiding obscure condiments is probably desired.

            console.log(`Moving obscure/unknown item ${item.name} to 'other'`);
            await supabase
                .from('ingredients')
                .update({ category: 'other' })
                .eq('id', item.id);
        }
    }

    console.log('Cleanup complete.');
}

cleanupCondiments();
