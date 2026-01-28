
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

async function fixCategories() {
    console.log('Fixing ingredient categories...');

    const updates = [
        { name: '口蘑', category: 'vegetable', icon: '🍄' },
        { name: '娃娃菜', category: 'vegetable', icon: '🥬' },
        { name: '土鸡蛋', category: 'meat', icon: '🥚' }, // Classify as meat/protein for now
        { name: '鸡蛋', category: 'meat', icon: '🥚' },
        { name: '大米', category: 'staple', icon: '🍚' },
        { name: '奶粉', category: 'staple', icon: '🥛' }, // Classify as staple/drink
    ];

    for (const update of updates) {
        const { error } = await supabase
            .from('ingredients')
            .update({ category: update.category, icon: update.icon })
            .eq('name', update.name);

        if (error) {
            console.error(`Failed to update ${update.name}:`, error.message);
        } else {
            console.log(`Updated ${update.name} to ${update.category}`);
        }
    }
}

fixCategories();
