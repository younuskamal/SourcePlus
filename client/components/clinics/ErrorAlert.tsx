import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorAlertProps {
    message: string;
    onRetry: () => void;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onRetry }) => {
    return (
        <div className="bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-200 dark:border-rose-800 rounded-2xl p-8 animate-shake">
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                    <AlertCircle className="text-rose-600 dark:text-rose-400" size={48} />
                </div>
                <div className="flex-1">
                    <h3 className="text-2xl font-bold text-rose-900 dark:text-rose-200 mb-2">
                        ⚠️ Error Loading Clinics
                    </h3>
                    <p className="text-rose-700 dark:text-rose-300 mb-6 text-lg">
                        {message}
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onRetry}
                            className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium transition-all flex items-center gap-2 shadow-sm"
                        >
                            <RefreshCw size={20} />
                            Retry
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-medium transition-all flex items-center gap-2 shadow-sm"
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ErrorAlert;
