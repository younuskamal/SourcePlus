import React from 'react';
import { useSystem, ProductType } from '../context/SystemContext';
import { Monitor, Stethoscope, ChevronDown } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const SystemSwitcher: React.FC = () => {
    const { product, setProduct } = useSystem();
    const [isOpen, setIsOpen] = React.useState(false);
    const { t } = useTranslation();

    const options: { value: ProductType; label: string; icon: React.ElementType; color: string }[] = [
        { value: 'POS', label: t('nav.posSystem'), icon: Monitor, color: 'text-blue-400' },
        { value: 'CLINIC', label: t('nav.clinicSystem'), icon: Stethoscope, color: 'text-emerald-400' },
    ];

    const current = options.find(o => o.value === product) || options[0];

    return (
        <div className="px-3 mb-6 mt-2 relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-3 transition-all duration-200 group"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-slate-900 ${current.color}`}>
                        <current.icon size={18} />
                    </div>
                    <div className="text-left">
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">System</p>
                        <p className="text-sm font-bold text-white mb-0 leading-none">{current.label}</p>
                    </div>
                </div>
                <ChevronDown size={16} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-3 right-3 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => {
                                setProduct(opt.value);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 p-3 transition-colors ${product === opt.value
                                    ? 'bg-slate-700/50'
                                    : 'hover:bg-slate-700/30'
                                }`}
                        >
                            <div className={`p-2 rounded-lg bg-slate-900 ${opt.color}`}>
                                <opt.icon size={16} />
                            </div>
                            <span className={`text-sm font-medium ${product === opt.value ? 'text-white' : 'text-slate-400'}`}>
                                {opt.label}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SystemSwitcher;
