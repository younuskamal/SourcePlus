import React, { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Copy, Check, X, Loader, AlertCircle,
  CheckCircle2, AlertTriangle, Eye, EyeOff, ShieldCheck, Zap, Globe,
  Coins, Calculator, Star, Search
} from 'lucide-react';
import { api } from '../services/api';
import { CurrencyRate, SubscriptionPlan, PlanPrice } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { useSystem } from '../context/SystemContext';

interface Toast {
  open: boolean;
  message: string;
  type: 'success' | 'error';
}

interface FormData {
  name: string;
  durationMonths: number;
  prices: PlanPrice[];
  features: Record<string, any>;
  limits: Record<string, any>;
  isActive: boolean;
}

const DEFAULT_TEMPLATES = [
  {
    name: 'Starter',
    durationMonths: 1,
    prices: [{ currency: 'IQD', monthlyPrice: 15000, periodPrice: 15000, yearlyPrice: 180000, discount: 0, isPrimary: true }],
    features: { pos: true, inventory: true },
    limits: { maxUsers: 1, maxProducts: 500, maxBranches: 1 }
  },
  {
    name: 'Professional',
    durationMonths: 12,
    prices: [{ currency: 'IQD', monthlyPrice: 35000, periodPrice: 350000, yearlyPrice: 350000, discount: 16, isPrimary: true }],
    features: { pos: true, inventory: true, reports: true, support: true },
    limits: { maxUsers: 5, maxProducts: 5000, maxBranches: 3 }
  },
  {
    name: 'Enterprise',
    durationMonths: 12,
    prices: [
      { currency: 'IQD', monthlyPrice: 75000, periodPrice: 750000, yearlyPrice: 750000, discount: 16, isPrimary: true },
      { currency: 'USD', monthlyPrice: 50, periodPrice: 500, yearlyPrice: 500, discount: 16, isPrimary: false }
    ],
    features: { pos: true, inventory: true, reports: true, support: true, api: true },
    limits: { maxUsers: 999, maxProducts: 99999, maxBranches: 10 }
  }
];

// ============ Helper for Dynamic Theme Classes ============
const useThemeColors = () => {
  const { primaryColor } = useSystem(); // 'blue' or 'emerald'
  const color = primaryColor === 'POS' ? 'blue' : (primaryColor === 'CLINIC' ? 'emerald' : primaryColor); // Handle 'POS'/'CLINIC' if context returns that, mostly context returns 'blue'/'emerald'

  // Creating a safe map to avoid Tailwind purging issues
  const colors = {
    bg: {
      50: color === 'emerald' ? 'bg-emerald-50' : 'bg-blue-50',
      100: color === 'emerald' ? 'bg-emerald-100' : 'bg-blue-100',
      500: color === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500',
      600: color === 'emerald' ? 'bg-emerald-600' : 'bg-blue-600',
      700: color === 'emerald' ? 'bg-emerald-700' : 'bg-blue-700',
      900: color === 'emerald' ? 'bg-emerald-900' : 'bg-blue-900',
    },
    text: {
      500: color === 'emerald' ? 'text-emerald-500' : 'text-blue-500',
      600: color === 'emerald' ? 'text-emerald-600' : 'text-blue-600',
      700: color === 'emerald' ? 'text-emerald-700' : 'text-blue-700',
    },
    border: {
      200: color === 'emerald' ? 'border-emerald-200' : 'border-blue-200',
      500: color === 'emerald' ? 'border-emerald-500' : 'border-blue-500',
      600: color === 'emerald' ? 'border-emerald-600' : 'border-blue-600',
    },
    ring: {
      500: color === 'emerald' ? 'focus:ring-emerald-500' : 'focus:ring-blue-500',
    }
  };

  return { colors, isEmerald: color === 'emerald' };
};

