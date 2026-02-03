import React from 'react';
import { Heart, ChefHat, ShoppingCart, History } from 'lucide-react';

export type MenuOption = 'favorites' | 'cooking' | 'cart' | 'history';

interface MenuGridProps {
    onOptionClick: (option: MenuOption) => void;
}

const MenuGrid: React.FC<MenuGridProps> = ({ onOptionClick }) => {
    const menuItems = [
        {
            id: 'favorites' as MenuOption,
            label: '我的收藏',
            icon: Heart,
            color: 'text-red-500',
            bgColor: 'bg-red-50',
        },
        {
            id: 'cooking' as MenuOption,
            label: '我的烹饪',
            icon: ChefHat,
            color: 'text-orange-500',
            bgColor: 'bg-orange-50',
        },
        {
            id: 'cart' as MenuOption,
            label: '购物车',
            icon: ShoppingCart,
            color: 'text-green-500',
            bgColor: 'bg-green-50',
        },
        {
            id: 'history' as MenuOption,
            label: '浏览记录',
            icon: History,
            color: 'text-blue-500',
            bgColor: 'bg-blue-50',
        },
    ];

    return (
        <div className="px-4 py-2">
            <div className="grid grid-cols-2 gap-4">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onOptionClick(item.id)}
                            className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 active:scale-95 transition-all duration-200"
                        >
                            <div className={`w-12 h-12 rounded-full ${item.bgColor} flex items-center justify-center mb-3`}>
                                <Icon className={item.color} size={24} fill={item.id === 'favorites' ? 'currentColor' : 'none'} fillOpacity={item.id === 'favorites' ? 0.2 : 0} />
                            </div>
                            <span className="font-medium text-gray-800">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default MenuGrid;
