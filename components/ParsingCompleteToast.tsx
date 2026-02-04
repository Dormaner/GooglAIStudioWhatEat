import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ParsingCompleteToastProps {
    status: 'success' | 'error';
    recipeName?: string;
    error?: string;
    onEdit?: () => void;
    onClose: () => void;
    autoCloseMs?: number;
}

const ParsingCompleteToast: React.FC<ParsingCompleteToastProps> = ({
    status,
    recipeName,
    error,
    onEdit,
    onClose,
    autoCloseMs = 5000
}) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, autoCloseMs);

        return () => clearTimeout(timer);
    }, [autoCloseMs, onClose]);

    return (
        <div className="fixed bottom-6 right-6 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-80 z-50 animate-slide-up">
            <div className="flex items-start gap-3">
                {/* Status Icon */}
                {status === 'success' ? (
                    <CheckCircle2 className="text-green-500 flex-shrink-0 mt-1" size={24} />
                ) : (
                    <AlertCircle className="text-red-500 flex-shrink-0 mt-1" size={24} />
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-gray-800">
                            {status === 'success' ? '✅ 解析完成！' : '❌ 解析失败'}
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={16} className="text-gray-500" />
                        </button>
                    </div>

                    {status === 'success' ? (
                        <>
                            <p className="text-sm text-gray-700 font-semibold mb-2">{recipeName}</p>
                            {onEdit && (
                                <button
                                    onClick={onEdit}
                                    className="w-full px-4 py-2 bg-green-500 text-white text-sm font-semibold rounded-lg hover:bg-green-600 transition-colors"
                                >
                                    点击编辑并保存 →
                                </button>
                            )}
                        </>
                    ) : (
                        <p className="text-sm text-red-600">{error || '解析失败，请重试'}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ParsingCompleteToast;
