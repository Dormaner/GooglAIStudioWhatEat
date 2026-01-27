import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

interface AddIngredientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (name: string, icon?: string) => void;
    category: string;
}

const AddIngredientModal: React.FC<AddIngredientModalProps> = ({ isOpen, onClose, onConfirm, category }) => {
    const [name, setName] = useState('');
    const [customIcon, setCustomIcon] = useState('');

    if (!isOpen) return null;

    const categoryNameMap: Record<string, string> = {
        vegetable: '蔬菜',
        meat: '肉类',
        staple: '主食',
        condiment: '调料'
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onConfirm(name.trim(), customIcon || undefined);
            setName('');
            setCustomIcon('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800">添加新{categoryNameMap[category] || '食材'}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">食材名称</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="例如：秋葵"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            autoFocus
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">自定义图标 (可选)</label>
                        <input
                            type="text"
                            value={customIcon}
                            onChange={(e) => setCustomIcon(e.target.value)}
                            placeholder="输入 Emoji，如 🥬"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-500 hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Check size={18} />
                            添加
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddIngredientModal;
