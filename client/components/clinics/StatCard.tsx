import React from 'react';
import { Building2, CheckCircle2, Clock, Ban } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: number;
    icon: React.ElementType;
    color: 'blue' | 'green' | 'amber' | 'red';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => {
    const colors = {
        blue: 'from-blue-500 to-cyan-500',
        green: 'from-emerald-500 to-teal-500',
        amber: 'from-amber-500 to-orange-500',
        red: 'from-rose-500 to-pink-500'
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
                </div>
                <div className={`p-4 rounded-xl bg-gradient-to-br ${colors[color]} text-white shadow-lg`}>
                    <Icon size={24} />
                </div>
            </div>
        </div>
    );
};

export default StatCard;
