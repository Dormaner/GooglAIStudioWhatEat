import React from 'react';
import { ChevronLeft, User, HelpCircle, FileText, LogOut } from 'lucide-react';
import { supabase } from '../config/supabase';

interface SettingsProps {
    onBack: () => void;
    onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onBack, onLogout }) => {
    const handleLogout = async () => {
        await supabase.auth.signOut();
        onLogout();
        onBack();
    };

    const menuItems = [
        { label: '个人资料', icon: User, onClick: () => console.log('Profile clicked') },
        { label: '帮助与反馈', icon: HelpCircle, onClick: () => console.log('Help clicked') },
        { label: '用户协议', icon: FileText, onClick: () => console.log('Agreement clicked') },
    ];

    return (
        <div className="flex flex-col h-full bg-gray-50 animate-in slide-in-from-right duration-300">
            <div className="bg-white flex items-center px-4 h-14 border-b border-gray-100 sticky top-0 z-10">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-600">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-lg font-bold text-gray-800 flex-1 text-center pr-10">
                    设置
                </h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {menuItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={index}
                                onClick={item.onClick}
                                className={`w-full flex items-center p-4 text-left hover:bg-gray-50 transition-colors ${index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
                                    }`}
                            >
                                <Icon size={20} className="text-gray-500 mr-3" />
                                <span className="text-gray-700 font-medium flex-1">{item.label}</span>
                                <ChevronLeft size={16} className="text-gray-300 rotate-180" />
                            </button>
                        );
                    })}
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full bg-white p-4 rounded-xl shadow-sm text-red-500 font-medium flex items-center justify-center hover:bg-red-50 transition-colors"
                >
                    <LogOut size={20} className="mr-2" />
                    退出登录
                </button>
            </div>
        </div>
    );
};

export default Settings;
