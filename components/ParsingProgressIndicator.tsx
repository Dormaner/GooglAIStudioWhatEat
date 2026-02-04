import React from 'react';
import { Loader2, X } from 'lucide-react';

interface ParsingProgressIndicatorProps {
    url: string;
    progress: string;
    onCancel?: () => void;
}

const ParsingProgressIndicator: React.FC<ParsingProgressIndicatorProps> = ({ url, progress, onCancel }) => {
    return (
        <div className="fixed bottom-6 right-6 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-80 z-50 animate-slide-up">
            <div className="flex items-start gap-3">
                {/* Loading Icon */}
                <Loader2 className="animate-spin text-blue-500 flex-shrink-0 mt-1" size={20} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-800 text-sm">正在解析视频</h3>
                        {onCancel && (
                            <button
                                onClick={onCancel}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                title="取消解析"
                            >
                                <X size={16} className="text-gray-500" />
                            </button>
                        )}
                    </div>

                    {/* Progress Text */}
                    <p className="text-xs text-gray-600 mb-2">{progress}</p>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>

                    {/* URL Preview */}
                    <p className="text-xs text-gray-400 mt-2 truncate" title={url}>
                        {url}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ParsingProgressIndicator;
