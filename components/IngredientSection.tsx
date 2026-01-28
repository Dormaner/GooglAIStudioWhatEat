
import React, { useState, useRef, useEffect } from 'react';
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
    isEditMode?: boolean;
    onDelete?: (item: any) => void;
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
    // defaultExpanded prop is no longer needed but kept for interface compatibility or removed.
    // We can ignore it.
    isEditMode = false,
    onDelete
}) => {
    // Removed global isExpanded state. Always "Collapsed" (Chip Mode) by default, 
    // expanding specific groups via expandedSubGroups.
    const [expandedSubGroups, setExpandedSubGroups] = useState<Set<string>>(new Set());

    // Memoize grouping
    const groupedItems = React.useMemo(() => groupIngredients(items), [items]);

    // Default Expand All Groups
    useEffect(() => {
        const allGroupNames = new Set(
            groupedItems
                .filter((item: any) => item.isGroup)
                .map((item: any) => item.name)
        );
        setExpandedSubGroups(allGroupNames);
    }, [groupedItems]);

    const toggleSubGroup = (groupName: string) => {
        setExpandedSubGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupName)) {
                next.delete(groupName);
            } else {
                next.add(groupName);
            }
            return next;
        });
    };

    return (
        <div className="mb-6 bg-white/50 rounded-3xl p-4 border border-gray-100/50">
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{icon}</span>
                    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                </div>
                {/* Global Toggle Button Removed */}
            </div>

            <div className={`flex flex-wrap gap-2 justify-center transition-all duration-500 ease-in-out ${isEditMode ? 'animate-pulse' : ''}`}>
                {groupedItems.map((group: any) => {
                    // Logic:
                    // 1. Group is Expanded Individually AND isGroup -> Render Cluster
                    // 2. Else -> Render Chip

                    const showAsCluster = group.isGroup && expandedSubGroups.has(group.name);

                    // DELETE BADGE HELPER
                    const DeleteBadge = ({ item, onClick }: { item: any, onClick: (e: any) => void }) => (
                        isEditMode ? (
                            <div
                                onClick={(e) => { e.stopPropagation(); onClick(e); }}
                                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-400 text-white rounded-full flex items-center justify-center shadow-sm z-10 animate-in zoom-in cursor-pointer hover:bg-red-500 hover:scale-110 transition-all"
                            >
                                <span className="text-[10px] font-bold leading-none mb-0.5">-</span>
                            </div>
                        ) : null
                    );

                    if (showAsCluster && group.isGroup) {
                        // CLUSTER VIEW - OPTIMIZED COMPACT LAYOUT
                        return (
                            <div key={group.name} className={`flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl border transition-all animate-in fade-in zoom-in-95 duration-200
                                ${colorClass.replace('text-', 'border-').replace('700', '100')} 
                                ${colorClass.replace('text-', 'bg-').replace('700', '50/30')}`}>

                                {/* Header (Click to Collapse) - Now Inline Tag Style */}
                                <div
                                    onClick={() => toggleSubGroup(group.name)}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold cursor-pointer hover:opacity-80 transition-all select-none
                                       ${colorClass.replace('text-', 'bg-').replace('700', '100')} ${colorClass}`}
                                >
                                    <span>{group.icon || '📦'}</span>
                                    <span>{group.name}</span>
                                    {/* Small Divider Arrow */}
                                    <span className="opacity-30">|</span>
                                </div>

                                {/* Variants Inline */}
                                {group.variants.map((variant: any) => (
                                    <button
                                        key={variant.name}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (!isEditMode) onToggle(variant.name);
                                        }}
                                        className={`relative flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-all border select-none
                                            ${selectedIngredients.includes(variant.name)
                                                ? 'bg-white border-orange-200 text-orange-600 shadow-sm font-bold scale-105'
                                                : 'bg-white/60 text-gray-500 border-transparent hover:bg-white'}
                                            ${isEditMode ? 'ring-2 ring-red-100 ring-offset-1 animate-shakex' : ''}`}
                                    >
                                        <DeleteBadge item={variant} onClick={() => onDelete && onDelete(variant)} />
                                        <span>{variant.icon}</span>
                                        {variant.name}
                                    </button>
                                ))}
                            </div>
                        );
                    }

                    // STANDARD CHIP VIEW
                    const itemToRender = group;
                    const selectedCount = itemToRender.variants.filter((v: any) => selectedIngredients.includes(v.name)).length;
                    const isSelected = selectedCount > 0;

                    return (
                        <button
                            key={itemToRender.name}
                            onClick={() => {
                                if (isEditMode) return;

                                if (itemToRender.isGroup) {
                                    // Click Group -> Expand Inline
                                    toggleSubGroup(itemToRender.name);
                                } else {
                                    // Click Single Item -> Toggle Selection
                                    onToggle(itemToRender.variants[0].name);
                                }
                            }}
                            className={`relative flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all border select-none
                                ${isSelected
                                    ? `${colorClass} border-transparent shadow-sm scale-105`
                                    : 'bg-white text-gray-600 border-gray-200'}
                                ${isEditMode ? 'ring-2 ring-red-100 ring-offset-1 animate-shakex' : ''}`}
                        >
                            {/* Standard Delete Badge */}
                            {!itemToRender.isGroup && <DeleteBadge item={itemToRender.variants[0]} onClick={() => onDelete && onDelete(itemToRender.variants[0])} />}

                            <span>{itemToRender.icon}</span>
                            {itemToRender.name}

                            {/* Badge */}
                            {itemToRender.isGroup && (
                                <span className={`ml-1 text-[8px] opacity-70 px-1.5 py-0.5 rounded-full font-bold flex items-center ${isSelected ? 'bg-black/10' : 'bg-gray-100'}`}>
                                    {selectedCount > 0 ? selectedCount : <ChevronDown size={8} />}
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
