
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
    const [expandedSubGroups, setExpandedSubGroups] = useState<Set<string>>(new Set());

    // Memoize grouping
    const groupedItems = React.useMemo(() => groupIngredients(items), [items]);

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
                    // Logic:
                    // 1. If Section Expanded OR (Group is Expanded Individually AND isGroup) -> Render Cluster
                    // 2. Else -> Render Chip

                    const showAsCluster = isExpanded || (group.isGroup && expandedSubGroups.has(group.name));

                    if (showAsCluster && group.isGroup) {
                        // CLUSTER VIEW
                        return (
                            <div key={group.name} className={`flex flex-col gap-2 p-2 rounded-2xl border transition-all animate-in fade-in zoom-in-95 duration-200
                                ${colorClass.replace('text-', 'border-').replace('700', '100')} 
                                ${colorClass.replace('text-', 'bg-').replace('700', '50/30')}`}>

                                {/* Header (Click to Collapse if supported) */}
                                <div
                                    onClick={() => !isExpanded && toggleSubGroup(group.name)}
                                    className={`flex items-center justify-between px-1 ${!isExpanded ? 'cursor-pointer hover:opacity-70' : ''}`}
                                >
                                    <div className="flex items-center gap-1 text-xs font-bold opacity-70">
                                        <span>{group.icon}</span>
                                        <span>{group.name}</span>
                                    </div>
                                    {!isExpanded && <ChevronUp size={12} className="opacity-50" />}
                                </div>

                                <div className="flex flex-wrap gap-1.5">
                                    {group.variants.map((variant: any) => (
                                        <button
                                            key={variant.name}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggle(variant.name);
                                            }}
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
                                    : 'bg-white text-gray-600 border-gray-200'}`}
                        >
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
