import React, { useRef, useState, useEffect } from 'react';
import { useSystem, ProductType } from '../context/SystemContext';
import { Monitor, Stethoscope, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const SystemSwitcher: React.FC = () => {
    const { product, setProduct } = useSystem();
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useTranslation();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const options = [
        { value: 'POS' as ProductType, label: t('nav.posSystem'), icon: Monitor, color: 'text-blue-500' },
        { value: 'CLINIC' as ProductType, label: t('nav.clinicSystem'), icon: Stethoscope, color: 'text-emerald-500' },
    ];

    const current = options.find(o => o.value === product) || options[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 hover:bg-white dark:hover:bg-slate-600 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
            >
                <current.icon size={16} className={product === 'POS' ? 'text-blue-500' : 'text-emerald-500'} />
                <span className="hidden sm:inline-block">{current.label}</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-1">
                        {options.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => {
                                    setProduct(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${product === opt.value
                                        ? 'bg-slate-100 dark:bg-slate-700/50'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                                    }`}
                            >
                                <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-900 ${opt.color}`}>
                                    <opt.icon size={16} />
                                </div>
                                <div className="flex-1 text-left">
                                    <span className={`block text-sm font-medium ${product === opt.value ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {opt.label}
                                    </span>
                                </div>
                                {product === opt.value && <Check size={16} className="text-primary-500" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemSwitcher;
