import React, { useState, useEffect } from 'react';
import ProfileHeader from '../components/me/ProfileHeader';
import MenuGrid, { MenuOption } from '../components/me/MenuGrid';
import LoginView from '../components/auth/LoginView';
import Settings from './Settings';
import MyFavorites from './MyFavorites';
import MyCooking from './MyCooking';
import BrowsingHistory from './BrowsingHistory';
import ShoppingCart from './ShoppingCart';
import { supabase } from '../config/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Recipe } from '../types';

interface MeProps {
    onRecipeClick?: (recipe: Recipe) => void;
}

const Me: React.FC<MeProps> = ({ onRecipeClick = () => { } }) => {
    const [view, setView] = useState<MenuOption | 'home' | 'login' | 'settings'>('home');
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLoginClick = () => {
        setView('login');
    };

    const handleLoginSuccess = () => {
        setView('home');
    };

    const handleMenuClick = (option: MenuOption) => {
        if (!user && option !== 'settings') { // Settings usually accessible, but features require login
            if (option === 'favorites' || option === 'cooking' || option === 'cart' || option === 'history') {
                // Potentially require login for these
                // For now let's allow clicking but pages might show "Please login"
                // Or we redirect to login
                // Let's redirect to login for "My" features if not logged in
                setView('login');
                return;
            }
        }
        setView(option);
    };

    if (!mounted) return null;

    // Render Sub-pages overlaying the main content
    if (view === 'login') {
        return <div className="absolute inset-0 z-10 bg-white"><LoginView onBack={() => setView('home')} onLoginSuccess={handleLoginSuccess} /></div>;
    }

    if (view === 'settings') {
        return <div className="absolute inset-0 z-10 bg-white"><Settings onBack={() => setView('home')} onLogout={() => setUser(null)} /></div>;
    }

    if (view === 'favorites') {
        return <div className="absolute inset-0 z-10 bg-white"><MyFavorites onBack={() => setView('home')} onRecipeClick={onRecipeClick} /></div>;
    }

    if (view === 'cooking') {
        return <div className="absolute inset-0 z-10 bg-white"><MyCooking onBack={() => setView('home')} onRecipeClick={onRecipeClick} /></div>;
    }

    if (view === 'history') {
        return <div className="absolute inset-0 z-10 bg-white"><BrowsingHistory onBack={() => setView('home')} onRecipeClick={onRecipeClick} /></div>;
    }

    if (view === 'cart') {
        // Creating placeholder until ShoppingCart is implemented
        return <div className="absolute inset-0 z-10 bg-white"><ShoppingCart onBack={() => setView('home')} /></div>;
    }

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <ProfileHeader
                isLoggedIn={!!user}
                username={user?.email?.split('@')[0] || '用户'}
                avatarUrl={user?.user_metadata?.avatar_url}
                onLoginClick={handleLoginClick}
                onSettingsClick={() => setView('settings')}
            />

            <div className="flex-1 mt-2">
                <MenuGrid onOptionClick={handleMenuClick} />
            </div>
        </div>
    );
};

export default Me;
