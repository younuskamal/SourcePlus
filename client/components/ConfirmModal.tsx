import React from 'react';
import { X, AlertTriangle, Info, AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    showCancel?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger',
    showCancel = true
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'danger': return <AlertCircle className="text-rose-500" size={24} />;
            case 'warning': return <AlertTriangle className="text-amber-500" size={24} />;
            case 'info': return <Info className="text-sky-500" size={24} />;
        }
    };

    const getButtonColor = () => {
        switch (type) {
            case 'danger': return 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500';
            case 'warning': return 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500';
            case 'info': return 'bg-sky-600 hover:bg-sky-700 focus:ring-sky-500';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden transform transition-all scale-100 border border-slate-100 dark:border-slate-700">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full flex-shrink-0 ${type === 'danger' ? 'bg-rose-50 dark:bg-rose-900/20' : type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-sky-50 dark:bg-sky-900/20'}`}>
                            {getIcon()}
                        </div>

                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                {title}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-700/30 px-6 py-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                    {showCancel && (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors shadow-sm ${getButtonColor()}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
