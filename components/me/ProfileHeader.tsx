import React from 'react';
import { User, ChevronRight, Settings } from 'lucide-react';

interface ProfileHeaderProps {
    isLoggedIn: boolean;
    username?: string;
    avatarUrl?: string;
    onLoginClick: () => void;
    onSettingsClick: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
    isLoggedIn,
    username,
    avatarUrl,
    onLoginClick,
    onSettingsClick,
}) => {
    return (
        <div className="bg-white p-6 pt-10 pb-8 flex items-center justify-between">
            <div className="flex items-center space-x-4" onClick={!isLoggedIn ? onLoginClick : undefined}>
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <User className="text-gray-400" size={32} />
                    )}
                </div>

                <div className="flex flex-col">
                    {isLoggedIn ? (
                        <h2 className="text-xl font-bold text-gray-800">{username}</h2>
                    ) : (
                        <div className="flex items-center cursor-pointer group">
                            <h2 className="text-xl font-bold text-gray-800 group-hover:text-orange-500 transition-colors">点击登录/注册</h2>
                            <ChevronRight className="text-gray-400 ml-1 group-hover:translate-x-1 transition-transform" size={20} />
                        </div>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                        {isLoggedIn ? '让烹饪更简单' : '登录后体验更多功能'}
                    </p>
                </div>
            </div>

            <button
                onClick={onSettingsClick}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                aria-label="Settings"
            >
                <Settings size={24} />
            </button>
        </div>
    );
};

export default ProfileHeader;
