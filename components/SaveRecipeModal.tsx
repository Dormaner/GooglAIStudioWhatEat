import React, { useState } from 'react';
import { X, Loader2, Link as LinkIcon, CheckCircle2, AlertCircle } from 'lucide-react';

interface SaveRecipeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (recipe: any) => void;
}

type Platform = 'bilibili' | 'douyin' | 'xiaohongshu' | 'unknown';
type ParseStatus = 'idle' | 'parsing' | 'success' | 'error';

const SaveRecipeModal: React.FC<SaveRecipeModalProps> = ({ isOpen, onClose, onSave }) => {
    const [url, setUrl] = useState('');
    const [platform, setPlatform] = useState<Platform>('unknown');
    const [parseStatus, setParseStatus] = useState<ParseStatus>('idle');
    const [parsedRecipe, setParsedRecipe] = useState<any>(null);
    const [errorMessage, setErrorMessage] = useState('');

    // Detect platform from URL
    const detectPlatform = (inputUrl: string): Platform => {
        if (inputUrl.includes('bilibili.com') || inputUrl.includes('b23.tv')) return 'bilibili';
        if (inputUrl.includes('douyin.com') || inputUrl.includes('v.douyin.com')) return 'douyin';
        if (inputUrl.includes('xiaohongshu.com') || inputUrl.includes('xhslink.com')) return 'xiaohongshu';
        return 'unknown';
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputUrl = e.target.value;
        setUrl(inputUrl);
        setPlatform(detectPlatform(inputUrl));
    };

    const handleParse = async () => {
        if (!url.trim()) {
            setErrorMessage('请输入链接');
            return;
        }

        if (platform === 'unknown') {
            setErrorMessage('暂不支持该平台,请使用Bilibili、抖音或小红书链接');
            return;
        }

        setParseStatus('parsing');
        setErrorMessage('');

        try {
            const { parseRecipeFromUrl } = await import('../services/api');

            // Get user ID
            const { supabase } = await import('../config/supabase');
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || 'default-user';

            const result = await parseRecipeFromUrl(url, userId);

            setParsedRecipe(result);
            setParseStatus('success');
        } catch (error: any) {
            console.error('Parse error:', error);
            setErrorMessage(error.message || 'AI解析失败,请重试');
            setParseStatus('error');
        }
    };

    const handleSaveRecipe = async () => {
        if (!parsedRecipe) return;

        try {
            await onSave(parsedRecipe);
            handleClose();
        } catch (error) {
            setErrorMessage('保存失败,请重试');
        }
    };

    const handleClose = () => {
        setUrl('');
        setPlatform('unknown');
        setParseStatus('idle');
        setParsedRecipe(null);
        setErrorMessage('');
        onClose();
    };

    if (!isOpen) return null;

    const getPlatformName = () => {
        switch (platform) {
            case 'bilibili': return 'Bilibili';
            case 'douyin': return '抖音';
            case 'xiaohongshu': return '小红书';
            default: return '未知平台';
        }
    };

    const getPlatformColor = () => {
        switch (platform) {
            case 'bilibili': return 'text-pink-500 bg-pink-50';
            case 'douyin': return 'text-black bg-gray-100';
            case 'xiaohongshu': return 'text-red-500 bg-red-50';
            default: return 'text-gray-400 bg-gray-50';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">存新菜</h2>
                    <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={24} className="text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* URL Input */}
                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-700">
                            粘贴视频或图文链接
                        </label>
                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                value={url}
                                onChange={handleUrlChange}
                                placeholder="支持 Bilibili、抖音、小红书..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={parseStatus === 'parsing'}
                            />
                        </div>

                        {/* Platform Badge */}
                        {platform !== 'unknown' && (
                            <div className="flex items-center gap-2">
                                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getPlatformColor()}`}>
                                    {getPlatformName()}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Error Message */}
                    {errorMessage && (
                        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl">
                            <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
                            <p className="text-sm text-red-700">{errorMessage}</p>
                        </div>
                    )}

                    {/* Parsing Status */}
                    {parseStatus === 'parsing' && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Loader2 className="animate-spin text-blue-500" size={48} />
                            <div className="text-center">
                                <p className="font-bold text-lg text-gray-800">AI 正在深度解析视频...</p>
                                <p className="text-sm text-gray-500 mt-1">这可能需要 30-60 秒,请耐心等待</p>
                                <div className="mt-4 space-y-2 text-xs text-gray-400">
                                    <p>🎥 下载视频流...</p>
                                    <p>🧠 Gemini 视觉分析中...</p>
                                    <p>📸 提取关键步骤截图...</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Preview */}
                    {parseStatus === 'success' && parsedRecipe && (
                        <div className="space-y-4 border border-green-200 rounded-xl p-6 bg-green-50/30">
                            <div className="flex items-center gap-2 text-green-600 mb-4">
                                <CheckCircle2 size={20} />
                                <span className="font-semibold">解析成功!</span>
                            </div>

                            {/* Recipe Name */}
                            <div>
                                <label className="text-xs text-gray-500 font-semibold">菜名</label>
                                <p className="text-lg font-bold text-gray-800 mt-1">{parsedRecipe.name}</p>
                            </div>

                            {/* Ingredients */}
                            <div>
                                <label className="text-xs text-gray-500 font-semibold">食材</label>
                                <div className="mt-2 space-y-2">
                                    {parsedRecipe.ingredients?.main?.length > 0 && (
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700">主料:</p>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {parsedRecipe.ingredients.main.map((ing: any, idx: number) => (
                                                    <span key={idx} className="text-xs bg-white px-3 py-1 rounded-full border border-gray-200">
                                                        {ing.name} {ing.amount}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {parsedRecipe.ingredients?.condiments?.length > 0 && (
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700">调料:</p>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {parsedRecipe.ingredients.condiments.map((ing: any, idx: number) => (
                                                    <span key={idx} className="text-xs bg-white px-3 py-1 rounded-full border border-gray-200">
                                                        {ing.name} {ing.amount}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Steps Preview */}
                            <div>
                                <label className="text-xs text-gray-500 font-semibold">步骤 ({parsedRecipe.steps?.length || 0})</label>
                                <div className="mt-2 space-y-3 max-h-80 overflow-y-auto">
                                    {parsedRecipe.steps?.map((step: any, idx: number) => (
                                        <div key={idx} className="flex gap-3 text-sm bg-white p-3 rounded-lg border border-gray-200">
                                            {/* Step Image Preview */}
                                            {step.image && (
                                                <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                                                    <img src={`${import.meta.env.VITE_API_URL}/api/image?url=${encodeURIComponent(step.image)}`} className="w-full h-full object-cover" alt={`Step ${idx + 1}`} />
                                                </div>
                                            )}
                                            <div>
                                                <span className="font-semibold text-gray-700 block mb-1">步骤 {idx + 1}: {step.title}</span>
                                                <p className="text-gray-600 text-xs leading-relaxed">{step.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        {parseStatus === 'idle' || parseStatus === 'error' ? (
                            <>
                                <button
                                    onClick={handleClose}
                                    className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleParse}
                                    disabled={!url.trim() || platform === 'unknown'}
                                    className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    开始解析
                                </button>
                            </>
                        ) : parseStatus === 'success' ? (
                            <>
                                <button
                                    onClick={handleClose}
                                    className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleSaveRecipe}
                                    className="flex-1 px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors"
                                >
                                    保存菜谱
                                </button>
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SaveRecipeModal;
