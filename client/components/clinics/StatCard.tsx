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
            gradient: 'from-blue-500 via-blue-600 to-cyan-600',
            bg: 'glass-gradient-purple',
            glow: 'rgba(59, 130, 246, 0.4)',
            text: 'text-blue-600 dark:text-blue-400'
        },
        green: {
            gradient: 'from-emerald-500 via-emerald-600 to-teal-600',
            bg: 'glass-gradient-emerald',
            glow: 'rgba(16, 185, 129, 0.4)',
            text: 'text-emerald-600 dark:text-emerald-400'
        },
        amber: {
            gradient: 'from-amber-500 via-amber-600 to-orange-600',
            bg: 'glass-gradient-amber',
            glow: 'rgba(245, 158, 11, 0.4)',
            text: 'text-amber-600 dark:text-amber-400'
        },
        red: {
            gradient: 'from-rose-500 via-rose-600 to-pink-600',
            bg: 'glass-gradient-rose',
            glow: 'rgba(244, 63, 94, 0.4)',
            text: 'text-rose-600 dark:text-rose-400'
        }
    };

    const config = colorConfigs[color];

    return (
        <div className={`glass-stat-card ${config.bg} group cursor-default`}>
            <div className="flex items-start justify-between">
                {/* Left: Stats */}
                <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                        {title}
                    </p>
                    <p className="text-4xl font-bold text-slate-900 dark:text-white mb-1 transition-transform group-hover:scale-105">
                        {value.toLocaleString()}
                    </p>
                    {subtitle && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* Right: Icon with Gradient & Glow */}
                <div className="relative">
                    {/* Glow Effect */}
                    <div
                        className="absolute inset-0 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: config.glow }}
                    />

                    {/* Icon Container */}
                    <div className={`relative p-3 rounded-xl bg-gradient-to-br ${config.gradient} text-white shadow-lg transform transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                        <Icon size={24} strokeWidth={2.5} />
                    </div>
                </div>
            </div>

            {/* Bottom Accent Line */}
            <div className="mt-4 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-20 rounded" />
        </div>
    );
};

export default StatCard;