// ============ Toast Component ============
const Toast: React.FC<{ toast: Toast; onClose: () => void; isRtl: boolean }> = ({ toast, onClose, isRtl }) => {
  React.useEffect(() => {
    if (toast.open) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.open, onClose]);

  if (!toast.open) return null;

  return (
    <div
      className={`fixed bottom-6 ${isRtl ? 'left-6' : 'right-6'} z-[100] animate-in slide-in-from-bottom-5 duration-300`}
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${toast.type === 'success'
          ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
          : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
          }`}
      >
        {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <X className="w-5 h-5" />}
        <span className="text-sm font-medium">{toast.message}</span>
      </div>
    </div>
  );
};

// ============ Confirm Dialog Component ============
const ConfirmDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isRtl: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}> = ({ isOpen, onClose, onConfirm, title, message, isRtl, confirmLabel = 'Confirm', cancelLabel = 'Cancel', isDestructive = false }) => {
  const { colors } = useThemeColors();
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] transition-opacity" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
        <div className={`pointer-events-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700 flex flex-col`} dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="p-6 text-center">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDestructive ? 'bg-rose-100 text-rose-600' : `${colors.bg[100]} ${colors.text[600]}`}`}>
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{message}</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex gap-3 rounded-b-2xl">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 font-bold transition-colors text-sm">{cancelLabel}</button>
            <button onClick={() => { onConfirm(); onClose(); }} className={`flex-1 px-4 py-2.5 rounded-xl text-white font-bold transition-colors text-sm shadow-lg ${isDestructive ? 'bg-rose-600 hover:bg-rose-700' : `${colors.bg[600]} hover:${colors.bg[700]}`}`}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ============ Feature Editor ============
const FeatureEditor: React.FC<{ features: Record<string, any>; onChange: (f: Record<string, any>) => void; label: string }> = ({ features, onChange, label }) => {
  const [newFeature, setNewFeature] = useState('');
  const { colors } = useThemeColors();

  const handleAdd = () => {
    if (newFeature.trim()) {
      onChange({ ...features, [newFeature.trim()]: true });
      setNewFeature('');
    }
  };

  const handleDelete = (key: string) => {
    const updated = { ...features };
    delete updated[key];
    onChange(updated);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <CheckCircle2 size={14} /> {label}
      </label>
      <div className="flex gap-2 mb-3">
        <input type="text" value={newFeature} onChange={(e) => setNewFeature(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAdd()} placeholder="Add feature..." className={`flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 ${colors.ring[500]} text-sm`} />
        <button onClick={handleAdd} className={`px-3 py-2 ${colors.bg[600]} hover:${colors.bg[700]} text-white rounded-lg font-medium transition-colors text-sm flex items-center gap-1.5 shadow-sm`}>
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2 min-h-[40px]">
        {Object.keys(features).length > 0 ? (
          Object.keys(features).map((feature) => (
            <div key={feature} className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 shadow-sm">
              <span className="text-xs font-medium">{feature}</span>
              <button onClick={() => handleDelete(feature)} className="text-slate-400 hover:text-rose-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
            </div>
          ))
        ) : (
          <div className="w-full text-center py-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
            <p className="text-xs text-slate-400 italic">No features added yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============ Limit Editor ============
const LimitEditor: React.FC<{ limits: Record<string, any>; onChange: (l: Record<string, any>) => void; label: string }> = ({ limits, onChange, label }) => {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const { colors } = useThemeColors();

  const handleAdd = () => {
    if (newKey.trim() && newValue.trim()) {
      const val = !isNaN(Number(newValue)) ? Number(newValue) : newValue;
      onChange({ ...limits, [newKey.trim()]: val });
      setNewKey('');
      setNewValue('');
    }
  };

  const handleDelete = (key: string) => {
    const updated = { ...limits };
    delete updated[key];
    onChange(updated);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Zap size={14} /> {label}
      </label>
      <div className="grid grid-cols-5 gap-2 mb-3">
        <input type="text" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="Key" className={`col-span-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 ${colors.ring[500]} text-sm`} />
        <input type="text" value={newValue} onChange={(e) => setNewValue(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAdd()} placeholder="Value" className={`col-span-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 ${colors.ring[500]} text-sm`} />
        <button onClick={handleAdd} className={`col-span-1 px-3 py-2 ${colors.bg[600]} hover:${colors.bg[700]} text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center shadow-sm`}>
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2 min-h-[40px]">
        {Object.entries(limits).map(([key, value]) => (
          <div key={key} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 shadow-sm">
            <span className="text-xs font-medium"><span className="text-slate-400">{key}:</span> {value}</span>
            <button onClick={() => handleDelete(key)} className="text-slate-400 hover:text-rose-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============ Plans Page ============
const Plans: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { colors } = useThemeColors();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast>({ open: false, message: '', type: 'success' });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const [formData, setFormData] = useState<FormData>({
    name: '', durationMonths: 12, prices: [], features: {}, limits: {}, isActive: true
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, currenciesRes] = await Promise.all([api.getPlans(), api.getCurrencies()]);
      setPlans(Array.isArray(plansRes) ? plansRes : (plansRes as any)?.plans || []);
      setCurrencies(Array.isArray(currenciesRes) ? currenciesRes : (currenciesRes as any)?.currencies || []);
    } catch (err: any) {
      setToast({ open: true, message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenModal = (plan?: SubscriptionPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({ name: plan.name, durationMonths: plan.durationMonths || 12, prices: plan.prices || [], features: plan.features || {}, limits: plan.limits || {}, isActive: plan.isActive });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '', durationMonths: 12,
        prices: [{ currency: currencies[0]?.code || 'IQD', monthlyPrice: 0, periodPrice: 0, yearlyPrice: 0, discount: 0, isPrimary: true }],
        features: {}, limits: {}, isActive: true
      });
    }
    setModalOpen(true);
  };

  const handlePriceChange = (index: number, field: keyof PlanPrice, value: any) => {
    const newPrices = [...formData.prices];
    newPrices[index] = { ...newPrices[index], [field]: value };
    // Auto-calc period/yearly
    if (field === 'monthlyPrice' || field === 'discount') {
      const monthly = field === 'monthlyPrice' ? Number(value) : newPrices[index].monthlyPrice;
      const discount = field === 'discount' ? Number(value) : newPrices[index].discount;
      const period = monthly * formData.durationMonths;
      newPrices[index].periodPrice = period - (period * (discount / 100));
      newPrices[index].yearlyPrice = (monthly * 12) - ((monthly * 12) * (discount / 100));
    }
    setFormData({ ...formData, prices: newPrices });
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = { ...formData, durationMonths: Number(formData.durationMonths) };
      if (editingPlan) {
        await api.updatePlan(editingPlan.id, payload);
        setToast({ open: true, message: 'Plan updated', type: 'success' });
      } else {
        await api.createPlan(payload);
        setToast({ open: true, message: 'Plan created', type: 'success' });
      }
      await fetchData();
      setModalOpen(false);
    } catch (err: any) {
      setToast({ open: true, message: 'Failed to save plan', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (plan: SubscriptionPlan) => {
    try {
      await api.togglePlanStatus(plan.id, plan.isActive ? 'deactivate' : 'activate');
      await fetchData();
    } catch (err) { setToast({ open: true, message: 'Failed', type: 'error' }); }
  };

  const filteredPlans = plans.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' ? true : (filterStatus === 'active' ? p.isActive : !p.isActive);
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">{t('plans.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage subscription tiers & pricing</p>
        </div>
        <button onClick={() => handleOpenModal()} className={`flex items-center gap-2 px-4 py-2 ${colors.bg[600]} hover:${colors.bg[700]} text-white rounded-lg shadow-lg shadow-${colors.bg[500]}/20 transition-all font-bold`}>
          <Plus size={16} /> {t('plans.add')}
        </button>
      </div>

      {!loading && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2">
              {['all', 'active', 'inactive'].map((s) => (
                <button key={s} onClick={() => setFilterStatus(s as any)} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${filterStatus === s ? `${colors.bg[600]} text-white` : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200'}`}>
                  {s}
                </button>
              ))}
            </div>
            <div className="relative w-full lg:w-80">
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className={`w-full pl-10 pr-10 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 ${colors.ring[500]} text-sm`} />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            </div>
          </div>
        </div>
      )}

      {loading ? <div className="flex justify-center py-20"><Loader className={`w-8 h-8 ${colors.text[600]} animate-spin`} /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => (
            <div key={plan.id} className={`group flex flex-col bg-white dark:bg-slate-800 rounded-2xl border transition-all hover:shadow-xl ${plan.isActive ? 'border-slate-200 dark:border-slate-700' : 'border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100 border-dashed'}`}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className={`text-xl font-black text-slate-900 dark:text-white group-hover:${colors.text[600]} transition-colors`}>{plan.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${plan.isActive ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{plan.isActive ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50 min-h-[100px] flex flex-col justify-center">
                  {plan.prices.filter(p => p.isPrimary).map((price, idx) => (
                    <div key={idx} className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">{price.periodPrice.toLocaleString()}</span>
                      <span className="text-xs font-bold text-slate-500">{price.currency}</span>
                      <span className="text-xs text-slate-400 ml-1">/ {plan.durationMonths}mo</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-6 pb-2 flex-1 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Features</p>
                {Object.keys(plan.features).slice(0, 3).map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <Check size={12} className="text-emerald-500" /> {f}
                  </div>
                ))}
                {Object.keys(plan.features).length > 3 && <p className="text-[10px] text-slate-400">+{Object.keys(plan.features).length - 3} more</p>}
              </div>
              <div className="p-4 mt-auto border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-3">
                <button onClick={() => handleToggleStatus(plan)} className={`text-xs font-bold py-2 rounded-lg ${plan.isActive ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
                  {plan.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => handleOpenModal(plan)} className={`p-2 rounded-lg ${colors.bg[50]} ${colors.text[600]} hover:${colors.bg[100]} border ${colors.border[200]}`} title="Edit"><Edit2 size={16} /></button>
                  <button onClick={() => setDeleteConfirm({ open: true, id: plan.id, name: plan.name })} className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200" title="Delete"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals omitted for brevity, reusing logic but with updated styles */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingPlan ? "Edit Plan" : "New Plan"} subtitle={editingPlan ? "Update details" : "Create new subscription tier"} isRtl={isRtl}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 bg-slate-50 dark:bg-slate-900 rounded-b-2xl">
          <div className="space-y-4">

            {/* Quick Templates - Only show when creating new */}
            {!editingPlan && (
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-300 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <Zap size={12} /> {t('plans.quickTemplates') || 'Quick Templates'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_TEMPLATES.map((tpl) => (
                    <button key={tpl.name} onClick={() => setFormData({ ...tpl, isActive: true })} className="px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 transition-colors text-xs font-bold shadow-sm">
                      {tpl.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-bold block mb-1">Plan Name</label>
              <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={`w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 ${colors.ring[500]}`} />
            </div>
            <div>
              <label className="text-sm font-bold block mb-1">Duration (Months)</label>
              <input type="number" value={formData.durationMonths} onChange={e => setFormData({ ...formData, durationMonths: Number(e.target.value) })} className={`w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 ${colors.ring[500]}`} />
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold uppercase text-slate-500">Prices</label>
                <button onClick={() => setFormData({ ...formData, prices: [...formData.prices, { currency: 'IQD', monthlyPrice: 0, periodPrice: 0, yearlyPrice: 0, discount: 0, isPrimary: false }] })} className={`text-xs font-bold ${colors.text[600]}`}>+ Add Currency</button>
              </div>
              <div className="space-y-3">
                {formData.prices.map((p, i) => (
                  <div key={i} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex gap-2 mb-2">
                      <select value={p.currency} onChange={e => handlePriceChange(i, 'currency', e.target.value)} className="bg-white dark:bg-slate-800 border border-slate-200 rounded px-2 py-1 text-xs font-bold">
                        {currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                      </select>
                      {p.isPrimary && <span className="text-[10px] bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-bold">Primary</span>}
                      {!p.isPrimary && <button onClick={() => { const newPrices = formData.prices.map((pr, idx) => ({ ...pr, isPrimary: idx === i })); setFormData({ ...formData, prices: newPrices }); }} className="text-[10px] text-slate-400 hover:text-amber-500">Set Primary</button>}
                      <button onClick={() => { const newPrices = [...formData.prices]; newPrices.splice(i, 1); setFormData({ ...formData, prices: newPrices }) }} className="ml-auto text-rose-400 hover:text-rose-600"><Trash2 size={12} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[10px] block">Monthly</label><input type="number" value={p.monthlyPrice} onChange={e => handlePriceChange(i, 'monthlyPrice', e.target.value)} className="w-full text-xs px-2 py-1 rounded border" /></div>
                      <div><label className="text-[10px] block">Discount %</label><input type="number" value={p.discount} onChange={e => handlePriceChange(i, 'discount', e.target.value)} className="w-full text-xs px-2 py-1 rounded border" /></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <FeatureEditor features={formData.features} onChange={f => setFormData({ ...formData, features: f })} label="Features" />
            <LimitEditor limits={formData.limits} onChange={l => setFormData({ ...formData, limits: l })} label="Limits" />
          </div>
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2 bg-white dark:bg-slate-800 rounded-b-2xl">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className={`px-4 py-2 rounded-lg text-white font-bold text-sm ${colors.bg[600]} hover:${colors.bg[700]}`}>{saving ? 'Saving...' : 'Save Plan'}</button>
        </div>
      </Modal>


      <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={async () => { if (deleteConfirm) { try { await api.deletePlan(deleteConfirm.id); setToast({ open: true, message: 'Deleted', type: 'success' }); fetchData(); } catch (e) { setToast({ open: true, message: 'Failed', type: 'error' }) } } }} title="Delete Plan" message="Are you sure?" isRtl={isRtl} isDestructive />
      <Toast toast={toast} onClose={() => setToast({ ...toast, open: false })} isRtl={isRtl} />
    </div>
  );
};

// Modal Component helper (inline for single file)
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; subtitle: string; isRtl: boolean; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 sticky top-0 z-10">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose}><X className="text-slate-400 hover:text-slate-600" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default Plans;
