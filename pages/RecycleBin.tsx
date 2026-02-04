import React, { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Clock, Trash2 } from 'lucide-react';
import { fetchRecycleBin, restoreRecipe } from '../services/api';
import { Recipe } from '../types';

interface RecycleBinProps {
    onBack: () => void;
}

const RecycleBin: React.FC<RecycleBinProps> = ({ onBack }) => {
    const [deletedRecipes, setDeletedRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDeletedRecipes();
        // Auto-refresh to reflect auto-cleanup
        const interval = setInterval(loadDeletedRecipes, 10000);
        return () => clearInterval(interval);
    }, []);

    const loadDeletedRecipes = async () => {
        try {
            const data = await fetchRecycleBin();
            setDeletedRecipes(data || []);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load recycle bin', error);
            setLoading(false);
        }
    };

    const handleRestore = async (id: string) => {
        try {
            await restoreRecipe(id);
            setDeletedRecipes(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error('Failed to restore recipe', error);
        }
    };

    // Calculate time remaining (assuming 1 minute TTL)
    const getTimeRemaining = (deletedAt?: string) => {
        if (!deletedAt) return '即将删除';
        const deleteTime = new Date(deletedAt).getTime();
        const expirationTime = deleteTime + 60 * 1000;
        const now = Date.now();
        const diff = Math.max(0, Math.ceil((expirationTime - now) / 1000));
        return diff > 0 ? `${diff}秒后彻底删除` : '正在删除...';
    };

    // Force re-render for timer countdown if needed, but simple display is fine.

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="flex items-center px-4 py-3 bg-white shadow-sm shrink-0">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="ml-2 text-lg font-bold text-gray-800">菜谱回收站</h1>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                    <div className="text-center py-10 text-gray-400">加载中...</div>
                ) : deletedRecipes.length > 0 ? (
                    deletedRecipes.map(recipe => (
                        <div key={recipe.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-3">
                            <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-gray-100 relative">
                                <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/image?url=${encodeURIComponent(recipe.image || '')}`} alt={recipe.name} className="w-full h-full object-cover opacity-60 grayscale" />
                            </div>
                            <div className="flex-1 flex flex-col justify-between py-0.5">
                                <div>
                                    <h3 className="font-bold text-gray-800 line-clamp-1">{recipe.name}</h3>
                                    <div className="flex items-center gap-1 mt-1 text-xs text-orange-500">
                                        <Clock size={12} />
                                        <span>{getTimeRemaining(recipe.deletedAt)}</span>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        onClick={() => handleRestore(recipe.id)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold hover:bg-blue-100 transition-colors"
                                    >
                                        <RotateCcw size={14} />
                                        恢复
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
                        <Trash2 size={48} className="opacity-20" />
                        <p>回收站是空的</p>
                    </div>
                )}

                <div className="text-center text-xs text-gray-400 mt-4 px-4">
                    注意：放入回收站的菜谱将在 1 分钟后自动彻底删除，无法恢复。
                </div>
            </div>
        </div>
    );
};

export default RecycleBin;
