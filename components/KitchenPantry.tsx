
import React, { useState } from 'react';
import { X, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import AddIngredientModal from './AddIngredientModal';

interface KitchenPantryProps {
    isOpen: boolean;
    onClose: () => void;
    ingredients: any;
    selectedIngredients: string[];
    onToggleIngredient: (name: string) => void;
    onAddIngredient: (name: string, category: string, icon?: string) => void;
    onSearch: () => void;
}

const KitchenPantry: React.FC<KitchenPantryProps> = ({
    isOpen, onClose, ingredients, selectedIngredients, onToggleIngredient, onAddIngredient, onSearch
}) => {
    const [showKitchenware, setShowKitchenware] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addCategory, setAddCategory] = useState<'condiment' | 'tool' | 'staple'>('condiment');

    if (!isOpen) return null;

    const handleOpenAdd = (category: 'condiment' | 'tool' | 'staple') => {
        setAddCategory(category);
        setIsAddModalOpen(true);
    };

    const IngredientGroup = ({ title, items, category }: { title: string, items: any[], category: 'condiment' | 'tool' | 'staple' }) => (
        <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-gray-700">{title}</h4>
                <button
                    onClick={() => handleOpenAdd(category)}
                    className="text-xs text-blue-500 flex items-center gap-1 font-medium bg-blue-50 px-2 py-1 rounded-full"
                >
                    <Plus size={12} /> 自定义
                </button>
            </div>
            <div className="flex flex-wrap gap-2">
                {items.map((item: any) => (
                    <button
                        key={item.name}
                        onClick={() => onToggleIngredient(item.name)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all border
              ${selectedIngredients.includes(item.name)
                                ? 'bg-orange-100 text-orange-700 border-transparent shadow-sm'
                                : 'bg-gray-50 text-gray-600 border-gray-100'}`}
                    >
                        <span>{item.icon}</span>
                        {item.name}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <>
            <div className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm" onClick={onClose} />
            <div className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 transition-transform duration-300 transform ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="p-5 max-h-[85vh] overflow-y-auto pb-24">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-extrabold text-gray-800">🧂 我的厨房库</h3>
                        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>

                    <IngredientGroup title="主食" items={ingredients.staples} category="staple" />
                    <IngredientGroup title="常用调料" items={ingredients.condiments} category="condiment" />

                    <div className="border-t border-gray-100 my-4 pt-4">
                        <IngredientGroup title="厨具设备" items={ingredients.kitchenware} category="tool" />
                    </div>
                </div>

                {/* Fixed Search Button Area */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex gap-3">
                    <button
                        onClick={() => {
                            onClose();
                            onSearch();
                        }}
                        className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 rounded-full shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                    >
                        <span>🍳</span> 开始觅食
                    </button>
                </div>
            </div>

            <AddIngredientModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onConfirm={(name, icon) => {
                    let catName = '调料';
                    if (addCategory === 'staple') catName = '主食';
                    if (addCategory === 'tool') catName = '厨具';
                    onAddIngredient(name, catName, icon);
                    setIsAddModalOpen(false);
                }}
                category={addCategory === 'condiment' ? '调料' : (addCategory === 'staple' ? '主食' : '厨具')}
            />
        </>
    );
};

export default KitchenPantry;
