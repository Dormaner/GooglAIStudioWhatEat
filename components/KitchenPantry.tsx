
import React, { useState, useRef } from 'react';
import { X, Plus } from 'lucide-react';
import { deleteIngredient, addNewIngredient } from '../services/api'; // Import API functions
import AddIngredientModal from './AddIngredientModal';
import IngredientSection from './IngredientSection';
import VariantSelectionModal from './VariantSelectionModal';

interface KitchenPantryProps {
    isOpen: boolean;
    onClose: () => void;
    ingredients: any;
    selectedIngredients: string[];
    onToggleIngredient: (name: string) => void;
    onAddIngredient: (name: string, category: string, icon?: string) => void;
    onDeleteIngredient: (item: any) => void;
    onSearch: () => void;
}

const KitchenPantry: React.FC<KitchenPantryProps> = ({
    isOpen, onClose, ingredients, selectedIngredients, onToggleIngredient, onAddIngredient, onDeleteIngredient, onSearch
}) => {
    // State needed for Add Modal
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addCategory, setAddCategory] = useState<'condiment' | 'tool' | 'staple'>('condiment');

    // State needed for Variant Selection
    const [variantModalOpen, setVariantModalOpen] = useState(false);
    const [activeGroup, setActiveGroup] = useState<{ name: string, variants: any[] } | null>(null);

    // Edit Mode State
    const [isEditMode, setIsEditMode] = useState(false);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    const handleBackgroundTouchStart = () => {
        longPressTimer.current = setTimeout(() => {
            setIsEditMode(true);
        }, 800);
    };

    const handleBackgroundTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const handleBackgroundClick = () => {
        if (isEditMode) setIsEditMode(false);
    };

    const handleOpenAdd = (category: string) => {
        // Map display title back to internal category
        if (category === '主食') setAddCategory('staple');
        else if (category === '厨具设备') setAddCategory('tool');
        else setAddCategory('condiment');
        setIsAddModalOpen(true);
    };

    const openVariantModal = (group: any) => {
        setActiveGroup(group);
        setVariantModalOpen(true);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm" onClick={onClose} />
            <div
                className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 transition-transform duration-300 transform ${isOpen ? 'translate-y-0' : 'translate-y-full'} ${isEditMode ? 'bg-gray-50' : ''}`}
                onMouseDown={handleBackgroundTouchStart}
                onMouseUp={handleBackgroundTouchEnd}
                onClick={handleBackgroundClick}
                onTouchStart={handleBackgroundTouchStart}
                onTouchEnd={handleBackgroundTouchEnd}
            >
                <div className="p-5 max-h-[85vh] overflow-y-auto pb-24">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-extrabold text-gray-800">🧂 我的厨房库</h3>
                            {isEditMode && <span className="text-xs text-red-500 animate-pulse bg-red-50 px-2 py-0.5 rounded-full">编辑模式</span>}
                        </div>
                        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>

                    <IngredientSection
                        title="主食"
                        icon="🍚"
                        items={ingredients.staples}
                        colorClass="bg-amber-100 text-amber-700"
                        selectedIngredients={selectedIngredients}
                        onToggle={onToggleIngredient}
                        onOpenAddModal={handleOpenAdd}
                        onOpenVariantModal={openVariantModal}
                        isEditMode={isEditMode}
                        onDelete={onDeleteIngredient}
                    />

                    <IngredientSection
                        title="常用调料"
                        icon="🧂"
                        items={ingredients.condiments}
                        colorClass="bg-blue-100 text-blue-700"
                        selectedIngredients={selectedIngredients}
                        onToggle={onToggleIngredient}
                        onOpenAddModal={handleOpenAdd}
                        onOpenVariantModal={openVariantModal}
                        isEditMode={isEditMode}
                        onDelete={onDeleteIngredient}
                    />

                    <div className="border-t border-gray-100 my-4 pt-4">
                        <IngredientSection
                            title="厨具设备"
                            icon="🍳"
                            items={ingredients.kitchenware}
                            colorClass="bg-gray-100 text-gray-700"
                            selectedIngredients={selectedIngredients}
                            onToggle={onToggleIngredient}
                            onOpenAddModal={handleOpenAdd}
                            onOpenVariantModal={openVariantModal}
                            isEditMode={isEditMode}
                            onDelete={onDeleteIngredient}
                        />
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
                    setIsAddModalOpen(false); // Close first!
                    onAddIngredient(name, catName, icon);
                }}
                category={addCategory === 'condiment' ? '调料' : (addCategory === 'staple' ? '主食' : '厨具')}
            />

            <VariantSelectionModal
                isOpen={variantModalOpen}
                onClose={() => setVariantModalOpen(false)}
                group={activeGroup}
                selectedIngredients={selectedIngredients}
                onToggle={onToggleIngredient}
            />
        </>
    );
};

export default KitchenPantry;
