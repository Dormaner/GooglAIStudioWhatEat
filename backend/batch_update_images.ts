
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load env
dotenv.config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing ENV variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const UA_MOBILE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';

async function batchUpdateimages() {
    console.log('--- Starting Batch Image Update ---');

    // 1. Get all recipes
    const { data: recipes, error } = await supabase
        .from('recipes')
        .select('id, link, name')
        .not('link', 'is', null);

    if (error || !recipes) {
        console.error('Failed to fetch recipes:', error);
        return;
    }

    console.log(`Found ${recipes.length} recipes to check.`);

    for (const [index, recipe] of recipes.entries()) {
        console.log(`[${index + 1}/${recipes.length}] Checking: ${recipe.name}`);

        try {
            // Fetch page
            const { data: html } = await axios.get(recipe.link, {
                headers: { 'User-Agent': UA_MOBILE },
                timeout: 10000
            });

            const $ = cheerio.load(html as string);
            let newImage = '';

            // Extract using JSON-LD (Best Source)
            $('script[type="application/ld+json"]').each((_, el) => {
                try {
                    const jsonStr = $(el).html() || '{}';
                    const data = JSON.parse(jsonStr);
                    const checkRecipe = (obj: any) => {
                        if (obj['@type'] === 'Recipe' && obj.image) {
                            newImage = Array.isArray(obj.image) ? obj.image[0] : obj.image;
                        }
                    };
                    if (Array.isArray(data)) data.forEach(checkRecipe);
                    else checkRecipe(data);
                } catch (e) { }
            });

            // Fallbacks
            if (!newImage) {
                newImage = $('video').attr('poster')
                    || $('meta[property="og:image"]').attr('content')
                    || $('.cover-image img').attr('src')
                    || $('.recipe-show img').attr('src')
                    || '';
            }

            if (newImage && newImage.startsWith('//')) newImage = 'https:' + newImage;

            if (newImage) {
                // Update DB
                await supabase.from('recipes').update({ image: newImage }).eq('id', recipe.id);
                console.log(`   -> Updated Image: ${newImage}`);
            } else {
                console.warn(`   -> No image found.`);
            }

            // Polite delay
            await new Promise(r => setTimeout(r, 1000));

        } catch (err: any) {
            console.error(`   -> Failed: ${err.message}`);
        }
    }

    console.log('--- Batch Update Completed ---');
}

batchUpdateimages();
