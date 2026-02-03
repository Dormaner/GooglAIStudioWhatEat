import React, { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { ChevronLeft, Loader2, Trash2 } from 'lucide-react';

interface ShoppingCartProps {
    onBack: () => void;
}

interface CartItem {
    id: string;
    ingredient_name: string;
    amount: string;
    is_checked: boolean;
}

const ShoppingCart: React.FC<ShoppingCartProps> = ({ onBack }) => {
    const [items, setItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCart();
    }, []);

    const loadCart = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('shopping_cart')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setItems(data);
        }
        setLoading(false);
    };

    const toggleCheck = async (id: string, currentStatus: boolean) => {
        // Optimistic update
        setItems(prev => prev.map(item => item.id === id ? { ...item, is_checked: !currentStatus } : item));

        await supabase
            .from('shopping_cart')
            .update({ is_checked: !currentStatus })
            .eq('id', id);
    };

    const deleteItem = async (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
        await supabase
            .from('shopping_cart')
            .delete()
            .eq('id', id);
    };

    const [newItemName, setNewItemName] = useState('');
    const addItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim()) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('shopping_cart')
            .insert({
                user_id: user.id,
                ingredient_name: newItemName.trim(),
                is_checked: false
            })
            .select()
            .single();

        if (data) {
            setItems(prev => [data, ...prev]);
            setNewItemName('');
        }
    };


    return (
        <div className="flex flex-col h-full bg-gray-50 animate-in slide-in-from-right duration-300">
            <div className="flex items-center px-4 h-14 bg-white border-b border-gray-100">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-600">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-lg font-bold text-gray-800 flex-1 text-center pr-10">
                    购物车
                </h1>
            </div>

            <form onSubmit={addItem} className="p-4 bg-white border-b border-gray-100 flex gap-2">
                <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="添加购买项..."
                    className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
                />
                <button
                    type="submit"
                    disabled={!newItemName.trim()}
                    className="bg-orange-500 text-white px-4 py-2 rounded-xl font-bold disabled:opacity-50"
                >
                    添加
                </button>
            </form>

            {loading ? (
                <div className="flex items-center justify-center flex-1">
                    <Loader2 className="animate-spin text-orange-500" />
                </div>
            ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
                    <p>购物车是空的</p>
                </div>
            ) : (
                <div className="p-4 space-y-3 overflow-y-auto pb-20">
                    {items.map(item => (
                        <div key={item.id} className="flex items-center bg-white p-4 rounded-xl shadow-sm">
                            <input
                                type="checkbox"
                                checked={item.is_checked}
                                onChange={() => toggleCheck(item.id, item.is_checked)}
                                className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500 border-gray-300"
                            />
                            <div className={`ml-3 flex-1 ${item.is_checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                <span className="font-medium">{item.ingredient_name}</span>
                                {item.amount && <span className="text-sm text-gray-500 ml-2">x {item.amount}</span>}
                            </div>
                            <button onClick={() => deleteItem(item.id)} className="text-gray-400 hover:text-red-500 p-2">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ShoppingCart;
