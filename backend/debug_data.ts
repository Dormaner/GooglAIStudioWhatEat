
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing ENV variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log('--- Checking Recipes ---');
    // Get latest recipes
    const { data: recipes, error } = await supabase
        .from('recipes')
        .select('*, recipe_steps(*)')
        .not('link', 'is', null) // Filter scraped recipes
        .limit(5);

    if (error) {
        console.error('Error fetching recipes:', error);
        return;
    }

    console.log(`Found ${recipes.length} scraped recipes.`);

    recipes.forEach(r => {
        console.log(`\nRecipe: ${r.name} (ID: ${r.id})`);
        console.log(`Link: ${r.link}`);
        console.log(`Steps Count: ${r.recipe_steps?.length}`);
        if (r.recipe_steps?.length > 0) {
            console.log('Sample Step:', r.recipe_steps[0]);
        } else {
            console.warn('WARNING: No steps found for this recipe!');
        }
    });
}

checkData();
