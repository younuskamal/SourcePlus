
import React from 'react';
import { LucideIcon, Zap } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: number;
    icon: LucideIcon;
    color: 'blue' | 'emerald' | 'amber' | 'rose';
    subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, subtitle }) => {
    const colorConfigs = {
        blue: {
            bg: 'bg-blue-50 dark:bg-blue-900/10',
            text: 'text-blue-600 dark:text-blue-400',
            border: 'hover:border-blue-500/30',
            iconBg: 'bg-blue-600 shadow-blue-600/20'
        },
        emerald: {
            bg: 'bg-emerald-50 dark:bg-emerald-900/10',
            text: 'text-emerald-600 dark:text-emerald-400',
            border: 'hover:border-emerald-500/30',
            iconBg: 'bg-emerald-600 shadow-emerald-600/20'
        },
        amber: {
            bg: 'bg-amber-50 dark:bg-amber-900/10',
            text: 'text-amber-600 dark:text-amber-400',
            border: 'hover:border-amber-500/30',
            iconBg: 'bg-amber-600 shadow-amber-600/20'
        },
        rose: {
            bg: 'bg-rose-50 dark:bg-rose-900/10',
            text: 'text-rose-600 dark:text-rose-400',
            border: 'hover:border-rose-500/30',
            iconBg: 'bg-rose-600 shadow-rose-600/20'
        }
    };

    const config = colorConfigs[color || 'blue'];

    return (
        <div className={`bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm group transition-all duration-500 ${config.border} hover:shadow-2xl hover:-translate-y-1`}>
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5 mb-2">
                        <Zap size={10} className={config.text} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter group-hover:scale-105 transition-transform origin-left">
                        {value.toLocaleString()}
                    </h3>
                    {subtitle && (
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight mt-1">{subtitle}</p>
                    )}
                </div>

                <div className={`p-4 rounded-2xl ${config.iconBg} text-white shadow-xl transition-all duration-500 group-hover:rotate-6 group-hover:scale-110`}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
            </div>

            {/* Minimal Background Visual */}
            <div className="absolute bottom-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <Icon size={80} strokeWidth={4} />
            </div>
        </div>
    );
};

export default StatCard;
