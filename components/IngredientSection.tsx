
import React, { useState, useRef } from 'react';
import { Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { groupIngredients } from '../constants/ingredientGroups';

interface IngredientSectionProps {
    title: string;
    icon: string;
    items: any[];
    colorClass?: string; // e.g. "bg-green-100 text-green-700"
    selectedIngredients: string[];
    onToggle: (name: string) => void;
    onOpenAddModal: (category: string) => void;
    onOpenVariantModal: (group: any) => void;
    defaultExpanded?: boolean;
}

const IngredientSection: React.FC<IngredientSectionProps> = ({
    title,
    icon,
    items,
    colorClass = "bg-gray-100 text-gray-700",
    selectedIngredients,
    onToggle,
    onOpenAddModal,
    onOpenVariantModal,
    defaultExpanded = false
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    // Memoize grouping
    const groupedItems = React.useMemo(() => groupIngredients(items), [items]);

    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const isLongPress = useRef(false);

    const handleMouseDown = (group: any) => {
        if (isExpanded) return;
        isLongPress.current = false;
        longPressTimer.current = setTimeout(() => {
            isLongPress.current = true;
            onOpenVariantModal(group);
        }, 600);
    };

    const handleMouseUp = (group: any) => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }

        if (isLongPress.current) return; // Already handled by timer

        // Normal Click Logic
        if (!isExpanded) {
            // Collapsed Mode: Click Group Header
            if (group.isGroup) {
                // If any variant selected, deselect all. Else select primary.
                const anySelected = group.variants.some((v: any) => selectedIngredients.includes(v.name));
                if (anySelected) {
                    group.variants.forEach((v: any) => {
                        if (selectedIngredients.includes(v.name)) onToggle(v.name);
                    });
                } else {
                    onToggle(group.variants[0].name);
                }
            } else {
                onToggle(group.name);
            }
        }
    };

    const handleTouchStart = (group: any) => handleMouseDown(group);
    const handleTouchEnd = (group: any) => handleMouseUp(group);

    return (
        <div className="mb-6 bg-white/50 rounded-3xl p-4 border border-gray-100/50">
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{icon}</span>
                    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                </div>

                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs font-semibold text-gray-400 flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm hover:text-gray-600 active:scale-95 transition-all"
                >
                    {isExpanded ? '收起' : '展开'}
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
            </div>

            <div className="flex flex-wrap gap-2 justify-center transition-all duration-500 ease-in-out">
                {groupedItems.map((group: any) => {
                    // --- RENDER LOGIC ---

                    // 1. Expanded Cluster (Group Mode with Multiple Variants)
                    if (isExpanded && group.isGroup) {
                        return (
                            <div key={group.name} className={`flex flex-wrap gap-1.5 p-1.5 rounded-2xl border transition-all 
                                ${colorClass.replace('text-', 'border-').replace('700', '100')} 
                                ${colorClass.replace('text-', 'bg-').replace('700', '50/30')}`}>
                                {group.variants.map((variant: any) => (
                                    <button
                                        key={variant.name}
                                        onClick={() => onToggle(variant.name)}
                                        className={`relative flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border select-none
                                            ${selectedIngredients.includes(variant.name)
                                                ? 'bg-white border-orange-200 text-orange-600 shadow-sm font-bold'
                                                : 'bg-white/60 text-gray-500 border-transparent hover:bg-white'}`}
                                    >
                                        <span>{variant.icon}</span>
                                        {variant.name}
                                    </button>
                                ))}
                            </div>
                        );
                    }

                    // 2. Standard Chip (Collapsed OR Single Item)
                    const itemToRender = group; // Collapsed: Group Header. Expanded Single: Same object structure effectively.
                    const selectedCount = itemToRender.variants.filter((v: any) => selectedIngredients.includes(v.name)).length;
                    const isSelected = selectedCount > 0;

                    return (
                        <button
                            key={itemToRender.name}
                            onMouseDown={() => !isExpanded && handleMouseDown(itemToRender)}
                            onMouseUp={() => !isExpanded && handleMouseUp(itemToRender)}
                            onClick={() => isExpanded && onToggle(itemToRender.variants[0].name)} // Direct click if single item expanded
                            onTouchStart={() => !isExpanded && handleTouchStart(itemToRender)}
                            onTouchEnd={() => !isExpanded && handleTouchEnd(itemToRender)}
                            className={`relative flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all border select-none
                                ${isSelected
                                    ? `${colorClass} border-transparent shadow-sm scale-105`
                                    : 'bg-white text-gray-600 border-gray-200'}`}
                        >
                            <span>{itemToRender.icon}</span>
                            {itemToRender.name}

                            {/* Badge only in Collapsed + Group */}
                            {!isExpanded && itemToRender.isGroup && (
                                <span className="ml-1 text-[8px] opacity-70 bg-black/10 px-1.5 py-0.5 rounded-full font-bold">
                                    {selectedCount > 0 ? selectedCount : (itemToRender.variants.length > 1 ? '+' : '')}
                                </span>
                            )}
                        </button>
                    );
                })}

                <button
                    onClick={() => onOpenAddModal(title)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-orange-50 text-orange-400 border border-orange-100 border-dashed hover:bg-orange-100 transition-colors"
                >
                    <Plus size={16} />
                </button>
            </div>
        </div>
    );
};

export default IngredientSection;
