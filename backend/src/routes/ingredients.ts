import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

// GET /api/ingredients/debug-status - Check if v2 code is active
router.get('/debug-status', (req, res) => {
    res.json({ version: 'v3-final-fix', timestamp: new Date().toISOString() });
});

// GET /api/ingredients - Get all ingredients from library
router.get('/', async (req: Request, res: Response) => {
    try {
        const { data: ingredients, error } = await supabase
            .from('ingredients')
            .select('*')
            .order('category', { ascending: true })
            .order('name', { ascending: true });

        if (error) throw error;

        // Group by category
        const grouped = {
            vegetables: ingredients?.filter(i => i.category === 'vegetable') || [],
            meats: ingredients?.filter(i => i.category === 'meat') || [],
            staples: ingredients?.filter(i => i.category === 'staple') || [],
            condiments: ingredients?.filter(i => i.category === 'condiment') || [],
            kitchenware: ingredients?.filter(i => i.category === 'kitchenware' || i.category === 'tool') || [],
            others: ingredients?.filter(i => !['vegetable', 'meat', 'staple', 'condiment', 'kitchenware', 'tool'].includes(i.category)) || []
        };

        res.json(grouped);
    } catch (error: any) {
        console.error('Error fetching ingredients:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/user-ingredients - Get user's ingredient inventory
router.get('/user-ingredients', async (req: Request, res: Response) => {
    try {
        // For now, using a default user ID. In production, get from auth token
        const userId = req.query.userId || 'default-user';

        const { data: userIngredients, error } = await supabase
            .from('user_ingredients')
            .select(`
        *,
        ingredients (id, name, category, icon)
      `)
            .eq('user_id', userId);

        if (error) throw error;

        const formatted = userIngredients?.map(ui => ({
            id: ui.id,
            name: ui.ingredients.name,
            category: ui.ingredients.category,
            icon: ui.ingredients.icon,
            quantity: ui.quantity,
            unit: ui.unit
        })) || [];

        res.json(formatted);
    } catch (error: any) {
        console.error('Error fetching user ingredients:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST / - Add new ingredient to library
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, category, icon } = req.body;
        console.log(`[POST /ingredients] Request received for: ${name} (Category: ${category}) - v2 handler`);

        if (!name || !category) {
            return res.status(400).json({ error: 'Name and category are required' });
        }

        // Check if exists
        const { data: existing } = await supabase
            .from('ingredients')
            .select('id, category')
            .eq('name', name)
            .single();

        // Determine default icon if not provided/needed
        let defaultIcon = icon;
        if (!defaultIcon) {
            switch (category) {
                case 'vegetable': defaultIcon = '🥬'; break;
                case 'meat': defaultIcon = '🥩'; break;
                case 'staple': defaultIcon = '🍚'; break;
                case 'condiment': defaultIcon = '🧂'; break;
                case 'kitchenware':
                case 'tool': defaultIcon = '🍳'; break;
                default: defaultIcon = '🍽️';
            }
        }

        if (existing) {
            // If exists, update its category to the requested one (claiming it from 'other' or fixing a mistake)
            // Only update if category is different to avoid unnecessary writes, but updating icon is good too if provided
            const { data: updated, error: updateError } = await supabase
                .from('ingredients')
                .update({ category, icon: defaultIcon })
                .eq('id', existing.id)
                .select()
                .single();

            if (updateError) throw updateError;

            // Return successfully
            return res.status(200).json(updated);
        }

        const { data: newIngredient, error } = await supabase
            .from('ingredients')
            .insert({ name, category, icon: defaultIcon })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(newIngredient);
    } catch (error: any) {
        console.error('Error creating ingredient:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/user-ingredients - Add ingredient to user inventory
router.post('/user-ingredients', async (req: Request, res: Response) => {
    try {
        const { ingredientName, quantity, unit } = req.body;
        const userId = req.body.userId || 'default-user';

        // Find ingredient by name
        const { data: ingredient, error: ingError } = await supabase
            .from('ingredients')
            .select('id')
            .eq('name', ingredientName)
            .single();

        if (ingError || !ingredient) {
            return res.status(404).json({ error: 'Ingredient not found' });
        }

        // Check if already exists
        const { data: existing } = await supabase
            .from('user_ingredients')
            .select('id')
            .eq('user_id', userId)
            .eq('ingredient_id', ingredient.id)
            .single();

        if (existing) {
            // Update existing
            const { error: updateError } = await supabase
                .from('user_ingredients')
                .update({ quantity, unit })
                .eq('id', existing.id);

            if (updateError) throw updateError;
            res.json({ message: 'Ingredient updated successfully' });
        } else {
            // Insert new
            const { error: insertError } = await supabase
                .from('user_ingredients')
                .insert({
                    user_id: userId,
                    ingredient_id: ingredient.id,
                    quantity,
                    unit
                });

            if (insertError) throw insertError;
            res.status(201).json({ message: 'Ingredient added successfully' });
        }
    } catch (error: any) {
        console.error('Error adding user ingredient:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/user-ingredients/:ingredientName - Remove ingredient from inventory
router.delete('/user-ingredients/:ingredientName', async (req: Request, res: Response) => {
    try {
        const { ingredientName } = req.params;
        const userId = req.query.userId || 'default-user';

        // Find ingredient
        const { data: ingredient } = await supabase
            .from('ingredients')
            .select('id')
            .eq('name', ingredientName)
            .single();

        if (!ingredient) {
            return res.status(404).json({ error: 'Ingredient not found' });
        }

        const { error } = await supabase
            .from('user_ingredients')
            .delete()
            .eq('user_id', userId)
            .eq('ingredient_id', ingredient.id);

        if (error) throw error;

        res.json({ message: 'Ingredient removed successfully' });
    } catch (error: any) {
        console.error('Error removing user ingredient:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
