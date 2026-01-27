import axios from 'axios';
import * as cheerio from 'cheerio';
import { supabase } from '../config/supabase.js';

// User-Agents
const UA_DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const UA_MOBILE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';

export const scrapeXiachufang = async () => {
    console.log('[Scraper] Starting Xiachufang daily scrape...');
    try {
        // 1. Get Popular Recipes IDs from Explore Page
        // We use Desktop UA for this as it lists more recipes clearly
        const { data: exploreHtml } = await axios.get('https://www.xiachufang.com/explore/', {
            headers: { 'User-Agent': UA_DESKTOP }
        });

        const $explore = cheerio.load(exploreHtml as string);
        const recipeLinks: string[] = [];

        // Selector for recipe links on explore page (usually in .normal-recipe-list or similar)
        // We look for links with /recipe/ digits
        $explore('a[href^="/recipe/"]').each((_: any, el: any) => {
            const href = $explore(el).attr('href');
            if (href) {
                // Extract ID
                const match = href.match(/\/recipe\/(\d+)\//);
                if (match) {
                    recipeLinks.push(match[1]);
                }
            }
        });

        // Dedup IDs
        const uniqueIds = [...new Set(recipeLinks)].slice(0, 100); // Increased to 100 for testing
        console.log(`[Scraper] Found ${uniqueIds.length} recipes to process.`);

        for (const id of uniqueIds) {
            await processRecipe(id);
            // Random delay to be polite
            await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));
        }

        console.log('[Scraper] Job completed.');

    } catch (error) {
        console.error('[Scraper] Job failed:', error);
    }
};

const processRecipe = async (id: string) => {
    const mobileUrl = `https://m.xiachufang.com/recipe/${id}/`;
    try {
        console.log(`[Scraper] Processing ${id} ...`);
        const { data: html } = await axios.get(mobileUrl, {
            headers: { 'User-Agent': UA_MOBILE }
        });

        const $ = cheerio.load(html as string);

        // 1. Title
        const name = $('h1').first().text().trim();
        if (!name) {
            console.warn(`[Scraper] Skipped ${id}: No title found`);
            return;
        }

        // 2. Cover Image 
        // Priority: 1. JSON-LD Image (High Res), 2. Video Poster, 3. OG Image, 4. Specific cover class

        let jsonLdImage = '';
        $('script[type="application/ld+json"]').each((_, el) => {
            try {
                const jsonStr = $(el).html() || '{}';
                const data = JSON.parse(jsonStr);

                const checkRecipe = (obj: any) => {
                    if (obj['@type'] === 'Recipe' && obj.image) {
                        // Prefer array first item if multiple
                        jsonLdImage = Array.isArray(obj.image) ? obj.image[0] : obj.image;
                    }
                };

                if (Array.isArray(data)) {
                    data.forEach(checkRecipe);
                } else {
                    checkRecipe(data);
                }
            } catch (e) {
                // Ignore parse errors
            }
        });

        let image = jsonLdImage
            || $('video').attr('poster')
            || $('meta[property="og:image"]').attr('content')
            || $('.cover-image img').attr('src')
            || $('.recipe-show img').attr('src') // Common desktop class just in case
            || '';

        // Fix relative protocol
        if (image && image.startsWith('//')) image = 'https:' + image;

        // 3. Ingredients
        // Structure: .recipe-ingredient a -> Text "Name Amount"
        const ingredientsMain: any[] = [];
        const ingredientsCond: any[] = []; // We put everything in main for now as site doesn't separate clearly

        $('.recipe-ingredient a').each((_: any, el: any) => {
            const text = $(el).text().trim();
            // Split name and amount (often separated by spaces or newlines)
            // Clean up extra spaces
            const cleanText = text.replace(/\s+/g, ' ');
            // Simple logic: assume first word is name, rest is amount, or just put whole string as name if unsure
            // Better: "Potato 200g" -> Name: Potato, Amount: 200g
            // But sometimes "Potato" and "200g" are reversed or mixed. 
            // We'll store formatted string for now or split by last space
            const parts = cleanText.split(' ');
            let ingName = cleanText;
            let ingAmount = '适量';

            if (parts.length > 1) {
                // Heuristic: If last part looks like amount (numeric), split it
                // Else take whole thing
                ingAmount = parts.pop() || '适量';
                ingName = parts.join(' ');
            }

            ingredientsMain.push({ name: ingName, amount: ingAmount });
        });

        // 4. Steps
        const steps: any[] = [];
        // Mobile structure varies, usually H3 "做法" followed by P tags or DIVs
        // We look for text containers that might be steps
        // The inspector showed <p class="step">
        $('.step').each((i: number, el: any) => {
            const desc = $(el).text().trim();
            const img = $(el).find('img').attr('src');
            if (desc) {
                steps.push({
                    step_order: i + 1,
                    title: `步骤 ${i + 1}`,
                    description: desc,
                    image: img ? (img.startsWith('//') ? 'https:' + img : img) : image // Fallback to cover
                });
            }
        });

        // If no .step class found, look for generic p tags after h3? Too risky.
        // Assuming .step works based on popular mobile design (and inspector hint).

        // 5. Save to DB
        // Check if exists
        const { data: existing } = await supabase.from('recipes').select('id').eq('link', mobileUrl).single();

        let recipeId: string;

        if (existing) {
            console.log(`[Scraper] Recipe already exists: ${name}. Updating image...`);
            recipeId = existing.id;

            // Allow updating the image if we found a better one (and it's not the generic logo if possible, though our selector handles that now)
            if (image) {
                await supabase.from('recipes').update({ image }).eq('id', recipeId);
            }
        } else {
            // Create Recipe
            const { data: newRecipe, error } = await supabase.from('recipes').insert({
                name,
                image,
                link: mobileUrl,
                insight: '来自下厨房每日精选'
            }).select().single();

            if (error) throw error;

            if (!newRecipe) throw new Error('Failed to create recipe');
            recipeId = newRecipe.id;
            console.log(`[Scraper] Database entry created: ${name}`);

            // Insert Ingredients
            // Reuse existing ingredient logic from search.ts/recipes.ts if possible, or direct insert
            // We need to map ingredient names to IDs in 'ingredients' table
            for (const ing of ingredientsMain) {
                // Upsert ingredient
                let { data: ingDb } = await supabase.from('ingredients').select('id').eq('name', ing.name).single();
                if (!ingDb) {
                    const { data: createdIng } = await supabase.from('ingredients').insert({
                        name: ing.name, category: 'condiment', icon: '🥘' // Default icon
                    }).select().single();
                    ingDb = createdIng;
                }

                // Link
                if (ingDb) {
                    await supabase.from('recipe_ingredients').insert({
                        recipe_id: recipeId,
                        ingredient_id: ingDb.id,
                        amount: ing.amount,
                        type: 'main'
                    });
                }
            }

            // Insert Steps
            const stepsData = steps.map(s => ({ ...s, recipe_id: recipeId }));
            await supabase.from('recipe_steps').insert(stepsData);
        }

    } catch (e: any) {
        console.error(`[Scraper] Failed to process ${id}:`, e.message);
    }
};
