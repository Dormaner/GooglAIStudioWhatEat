import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { Recipe } from '../types/index.js';

const router = Router();

// GET /api/recipes - Get all recipes
router.get('/', async (req: Request, res: Response) => {
    try {
        const { data: recipes, error } = await supabase
            .from('recipes')
            .select(`
        *,
        recipe_steps (*),
        recipe_ingredients (
          amount,
          type,
          ingredients (id, name, category, icon)
        )
      `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform database format to frontend format
        const formattedRecipes = recipes?.map(recipe => ({
            id: recipe.id,
            name: recipe.name,
            image: recipe.image,
            insight: recipe.insight || '',
            link: recipe.link,
            ingredients: {
                main: recipe.recipe_ingredients
                    ?.filter((ri: any) => ri.type === 'main')
                    .map((ri: any) => ({
                        name: ri.ingredients.name,
                        amount: ri.amount,
                        status: 'stocked' as const
                    })) || [],
                condiments: recipe.recipe_ingredients
                    ?.filter((ri: any) => ri.type === 'condiment')
                    .map((ri: any) => ({
                        name: ri.ingredients.name,
                        amount: ri.amount,
                        status: 'stocked' as const
                    })) || []
            },
            steps: recipe.recipe_steps
                ?.sort((a: any, b: any) => a.step_order - b.step_order)
                .map((step: any) => ({
                    title: step.title,
                    description: step.description,
                    image: step.image,
                    videoUrl: step.video_url
                })) || [],
            missingIngredients: []
        }));

        res.json(formattedRecipes);
    } catch (error: any) {
        console.error('Error fetching recipes:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/recipes/:id - Get single recipe by ID
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req.query.userId as string) || 'default-user';

        // 1. Fetch Recipe
        let recipe: any = null;
        const queryBuilder = supabase.from('recipes')
            .select(`
        *,
        recipe_steps (*),
        recipe_ingredients (
          amount,
          type,
          ingredients (id, name, category, icon)
        )
      `)
            .select(`
        *,
        recipe_steps (*),
        recipe_ingredients (
          amount,
          type,
          ingredients (id, name, category, icon)
        )
      `);

        // Only query by ID if it is a valid UUID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        if (isUUID) {
            const { data, error } = await queryBuilder.eq('id', id).single();
            if (!error) recipe = data;
        } else {
            // If not UUID, we can't find it by ID in this table.
            recipe = null;
        }


        // 2. Fallback: If not found or invalid UUID, try to find by NAME (assuming unique names for external imports)
        let foundRecipe = recipe;
        if (!foundRecipe) {
            const name = req.query.name as string;
            if (name) {
                const { data: byName } = await supabase
                    .from('recipes')
                    .select(`
                        *,
                        recipe_steps (*),
                        recipe_ingredients (
                          amount,
                          type,
                          ingredients (id, name, category, icon)
                        )
                      `)
                    .eq('name', name)
                    .single();
                if (byName) {
                    foundRecipe = byName;
                    // We found the persistent version of this external recipe!
                }
            }
        }

        if (!foundRecipe) {
            // If truly not found, we can just return 404. 
            // BUT for the frontend "fresh fetch", if it returns 404 the frontend keeps the old state.
            // That is acceptable behavior.
            return res.status(404).json({ error: 'Recipe not found' });
        }

        // Use the found persistent recipe for the rest of logic
        recipe = foundRecipe;

        // 3. Fetch Favorites Status (Is Collected?)
        let isCollected = false;
        if (userId) {
            const { data: fav } = await supabase
                .from('user_favorites')
                .select('id')
                .eq('user_id', userId)
                .eq('recipe_id', recipe.id) // Use the REAL UUID we found
                .single();
            isCollected = !!fav;
        }

        // 3. Transform to frontend format
        // MAPPING: 
        // likes (Heart in UI) -> recipes.cooked_count (Global Made Count)
        // isCollected (Star in UI) -> user_favorites check
        const formattedRecipe = {
            id: recipe.id,
            name: recipe.name,
            image: recipe.image,
            insight: recipe.insight || '', // Ensure insight is returned
            link: recipe.link, // Add link for external navigation
            likes: recipe.cooked_count || 0, // Heart = Global Cooked Count
            isCollected: isCollected,
            ingredients: {
                main: recipe.recipe_ingredients
                    ?.filter((ri: any) => ri.type === 'main')
                    .map((ri: any) => ({
                        name: ri.ingredients.name,
                        amount: ri.amount,
                        status: 'stocked' as const
                    })) || [],
                condiments: recipe.recipe_ingredients
                    ?.filter((ri: any) => ri.type === 'condiment')
                    .map((ri: any) => ({
                        name: ri.ingredients.name,
                        amount: ri.amount,
                        status: 'stocked' as const
                    })) || []
            },
            steps: recipe.recipe_steps
                ?.sort((a: any, b: any) => a.step_order - b.step_order)
                .map((step: any) => ({
                    title: step.title,
                    description: step.description,
                    image: step.image,
                    videoUrl: step.video_url
                })) || []
        };

        res.json(formattedRecipe);
    } catch (error: any) {
        console.error('Error fetching recipe:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/recipes/:id/favorite - Ensure Recipe Exists & Return UUID (Frontend handles Favorite)
router.post('/:id/favorite', async (req: Request, res: Response) => {
    try {
        let { id } = req.params;
        const { recipe } = req.body;

        // CHECK IF ID IS VALID UUID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        if (!isUUID) {
            // It's an external ID. Find or Create persistent recipe.

            // 1. Try to find by Name
            let { data: existingRecipe } = await supabase
                .from('recipes')
                .select('id')
                .eq('name', recipe?.name || '')
                .single();

            if (existingRecipe) {
                id = existingRecipe.id;
            } else if (recipe) {
                // 2. Create new recipe
                console.log("Creating new recipe for external favorite:", recipe.name);
                const { data: newRecipe, error: createError } = await supabase
                    .from('recipes')
                    .insert({
                        name: recipe.name,
                        image: recipe.image || '',
                        insight: recipe.insight || '',
                        cooked_count: 0
                        // link: recipe.link
                    })
                    .select('id')
                    .single();

                if (createError) throw createError;
                id = newRecipe.id;
            } else {
                return res.status(400).json({ error: "Cannot favorite external recipe without recipe data" });
            }
        }

        // Return the UUID to the frontend
        res.json({ id });

    } catch (error: any) {
        console.error('Error ensuring recipe for favorite:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/recipes/:id/cooked - Increment Cooked Count
router.post('/:id/cooked', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Uses RPC or simple read-update (concurrency could be issue but fine for now)
        // Ideally: call a stored procedure `increment_cooked_count`. 
        // For simplicity: Read + 1
        const { data: recipe } = await supabase
            .from('recipes')
            .select('cooked_count')
            .eq('id', id)
            .single();

        const newCount = (recipe?.cooked_count || 0) + 1;

        const { error } = await supabase
            .from('recipes')
            .update({ cooked_count: newCount })
            .eq('id', id);

        if (error) throw error;

        res.json({ cookedCount: newCount });
    } catch (error: any) {
        console.error('Error incrementing cooked count:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/recipes - Create new recipe
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, image, insight, ingredients, steps } = req.body;

        // Insert recipe with cooked_count default 0
        const { data: recipe, error: recipeError } = await supabase
            .from('recipes')
            .insert({ name, image, insight, cooked_count: 0 })
            .select()
            .single();

        if (recipeError) throw recipeError;

        // ... rest of insertion logic (ingredients/steps) ...
        if (ingredients?.main?.length > 0 || ingredients?.condiments?.length > 0) {
            const allIngredients = [
                ...(ingredients.main || []).map((ing: any) => ({ ...ing, type: 'main' })),
                ...(ingredients.condiments || []).map((ing: any) => ({ ...ing, type: 'condiment' }))
            ];

            for (const ing of allIngredients) {
                let { data: existingIng } = await supabase
                    .from('ingredients')
                    .select('id')
                    .eq('name', ing.name)
                    .single();

                if (!existingIng) {
                    const { data: newIng } = await supabase
                        .from('ingredients')
                        .insert({ name: ing.name, category: 'condiment', icon: '🧂' })
                        .select()
                        .single();
                    existingIng = newIng;
                }

                if (existingIng) {
                    await supabase
                        .from('recipe_ingredients')
                        .insert({
                            recipe_id: recipe.id,
                            ingredient_id: existingIng.id,
                            amount: ing.amount,
                            type: ing.type
                        });
                }
            }
        }

        if (steps?.length > 0) {
            const stepsData = steps.map((step: any, index: number) => ({
                recipe_id: recipe.id,
                step_order: index + 1,
                title: step.title,
                description: step.description,
                image: step.image,
                video_url: step.videoUrl
            }));
            await supabase.from('recipe_steps').insert(stepsData);
        }

        res.status(201).json({ id: recipe.id, message: 'Recipe created successfully' });
    } catch (error: any) {
        console.error('Error creating recipe:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/recipes/:id - Update recipe
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, image, insight } = req.body;

        // Dynamic update object
        const updates: any = {};
        if (name !== undefined) updates.name = name;
        if (image !== undefined) updates.image = image;
        if (insight !== undefined) updates.insight = insight;

        console.log(`[PUT /recipes/${id}] Updating insight to:`, insight);

        const { error } = await supabase
            .from('recipes')
            .update(updates)
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Recipe updated successfully' });
    } catch (error: any) {
        console.error('Error updating recipe:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/recipes/:id - Delete recipe
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('recipes')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Recipe deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting recipe:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/recipes/parse-from-url - Parse recipe from external URL
router.post('/parse-from-url', async (req: Request, res: Response) => {
    try {
        const { url, userId = 'default-user' } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        const platform = detectPlatform(url);
        console.log(`[Parse] Platform detected: ${platform} for URL: ${url}`);

        if (platform === 'unknown') {
            return res.status(400).json({ error: 'Unsupported platform. Please use Bilibili, Douyin, or Xiaohongshu links.' });
        }

        // Currently only Bilibili is fully supported
        if (platform !== 'bilibili') {
            return res.status(501).json({ error: `${platform} support coming soon. Currently only Bilibili is supported.` });
        }

        // Extract BVID
        const bvid = extractBVID(url);
        if (!bvid) {
            return res.status(400).json({ error: 'Invalid Bilibili URL. Could not extract video ID.' });
        }

        console.log(`[Parse] Extracted BVID: ${bvid}`);

        // Fetch video info from Bilibili
        const biliUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
        const biliResponse = await fetch(biliUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.bilibili.com/'
            }
        });

        if (!biliResponse.ok) {
            throw new Error('Failed to fetch Bilibili video info');
        }

        const biliData: any = await biliResponse.json();
        const videoInfo = biliData?.data;

        // Initialize AI (reused for both paths)
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

        // 1. Get Play URL
        const playUrlApi = `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${videoInfo.cid}&qn=16&type=mp4&platform=html5`;
        const playRes = await fetch(playUrlApi, {
            headers: { 'Cookie': 'SESSDATA=...' } // Add dummy cookie if needed
        });
        const playData: any = await playRes.json();
        const durl = playData?.data?.durl;

        let recipeData;

        console.log('[Parse] Checking video availability...', {
            hasDurl: !!durl,
            durLength: durl?.length,
            playDataCode: playData?.code
        });

        // NEW APPROACH: Skip video download entirely, use text analysis + Puppeteer screenshots
        // This bypasses Bilibili's API restrictions
        if (durl && durl.length > 0) {
            console.log('[Parse] ✅ Video available, using text analysis + Puppeteer screenshots...');

            try {
                // Step 1: Use text-based AI to analyze video metadata and generate recipe structure
                console.log('[Parse] Step 1: Analyzing video metadata with AI...');
                const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
                const prompt = `
                    You are an expert chef. Analyze this cooking video and create a detailed recipe.
                    
                    Video Title: ${videoInfo.title}
                    Description: ${videoInfo.desc}
                    Duration: ${videoInfo.duration} seconds
                    
                    IMPORTANT: For each cooking step, estimate a reasonable timestamp (in seconds) 
                    where that step would visually appear in the video. Distribute timestamps evenly 
                    across the video duration.
                    
                    Return ONLY valid JSON (no markdown):
                    {
                        "name": "Recipe Name",
                        "ingredients": {
                            "main": [{"name": "Ingredient", "amount": "Quantity"}],
                            "condiments": [{"name": "Condiment", "amount": "Quantity"}]
                        },
                        "steps": [
                            { 
                                "title": "Step Title", 
                                "description": "Detailed description...", 
                                "timestamp": 15.5
                            }
                        ]
                    }
                    
                    Language: Simplified Chinese (zh-CN).
                    Ensure timestamps are spread across 0 to ${videoInfo.duration} seconds.
                `;

                const result = await model.generateContent(prompt);
                const jsonStr = result.response.text().replace(/```json|```/g, '').trim();
                recipeData = JSON.parse(jsonStr);

                console.log('[Parse] ✅ AI analysis complete:', {
                    name: recipeData.name,
                    stepsCount: recipeData.steps?.length
                });

                // Step 2: Capture screenshots using Puppeteer for each step with timestamp
                console.log('[Parse] Step 2: Capturing screenshots with Puppeteer...');

                const { captureVideoFrame, cleanupScreenshot } = await import('../utils/browserScreenshot');

                if (recipeData.steps) {
                    for (const step of recipeData.steps) {
                        if (typeof step.timestamp === 'number') {
                            try {
                                console.log(`[Parse] Capturing screenshot at ${step.timestamp}s for: ${step.title}`);

                                // Capture screenshot using browser automation
                                const framePath = await captureVideoFrame(bvid, step.timestamp);

                                // Upload to Supabase Storage
                                const frameBuffer = await import('fs').then(fs => fs.promises.readFile(framePath));
                                const frameName = `steps/${bvid}_${step.timestamp}_${Date.now()}.jpg`;

                                const { data: uploadData, error: uploadError } = await (await import('../config/supabase')).supabase
                                    .storage
                                    .from('recipe-images')
                                    .upload(frameName, frameBuffer, { contentType: 'image/jpeg' });

                                if (!uploadError) {
                                    const { data: { publicUrl } } = (await import('../config/supabase')).supabase
                                        .storage
                                        .from('recipe-images')
                                        .getPublicUrl(frameName);
                                    step.image = publicUrl;
                                    console.log(`[Parse] ✅ Screenshot uploaded for step at ${step.timestamp}s`);
                                } else {
                                    console.warn('[Parse] Upload failed:', uploadError);
                                }

                                // Cleanup local screenshot
                                await cleanupScreenshot(framePath);
                            } catch (e) {
                                console.error(`[Parse] Screenshot failed for step at ${step.timestamp}s:`, e);
                            }
                        }
                    }
                }

                console.log('[Parse] ✅ Screenshot extraction complete!');

            } catch (videoError) {
                console.error('[Parse] ❌ Advanced video analysis failed:', {
                    error: videoError,
                    message: videoError instanceof Error ? videoError.message : String(videoError),
                    stack: videoError instanceof Error ? videoError.stack : undefined,
                    cause: videoError instanceof Error ? (videoError as any).cause : undefined
                });
                console.log('[Parse] Falling back to text analysis...');
                // Fallback to original text-only logic will happen if recipeData is not set
            }
        }

        // Fallback: Text-only analysis (if video download failed or analysis crashed)
        if (!recipeData) {
            // ... existing text-only logic ...
            // Use Gemini 2.5 Flash (available for this API key)
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const prompt = `
                You are a chef assistant. Extract a recipe from this video info:
                Video Title: ${videoInfo.title}
                Description: ${videoInfo.desc}

                Return purely JSON data with NO markdown formatting:
                {
                    "name": "Recipe Name",
                    "ingredients": {
                        "main": [{"name": "Ingredient", "amount": "Quantity"}],
                        "condiments": [{"name": "Condiment", "amount": "Quantity"}]
                    },
                    "steps": [
                        { "title": "Step Title", "description": "Step details..." }
                    ]
                }
                Language: Simplified Chinese (zh-CN).
                If info is missing, infer a reasonable recipe based on the title.
             `;
            const result = await model.generateContent(prompt);
            const jsonStr = result.response.text().replace(/```json|```/g, '').trim();
            recipeData = JSON.parse(jsonStr);
        }

        // Add metadata
        const coverImage = videoInfo.pic ? (videoInfo.pic.startsWith('//') ? `https:${videoInfo.pic}` : videoInfo.pic) : '';

        // CRITICAL: Ensure all steps have images (use cover as fallback)
        const stepsWithImages = (recipeData.steps || []).map((step: any) => ({
            ...step,
            image: step.image || coverImage // Use extracted screenshot OR fallback to cover
        }));

        console.log('[Parse] Final recipe prepared:', {
            name: recipeData.name,
            stepsCount: stepsWithImages.length,
            coverImage: coverImage.substring(0, 50) + '...'
        });

        const parsedRecipe = {
            name: recipeData.name || videoInfo.title,
            image: coverImage,
            ingredients: recipeData.ingredients || { main: [], condiments: [] },
            steps: stepsWithImages,
            source: {
                platform,
                originalUrl: url,
                author: videoInfo.owner?.name || 'Unknown'
            }
        };

        console.log(`[Parse] Successfully parsed recipe: ${parsedRecipe.name}`);
        res.json(parsedRecipe);

    } catch (error: any) {
        console.error('[Parse] Error:', error);
        res.status(500).json({ error: error.message || 'Failed to parse recipe' });
    }
});

// POST /api/recipes/save-custom - Save custom parsed recipe
router.post('/save-custom', async (req: Request, res: Response) => {
    try {
        const { recipe, userId = 'default-user' } = req.body;

        if (!recipe || !recipe.name) {
            return res.status(400).json({ error: 'Recipe data is required' });
        }

        console.log(`[Save Custom] Saving recipe: ${recipe.name} for user: ${userId}`);

        // 1. Insert recipe
        const { data: newRecipe, error: recipeError } = await supabase
            .from('recipes')
            .insert({
                name: recipe.name,
                image: recipe.image || '',
                link: recipe.source?.originalUrl || '',
                insight: `来源: ${recipe.source?.platform || 'Unknown'} - ${recipe.source?.author || 'Unknown'}`,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (recipeError) throw recipeError;

        const recipeId = newRecipe.id;
        console.log(`[Save Custom] Recipe created with ID: ${recipeId}`);

        // 2. Insert ingredients
        const allIngredients = [
            ...(recipe.ingredients?.main || []).map((ing: any) => ({ ...ing, type: 'main' })),
            ...(recipe.ingredients?.condiments || []).map((ing: any) => ({ ...ing, type: 'condiment' }))
        ];

        for (const ing of allIngredients) {
            // Find or create ingredient
            let { data: existingIng } = await supabase
                .from('ingredients')
                .select('id')
                .eq('name', ing.name)
                .single();

            let ingredientId;
            if (existingIng) {
                ingredientId = existingIng.id;
            } else {
                // Create new ingredient
                const { data: newIng, error: ingError } = await supabase
                    .from('ingredients')
                    .insert({
                        name: ing.name,
                        category: ing.type === 'condiment' ? 'condiments' : 'vegetables' // Default category
                    })
                    .select()
                    .single();

                if (ingError) {
                    console.warn(`[Save Custom] Failed to create ingredient ${ing.name}:`, ingError);
                    continue;
                }
                ingredientId = newIng.id;
            }

            // Link ingredient to recipe
            await supabase
                .from('recipe_ingredients')
                .insert({
                    recipe_id: recipeId,
                    ingredient_id: ingredientId,
                    amount: ing.amount || '适量',
                    type: ing.type
                });
        }

        // 3. Insert steps
        if (recipe.steps && recipe.steps.length > 0) {
            const stepsToInsert = recipe.steps.map((step: any, index: number) => ({
                recipe_id: recipeId,
                step_order: index + 1,
                title: step.title || `步骤 ${index + 1}`,
                description: step.description || '',
                image: step.image || recipe.image || ''
            }));

            const { error: stepsError } = await supabase
                .from('recipe_steps')
                .insert(stepsToInsert);

            if (stepsError) {
                console.warn('[Save Custom] Failed to insert steps:', stepsError);
            }
        }

        console.log(`[Save Custom] Recipe saved successfully: ${recipe.name}`);
        res.json({ success: true, recipeId, message: 'Recipe saved successfully' });

    } catch (error: any) {
        console.error('[Save Custom] Error:', error);
        res.status(500).json({ error: error.message || 'Failed to save recipe' });
    }
});

export default router;

// Helper function to detect platform
function detectPlatform(url: string): 'bilibili' | 'douyin' | 'xiaohongshu' | 'unknown' {
    if (url.includes('bilibili.com') || url.includes('b23.tv')) return 'bilibili';
    if (url.includes('douyin.com') || url.includes('v.douyin.com')) return 'douyin';
    if (url.includes('xiaohongshu.com') || url.includes('xhslink.com')) return 'xiaohongshu';
    return 'unknown';
}

// Helper function to extract BVID from Bilibili URL
function extractBVID(url: string): string | null {
    const patterns = [
        /BV[a-zA-Z0-9]+/,
        /\/video\/(BV[a-zA-Z0-9]+)/,
        /b23\.tv\/([a-zA-Z0-9]+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[0].startsWith('BV') ? match[0] : `BV${match[1]}`;
    }
    return null;
}
