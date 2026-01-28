
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
// Load env vars
dotenv.config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findRecipe() {
    const name = "水煮肉片 (肯定不翻车)";
    console.log(`Searching for recipe: "${name}"...`);

    const { data, error } = await supabase
        .from('recipes')
        .select('id, name, insight')
        .eq('name', name);

    if (error) {
        console.error('Error fetching recipe:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log(`Found ${data.length} match(es):`);
        data.forEach(r => {
            console.log(`- ID: ${r.id}`);
            console.log(`  Insight: ${r.insight}`);
        });
    } else {
        console.log('No recipe found with that exact name.');
    }
}

findRecipe();
