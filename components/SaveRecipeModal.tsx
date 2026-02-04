import React, { useState } from 'react';
import { X, Loader2, Link as LinkIcon, CheckCircle2, AlertCircle } from 'lucide-react';

interface SaveRecipeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (recipe: any) => void;
    parsingTasks?: Array<{
        id: string;
        url: string;
        status: 'parsing' | 'success' | 'error';
        progress: string;
        result?: any;
        error?: string;
    }>;
    setParsingTasks?: (tasks: any) => void;
    editingTaskId?: string | null;
    startParsingTask?: (url: string) => Promise<void>;
}

type Platform = 'bilibili' | 'douyin' | 'xiaohongshu' | 'unknown';
type ParseStatus = 'idle' | 'parsing' | 'success' | 'error';

const SaveRecipeModal: React.FC<SaveRecipeModalProps> = ({
    isOpen,
    onClose,
    onSave,
    parsingTasks,
    setParsingTasks,
    editingTaskId,
    startParsingTask
}) => {
    const [url, setUrl] = useState('');
    const [platform, setPlatform] = useState<Platform>('unknown');
    const [parseStatus, setParseStatus] = useState<ParseStatus>('idle');
    const [parsedRecipe, setParsedRecipe] = useState<any>(null);
    const [editableRecipe, setEditableRecipe] = useState<any>(null); // Track edits
    const [errorMessage, setErrorMessage] = useState('');
    const [isShrinking, setIsShrinking] = useState(false); // Animation state

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

    // Load data if editing
    // 1. Reset for new recipe (runs when opening or switching to new mode)
    React.useEffect(() => {
        if (isOpen && !editingTaskId) {
            setUrl('');
            setPlatform('unknown');
            setParseStatus('idle');
            setParsedRecipe(null);
            setEditableRecipe(null);
            setErrorMessage('');
            setIsShrinking(false);
        }
    }, [isOpen, editingTaskId]);

    // 2. Load data if editing (runs when tasks update or opening edit mode)
    React.useEffect(() => {
        if (isOpen && editingTaskId && parsingTasks) {
            const task = parsingTasks.find(t => t.id === editingTaskId);
            if (task && task.status === 'success' && task.result) {
                const safeUrl = task.url || '';
                setUrl(safeUrl);
                setPlatform(detectPlatform(safeUrl));
                setParsedRecipe(task.result);

                // Safe data sanitization
                const safeResult = task.result || {};

                // Handle Ingredients: AI returns { main: [], condiments: [] }, but we need to handle it safely
                let safeIngredients: any[] = [];
                if (safeResult.ingredients && !Array.isArray(safeResult.ingredients)) {
                    // Structure: { main: [...], condiments: [...] }
                    const main = Array.isArray(safeResult.ingredients.main) ? safeResult.ingredients.main : [];
                    const condiments = Array.isArray(safeResult.ingredients.condiments) ? safeResult.ingredients.condiments : [];
                    safeIngredients = [...main, ...condiments];
                } else if (Array.isArray(safeResult.ingredients)) {
                    // Flat Array (Legacy)
                    safeIngredients = safeResult.ingredients;
                }

                const safeSteps = Array.isArray(safeResult.steps) ? safeResult.steps : [];

                setEditableRecipe({
                    ...safeResult,
                    name: safeResult.name || '',
                    ingredients: { main: safeIngredients, condiments: [] }, // Normalize to structure for DB
                    steps: safeSteps
                });
                setParseStatus('success');
            }
        }
    }, [isOpen, editingTaskId, parsingTasks]);

    const handleParse = async () => {
        if (!url.trim()) {
            setErrorMessage('请输入链接');
            return;
        }

        if (platform === 'unknown') {
            setErrorMessage('暂不支持该平台,请使用Bilibili、抖音或小红书链接');
            return;
        }

        // Use global parsing service if available
        if (startParsingTask) {
            setParseStatus('parsing');
            // Simplified: No shrinking animation to avoid state bugs
            onClose();
            // Start actual task
            startParsingTask(url);
            return;
        }

        console.error("No parsing service available");
        setErrorMessage("Service unavailable");
    };

    const handleSaveRecipe = async () => {
        if (!editableRecipe) return;

        try {
            await onSave(editableRecipe); // Use edited data

            // Clear the specific task from global state after save
            if (setParsingTasks && editingTaskId) {
                setParsingTasks((prev: any) => prev.filter((t: any) => t.id !== editingTaskId));
            }
            onClose();
        } catch (error) {
            console.error('Save failed', error);
            alert('保存失败，请重试');
        }
    };

    if (!isOpen) return null;

    // Guaranteed safe accessors for render
    const recipeToEdit = editableRecipe || { name: '', ingredients: { main: [], condiments: [] }, steps: [] };

    // Helper to get display list
    const getDisplayIngredients = () => {
        if (recipeToEdit.ingredients && !Array.isArray(recipeToEdit.ingredients)) {
            const main = Array.isArray(recipeToEdit.ingredients.main) ? recipeToEdit.ingredients.main : [];
            const condiments = Array.isArray(recipeToEdit.ingredients.condiments) ? recipeToEdit.ingredients.condiments : [];
            return [...main, ...condiments];
        }
        return Array.isArray(recipeToEdit.ingredients) ? recipeToEdit.ingredients : [];
    };

    const displayIngredients = getDisplayIngredients();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        {editingTaskId ? '编辑并保存' : '保存新菜谱'}
                        {platform !== 'unknown' && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${platform === 'bilibili' ? 'bg-pink-100 text-pink-600' :
                                platform === 'douyin' ? 'bg-black text-white' :
                                    platform === 'xiaohongshu' ? 'bg-red-100 text-red-600' : ''
                                }`}>
                                {platform === 'bilibili' ? 'Bilibili' : platform === 'douyin' ? '抖音' : '小红书'}
                            </span>
                        )}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5">
                    {parseStatus === 'idle' || parseStatus === 'parsing' || parseStatus === 'error' ? (
                        <div className="space-y-6">
                            {/* Input Section */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                                    <LinkIcon size={16} />
                                    视频/图文链接
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={url}
                                        onChange={handleUrlChange}
                                        placeholder="粘贴 Bilibili / 抖音 / 小红书 链接..."
                                        className="w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        disabled={parseStatus === 'parsing'}
                                    />
                                </div>
                                <p className="text-xs text-gray-400 pl-1">
                                    支持 Bilibili 视频、抖音短视频、小红书图文
                                </p>
                            </div>

                            {/* Error Message */}
                            {errorMessage && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                                    <AlertCircle size={16} />
                                    {errorMessage}
                                </div>
                            )}

                            {/* Action Button */}
                            <button
                                onClick={handleParse}
                                disabled={parseStatus === 'parsing' || !url.trim()}
                                className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2
                                    ${parseStatus === 'parsing'
                                        ? 'bg-blue-400 cursor-wait'
                                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:shadow-blue-500/25'
                                    }`}
                            >
                                {parseStatus === 'parsing' ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>正在解析...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>🚀 开始解析</span>
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        /* Edit Form (Success State) - Removed animate-in classes to avoid visibility issues */
                        <div className="space-y-6">
                            <div className="bg-green-50 p-3 rounded-lg flex items-center gap-2 text-green-700 mb-4">
                                <CheckCircle2 size={18} />
                                <span className="font-medium text-sm">解析成功！请确认菜谱信息</span>
                            </div>

                            {/* Guaranteed to render content now w/ defaults */}
                            <>
                                {/* Name Input */}
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">菜谱名称</label>
                                    <input
                                        type="text"
                                        value={recipeToEdit.name || ''}
                                        onChange={(e) => setEditableRecipe({ ...recipeToEdit, name: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>

                                {/* Ingredients List */}
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">主要食材 (逗号分隔)</label>
                                    <textarea
                                        value={displayIngredients.map((i: any) => `${i?.name || ''} ${i?.amount || ''}`.trim()).join(', ')}
                                        onChange={(e) => {
                                            const text = e.target.value;
                                            const ingredientsList = text.split(/[,，]/).map(s => {
                                                const parts = s.trim().split(' ');
                                                return { name: parts[0] || '未知食材', amount: parts[1] || '' };
                                            }).filter(i => i.name);

                                            // Save back as Structured Object for compatibility
                                            setEditableRecipe({
                                                ...recipeToEdit,
                                                ingredients: {
                                                    main: ingredientsList,
                                                    condiments: [] // Simplify: put all in main
                                                }
                                            });
                                        }}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none min-h-[80px]"
                                    />
                                </div>

                                {/* Steps List */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-gray-700">烹饪步骤</label>
                                        <span className="text-xs text-gray-500">共 {recipeToEdit.steps?.length || 0} 步</span>
                                    </div>

                                    <div className="space-y-4">
                                        {(recipeToEdit.steps || []).map((step: any, index: number) => (
                                            <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-300 transition-colors group">
                                                {/* Step Number */}
                                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold mt-1">
                                                    {index + 1}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 space-y-2">
                                                    <textarea
                                                        value={step.description || step.content || ''} // Handle different field names
                                                        onChange={(e) => {
                                                            const newSteps = [...(recipeToEdit.steps || [])];
                                                            newSteps[index] = { ...step, description: e.target.value };
                                                            setEditableRecipe({ ...recipeToEdit, steps: newSteps });
                                                        }}
                                                        placeholder={`步骤 ${index + 1}`}
                                                        className="w-full bg-transparent border-none p-0 text-sm text-gray-700 focus:ring-0 resize-none min-h-[40px]"
                                                    />

                                                    {/* Image Preview */}
                                                    {step.image && (
                                                        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-200 mt-2 group-hover:shadow-md transition-shadow">
                                                            <img
                                                                src={step.image}
                                                                alt={`步骤 ${index + 1}`}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Delete Button (Optional, simple implementation) */}
                                                <button
                                                    onClick={() => {
                                                        const newSteps = recipeToEdit.steps.filter((_: any, i: number) => i !== index);
                                                        setEditableRecipe({ ...recipeToEdit, steps: newSteps });
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity self-start"
                                                    title="删除步骤"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add Step Button */}
                                    <button
                                        onClick={() => {
                                            const newSteps = [...(recipeToEdit.steps || []), { description: '', image: '' }];
                                            setEditableRecipe({ ...recipeToEdit, steps: newSteps });
                                        }}
                                        className="w-full py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-dashed border-blue-200"
                                    >
                                        + 添加步骤
                                    </button>
                                </div>

                                {/* Save Button */}
                                <button
                                    onClick={handleSaveRecipe}
                                    className="w-full py-3.5 rounded-xl font-bold text-white shadow-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-green-500/25 transition-all active:scale-95 mt-4"
                                >
                                    💾 保存菜谱
                                </button>
                            </>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SaveRecipeModal;
