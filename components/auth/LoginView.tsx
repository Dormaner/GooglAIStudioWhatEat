import React, { useState } from 'react';
import { supabase } from '../../config/supabase';
import { ChevronLeft, Loader2 } from 'lucide-react';

interface LoginViewProps {
    onBack: () => void;
    onLoginSuccess: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onBack, onLoginSuccess }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isRegistering) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                // In a real app we might need to verify email, but for now assume detailed flow or auto-login
                // Supabase often logs in after signup if email confirm is off, or sends email.
                // We'll show a message if needed, but for now let's try to sign in or just notify.
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (signInError) {
                    // If sign in fails after sign up (e.g. email confirmation needed), let them know
                    if (signInError.message.includes('Email not confirmed')) {
                        setError('请检查您的邮箱确认注册');
                        setLoading(false);
                        return;
                    }
                    throw signInError;
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
            onLoginSuccess();
        } catch (err: any) {
            setError(err.message || '发生错误，请重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300">
            <div className="flex items-center px-4 h-14 border-b border-gray-100">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-600">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-lg font-bold text-gray-800 flex-1 text-center pr-10">
                    {isRegistering ? '注册' : '登录'}
                </h1>
            </div>

            <div className="p-6">
                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">WhatEat</h2>
                    <p className="text-gray-500">登录以同步您的收藏和记录</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            placeholder="your@email.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-500 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center disabled:opacity-70"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            isRegistering ? '注册账号' : '立即登录'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => {
                            setIsRegistering(!isRegistering);
                            setError(null);
                        }}
                        className="text-sm text-gray-600 hover:text-orange-500 font-medium"
                    >
                        {isRegistering ? '已有账号？去登录' : '没有账号？去注册'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginView;
