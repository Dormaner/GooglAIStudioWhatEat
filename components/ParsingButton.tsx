import React, { useState, useRef, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';
import CircularProgress from './CircularProgress';

interface ParsingTask {
    id: string;
    url: string;
    status: 'parsing' | 'success' | 'error';
    progress: string;
    result?: any;
    error?: string;
    progressPercent?: number; // 0-100
    estimatedTimeLeft?: string; // e.g., "30秒"
}

interface ParsingButtonProps {
    parsingTasks: ParsingTask[];
    onOpenEdit: (taskId: string) => void;
    onClearTask: (taskId: string) => void;
}

const ParsingButton: React.FC<ParsingButtonProps> = ({ parsingTasks, onOpenEdit, onClearTask }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    if (!parsingTasks || parsingTasks.length === 0) return null;

    // Count tasks by status
    const parsingCount = parsingTasks.filter(t => t.status === 'parsing').length;
    const successCount = parsingTasks.filter(t => t.status === 'success').length;
    const errorCount = parsingTasks.filter(t => t.status === 'error').length;

    const getIcon = () => {
        if (parsingCount > 0) {
            return <Loader2 className="animate-spin" size={18} />;
        } else if (successCount > 0) {
            return <CheckCircle2 size={18} />;
        } else {
            return <AlertCircle size={18} />;
        }
    };

    const getButtonColor = () => {
        if (parsingCount > 0) return 'bg-blue-50 text-blue-600 hover:bg-blue-100';
        if (successCount > 0) return 'bg-green-50 text-green-600 hover:bg-green-100';
        return 'bg-red-50 text-red-600 hover:bg-red-100';
    };

    const getButtonText = () => {
        if (parsingCount > 0) return `解析中 (${parsingCount})`;
        if (successCount > 0) return `完成 (${successCount})`;
        return `失败 (${errorCount})`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Parsing Button */}
            <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${getButtonColor()}`}
            >
                {parsingCount > 0 ? (
                    <CircularProgress progress={Math.round(parsingTasks.filter(t => t.status === 'parsing').reduce((sum, t) => sum + (t.progressPercent || 0), 0) / parsingCount)} size={18} strokeWidth={2} />
                ) : getIcon()}
                <span className="hidden sm:inline">{getButtonText()}</span>
                <ChevronDown size={14} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown List - Centered Fixed Position */}
            {isDropdownOpen && (
                <>
                    {/* Backdrop for mobile to click outside easily */}
                    <div className="fixed inset-0 z-40 bg-black/5" onClick={() => setIsDropdownOpen(false)} />
                    <div className="fixed top-24 left-1/2 -translate-x-1/2 w-[85vw] max-w-[300px] max-h-[35vh] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-slide-down">
                        <div className="p-4">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-gray-800">解析任务</h3>
                                {parsingTasks.some(t => t.status !== 'parsing') && (
                                    <button
                                        onClick={() => {
                                            parsingTasks.forEach(t => {
                                                if (t.status !== 'parsing') {
                                                    onClearTask(t.id);
                                                }
                                            });
                                            setIsDropdownOpen(false);
                                        }}
                                        className="text-xs text-gray-500 hover:text-gray-700"
                                    >
                                        清除全部
                                    </button>
                                )}
                            </div>

                            {/* Task List - Scrollable */}
                            <div className="space-y-3 max-h-[30vh] overflow-y-auto">
                                {parsingTasks.map((task) => (
                                    <div key={task.id} className="bg-gray-50 rounded-lg p-3 space-y-2">
                                        {/* Status Icon + Name */}
                                        <div className="flex items-start gap-2">
                                            <div className="mt-0.5">
                                                {task.status === 'parsing' && <CircularProgress progress={task.progressPercent || 0} size={20} strokeWidth={2} />}
                                                {task.status === 'success' && <CheckCircle2 className="text-green-500" size={20} />}
                                                {task.status === 'error' && <AlertCircle className="text-red-500" size={20} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm text-gray-800 truncate">
                                                    {task.result?.name || '正在解析...'}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">{task.url}</p>
                                            </div>
                                            {task.status !== 'parsing' && (
                                                <button
                                                    onClick={() => onClearTask(task.id)}
                                                    className="text-xs text-gray-400 hover:text-gray-600"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>

                                        {/* Progress or Status */}
                                        {task.status === 'parsing' && (
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs text-gray-600">{task.progress}</p>
                                                    {task.estimatedTimeLeft && (
                                                        <p className="text-xs text-gray-500">剩余 {task.estimatedTimeLeft}</p>
                                                    )}
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="bg-blue-500 h-full rounded-full transition-all duration-300"
                                                        style={{ width: `${task.progressPercent || 0}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}

                                        {task.status === 'success' && (
                                            <button
                                                onClick={() => {
                                                    onOpenEdit(task.id);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className="w-full px-3 py-2 bg-green-500 text-white text-sm font-semibold rounded-lg hover:bg-green-600 transition-colors"
                                            >
                                                点击编辑并保存
                                            </button>
                                        )}

                                        {task.status === 'error' && (
                                            <p className="text-xs text-red-600">{task.error}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ParsingButton;
