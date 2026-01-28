
import React from 'react';
import { X, Check } from 'lucide-react';

interface VariantSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    group: { name: string, icon: string, variants: any[] } | null;
    selectedIngredients: string[];
    onToggle: (name: string) => void;
}

const VariantSelectionModal: React.FC<VariantSelectionModalProps> = ({
    isOpen, onClose, group, selectedIngredients, onToggle
}) => {
    if (!isOpen || !group) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <span>{group.icon}</span>
                        选择{group.name}
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <X size={16} className="text-gray-400" />
                    </button>
                </div>
                <div className="p-4 grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
                    {group.variants.map((variant: any) => (
                        <button
                            key={variant.name}
                            onClick={() => onToggle(variant.name)}
                            className={`flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-all border text-left
                                ${selectedIngredients.includes(variant.name)
                                    ? 'bg-orange-50 border-orange-200 text-orange-700 shadow-sm'
                                    : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'}`}
                        >
                            <span>{variant.icon}</span>
                            <span className="truncate">{variant.name}</span>
                            {selectedIngredients.includes(variant.name) && <Check size={14} className="ml-auto" />}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default VariantSelectionModal;
