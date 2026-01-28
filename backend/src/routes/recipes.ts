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
        const { data: recipe, error } = await supabase
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
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!recipe) {
            return res.status(404).json({ error: 'Recipe not found' });
        }

        // 2. Fetch Favorites Status (Is Collected?)
        let isCollected = false;
        if (userId) {
            const { data: fav } = await supabase
                .from('user_favorites')
                .select('id')
                .eq('user_id', userId)
                .eq('recipe_id', id)
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

// POST /api/recipes/:id/favorite - Toggle Favorite (Collect)
router.post('/:id/favorite', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { userId = 'default-user' } = req.body;

        const { data: existing } = await supabase
            .from('user_favorites')
            .select('id')
            .eq('user_id', userId)
            .eq('recipe_id', id)
            .single();

        if (existing) {
            await supabase.from('user_favorites').delete().eq('id', existing.id);
            return res.json({ isCollected: false });
        } else {
            await supabase.from('user_favorites').insert({ user_id: userId, recipe_id: id });
            return res.json({ isCollected: true });
        }
    } catch (error: any) {
        console.error('Error toggling favorite:', error);
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

export default router;
