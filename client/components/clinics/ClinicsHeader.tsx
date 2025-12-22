import React from 'react';
import { Building2, RefreshCw, LucideIcon } from 'lucide-react';

interface ClinicsHeaderProps {
    title: string;
    description: string;
    onRefresh: () => void;
    loading?: boolean;
    icon?: LucideIcon;
}

const ClinicsHeader: React.FC<ClinicsHeaderProps> = ({
    title,
    description,
    onRefresh,
    loading = false,
    icon: Icon = Building2
}) => {
    return (
        <div className="glass-card p-6 mb-6">
            <div className="flex items-center justify-between">
                {/* Left: Title & Description */}
                <div className="flex items-center gap-4">
                    {/* Icon with Gradient */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                        <div className="relative p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-xl">
                            <Icon size={32} strokeWidth={2.5} />
                        </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-purple-800 to-slate-900 dark:from-white dark:via-purple-300 dark:to-white bg-clip-text text-transparent">
                            {title}
                        </h1>
                        <p className="text-slate-600 dark:text-slate-300 mt-1 text-sm">
                            {description}
                        </p>
                    </div>
                </div>

                {/* Right: Refresh Button */}
                <button
                    onClick={onRefresh}
                    disabled={loading}
                    className="glass-button px-5 py-3 font-medium text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group"
                >
                    <RefreshCw
                        size={20}
                        className={`${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`}
                    />
                    <span className="hidden sm:inline">Refresh</span>
                </button>
            </div>
        </div>
    );
};

export default ClinicsHeader;
