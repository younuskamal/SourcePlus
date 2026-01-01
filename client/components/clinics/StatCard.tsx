import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: number;
    icon: LucideIcon;
    color: 'blue' | 'green' | 'amber' | 'red';
    subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, subtitle }) => {
    const colorConfigs = {
        blue: {
            bg: 'bg-blue-50 dark:bg-blue-950/20',
            text: 'text-blue-600 dark:text-blue-400',
            iconBg: 'bg-blue-600',
            label: 'text-blue-500/80'
        },
        green: {
            bg: 'bg-emerald-50 dark:bg-emerald-950/20',
            text: 'text-emerald-600 dark:text-emerald-400',
            iconBg: 'bg-emerald-600',
            label: 'text-emerald-500/80'
        },
        amber: {
            bg: 'bg-amber-50 dark:bg-amber-950/20',
            text: 'text-amber-600 dark:text-amber-400',
            iconBg: 'bg-amber-600',
            label: 'text-amber-500/80'
        },
        red: {
            bg: 'bg-rose-50 dark:bg-rose-950/20',
            text: 'text-rose-600 dark:text-rose-400',
            iconBg: 'bg-rose-600',
            label: 'text-rose-500/80'
        }
    };

    const config = colorConfigs[color];

    return (
        <div className={`relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[1.5rem] shadow-sm hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-300 group`}>
            {/* Subtle Gradient Background */}
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-[40px] opacity-20 ${config.bg}`} />

            <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${config.bg} ${config.text} group-hover:scale-110 transition-transform duration-500`}>
                    <Icon size={20} strokeWidth={2.5} />
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{title}</p>
                </div>
            </div>

            <div className="space-y-1">
                <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {value.toLocaleString()}
                </h4>
                {subtitle && (
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${config.iconBg}`} />
                        {subtitle}
                    </p>
                )}
            </div>

            {/* Interactive Progress-like bar (aesthetic only) */}
            <div className="mt-5 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full ${config.iconBg} opacity-40 w-full transform -translate-x-1/2 group-hover:translate-x-0 transition-transform duration-1000`} />
            </div>
        </div>
    );
};

export default StatCard;
