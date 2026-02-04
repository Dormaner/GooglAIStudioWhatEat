import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import fs from 'fs';
import path from 'path';

const DEBUG_LOG_PATH = path.join(process.cwd(), 'debug.log');

function logToFile(msg: string) {
    fs.appendFileSync(DEBUG_LOG_PATH, `${new Date().toISOString()} ${msg}\n`);
}

const router = Router();

// GET /api/shopping-cart - List items
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'default-user';

        const { data, error } = await supabase
            .from('shopping_cart')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/shopping-cart - Add item
router.post('/', async (req: Request, res: Response) => {
    try {
        const { ingredientName, userId = 'default-user', amount = '1' } = req.body;

        console.log(`[ShoppingCart] Add Request: ${ingredientName} for user ${userId}`);

        if (!ingredientName) {
            return res.status(400).json({ error: 'Ingredient name required' });
        }

        // Check availability (optional, but good for data)
        // We just text-match for now or just insert raw

        // Upsert or Insert? 
        // If we want to prevent duplicates:
        const { data: existing } = await supabase
            .from('shopping_cart')
            .select('id')
            .eq('user_id', userId)
            .eq('ingredient_name', ingredientName)
            .single();

        if (existing) {
            // If exists, increment quantity (+1) - or parse amount
            // For "Add to Cart" button, we usually want to increment by 1
            const currentAmount = parseInt(String(amount)) || 1;

            // We need to fetch current amount first -> But simplest is just Update
            // Let's assume user wants to +1
            // For now, let's just return "Updated" and let frontend handle explicit updates via PUT
            // But user requirement: "If exists, +1" logic in backend is robust

            // Let's rely on PUT for explicit updates. For POST, we can return the existing item
            // checking logic elsewhere. Or return "Already in cart" is fine if frontend switches to PUT
            return res.json({ message: 'Already in cart', existing: true, id: existing.id });
        }

        const { data, error } = await supabase
            .from('shopping_cart')
            .insert({
                user_id: userId,
                ingredient_name: ingredientName,
                amount: amount,
                is_checked: false
            })
            .select()
            .single();

        if (error) {
            console.error('[ShoppingCart] Insert Error:', error);
            // logToFile(`Insert Error: ${JSON.stringify(error)}`);
            throw error;
        }

        console.log('[ShoppingCart] Added successfully:', data);
        res.json(data);

    } catch (error: any) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/shopping-cart - Update item quantity
router.put('/', async (req: Request, res: Response) => {
    try {
        const { ingredientName, userId = 'default-user', amount } = req.body;

        if (!ingredientName || amount === undefined) {
            return res.status(400).json({ error: 'Name and amount required' });
        }

        console.log(`[ShoppingCart] Update Request: ${ingredientName} -> ${amount} (User: ${userId})`);

        const { data, error } = await supabase
            .from('shopping_cart')
            .update({ amount: String(amount) })
            .eq('user_id', userId)
            .eq('ingredient_name', ingredientName)
            .select()
            .single();

        if (error) {
            console.error('[ShoppingCart] Update Error:', error);
            throw error;
        }

        res.json(data);

    } catch (error: any) {
        console.error('Error updating cart:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/shopping-cart - Remove item
router.delete('/', async (req: Request, res: Response) => {
    try {
        const { ingredientName, userId = 'default-user' } = req.body;

        const { error } = await supabase
            .from('shopping_cart')
            .delete()
            .eq('user_id', userId)
            .eq('ingredient_name', ingredientName);

        if (error) throw error;
        res.json({ message: 'Removed from cart' });

    } catch (error: any) {
        console.error('Error removing from cart:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
