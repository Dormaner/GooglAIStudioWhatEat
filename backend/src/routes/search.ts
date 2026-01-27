import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

// POST /api/search/by-ingredients - Search recipes by available ingredients
router.post('/by-ingredients', async (req: Request, res: Response) => {
    try {
        const { ingredients, strict = false } = req.body;

        if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
            return res.status(400).json({ error: 'Ingredients array is required' });
        }

        // Get all recipes with their ingredients
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
      `);

        if (error) throw error;

        // Filter recipes based on matching logic
        const matchedRecipes = recipes?.map(recipe => {
            const recipeIngredientNames = recipe.recipe_ingredients?.map(
                (ri: any) => ri.ingredients.name
            ) || [];

            const matchingCount = recipeIngredientNames.filter((name: string) =>
                ingredients.includes(name)
            ).length;

            const missingIngredients = recipeIngredientNames.filter(
                (name: string) => !ingredients.includes(name)
            );

            return {
                recipe,
                matchingCount,
                totalIngredients: recipeIngredientNames.length,
                missingIngredients,
                matchPercentage: recipeIngredientNames.length > 0
                    ? (matchingCount / recipeIngredientNames.length) * 100
                    : 0
            };
        }).filter(item => {
            if (strict) {
                // Strict mode: all recipe ingredients must be available
                return item.missingIngredients.length === 0;
            } else {
                // Fuzzy mode: at least one ingredient matches
                return item.matchingCount > 0;
            }
        }).sort((a, b) => {
            // Sort by match percentage (descending)
            return b.matchPercentage - a.matchPercentage;
        });

        // Format response
        const formattedRecipes = matchedRecipes?.map(item => ({
            id: item.recipe.id,
            name: item.recipe.name,
            image: item.recipe.image,
            insight: item.recipe.insight || '',
            missingIngredients: item.missingIngredients,
            matchPercentage: Math.round(item.matchPercentage),
            ingredients: {
                main: item.recipe.recipe_ingredients
                    ?.filter((ri: any) => ri.type === 'main')
                    .map((ri: any) => ({
                        name: ri.ingredients.name,
                        amount: ri.amount,
                        status: ingredients.includes(ri.ingredients.name) ? 'stocked' : 'missing'
                    })) || [],
                condiments: item.recipe.recipe_ingredients
                    ?.filter((ri: any) => ri.type === 'condiment')
                    .map((ri: any) => ({
                        name: ri.ingredients.name,
                        amount: ri.amount,
                        status: ingredients.includes(ri.ingredients.name) ? 'stocked' : 'missing'
                    })) || []
            },
            steps: item.recipe.recipe_steps
                ?.sort((a: any, b: any) => a.step_order - b.step_order)
                .map((step: any) => ({
                    title: step.title,
                    description: step.description,
                    image: step.image,
                    videoUrl: step.video_url
                })) || []
        }));

        res.json(formattedRecipes);
    } catch (error: any) {
        console.error('Error searching recipes by ingredients:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/search/recipes - Search recipes by keyword
router.get('/recipes', async (req: Request, res: Response) => {
    try {
        const { q } = req.query;

        if (!q || typeof q !== 'string') {
            return res.status(400).json({ error: 'Query parameter "q" is required' });
        }

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
            .ilike('name', `%${q}%`);

        if (error) throw error;

        // Format response
        const formattedRecipes = recipes?.map(recipe => ({
            id: recipe.id,
            name: recipe.name,
            image: recipe.image,
            insight: recipe.insight || '',
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
        console.error('Error searching recipes:', error);
        res.status(500).json({ error: error.message });
    }
});
// GET /api/search/bilibili - Proxy search to Bilibili
router.get('/bilibili', async (req: Request, res: Response) => {
    try {
        const { q } = req.query;

        if (!q || typeof q !== 'string') {
            return res.status(400).json({ error: 'Query parameter "q" is required' });
        }

        const bilibiliUrl = `https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=${encodeURIComponent(q as string)}&page=1&page_size=20`;

        // Bilibili requires User-Agent and Cookies to return proper data reliably
        const response = await fetch(bilibiliUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.bilibili.com/',
                'Cookie': 'buvid3=infoc; PVID=1;' // Basic cookies to bypass some anti-bot checks
            }
        });

        if (!response.ok) {
            throw new Error(`Bilibili API error: ${response.status} ${response.statusText}`);
        }

        const data: any = await response.json();
        const items = data?.data?.result || [];

        // Transform Bilibili results to Recipe format
        const recipes = items.map((item: any) => ({
            id: `bili-${item.bvid}`,
            name: item.title.replace(/<[^>]*>/g, ''), // Strip HTML tags like <em class="keyword">
            image: item.pic.startsWith('//') ? `https:${item.pic}` : item.pic,
            insight: `UP主: ${item.author} • 播放: ${item.play}`,
            link: `https://www.bilibili.com/video/${item.bvid}`,
            ingredients: { main: [], condiments: [] }, // No ingredient data from search
            steps: [],
            missingIngredients: []
        }));

        res.json(recipes);

    } catch (error: any) {
        console.error('Error searching Bilibili:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
