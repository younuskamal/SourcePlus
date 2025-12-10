import React, { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Check, X, Loader, AlertTriangle,
  CheckCircle2, Zap, Search, LayoutGrid, List, MoreVertical,
  DollarSign, Shield, Calendar, Tag, Layers, Copy, Hash, Users, Activity
} from 'lucide-react';
import { api } from '../services/api';
import { CurrencyRate, SubscriptionPlan, PlanPrice, LicenseKey } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { useSystem } from '../context/SystemContext';

// --- Interfaces ---
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
  deviceLimit: number;
}

// --- Constants ---
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

const COMMON_FEATURES = ['pos', 'inventory', 'reports', 'support', 'api', 'backups', 'dashboard_access'];
const COMMON_LIMITS = ['maxUsers', 'maxProducts', 'maxBranches', 'maxCustomers', 'maxInvoices'];

// --- Theme Hook ---
const useThemeColors = () => {
  const { primaryColor } = useSystem();
  const color = primaryColor === 'POS' ? 'blue' : (primaryColor === 'CLINIC' ? 'emerald' : primaryColor);

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
    },
    gradient: color === 'emerald'
      ? 'from-emerald-500 to-teal-600'
      : 'from-blue-600 to-indigo-600',
    lightGradient: color === 'emerald'
      ? 'from-emerald-50 to-teal-50'
      : 'from-blue-50 to-indigo-50'
  };

  return { colors, isEmerald: color === 'emerald' };
};

// --- Reusable Components ---

const Toast: React.FC<{ toast: Toast; onClose: () => void; isRtl: boolean }> = ({ toast, onClose, isRtl }) => {
  useEffect(() => {
    if (toast.open) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.open, onClose]);

  if (!toast.open) return null;

  return (
    <div className={`fixed bottom-6 ${isRtl ? 'left-6' : 'right-6'} z-[100] animate-in slide-in-from-bottom-5 duration-300`}>
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border backdrop-blur-md ${toast.type === 'success'
        ? 'bg-emerald-50/90 text-emerald-800 border-emerald-200'
        : 'bg-rose-50/90 text-rose-800 border-rose-200'
        }`}>
        {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <X className="w-5 h-5" />}
        <span className="text-sm font-bold">{toast.message}</span>
      </div>
    </div>
  );
};

const FeatureEditor: React.FC<{ features: Record<string, any>; onChange: (f: Record<string, any>) => void }> = ({ features, onChange }) => {
  const [newFeature, setNewFeature] = useState('');
  const { colors } = useThemeColors();

  const handleAdd = (feat: string = newFeature) => {
    if (feat.trim()) {
      onChange({ ...features, [feat.trim()]: true });
      setNewFeature('');
    }
  };

  const handleDelete = (key: string) => {
    const updated = { ...features };
    delete updated[key];
    onChange(updated);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="flex justify-between items-center mb-3">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 size={14} /> Features
        </label>
        <span className="text-[10px] text-slate-400">{Object.keys(features).length} items</span>
      </div>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={newFeature}
          onChange={(e) => setNewFeature(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="e.g. Free Domain"
          className={`flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 ${colors.ring[500]}`}
        />
        <button onClick={() => handleAdd()} className={`px-3 py-2 ${colors.bg[600]} hover:${colors.bg[700]} text-white rounded-lg transition-colors`}>
          <Plus size={18} />
        </button>
      </div>

      {/* Common Suggestions */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {COMMON_FEATURES.filter(f => !features[f]).map(f => (
          <button
            key={f}
            onClick={() => handleAdd(f)}
            className="px-2 py-1 text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md text-slate-500 hover:text-indigo-500 hover:border-indigo-200 transition-colors"
          >
            + {f}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.keys(features).map((feature) => (
          <span key={feature} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-medium shadow-sm">
            {feature}
            <button onClick={() => handleDelete(feature)} className="text-slate-400 hover:text-rose-500"><X size={12} /></button>
          </span>
        ))}
        {Object.keys(features).length === 0 && <span className="text-xs text-slate-400 italic px-2">No features listed</span>}
      </div>
    </div>
  );
};

const LimitEditor: React.FC<{ limits: Record<string, any>; onChange: (l: Record<string, any>) => void }> = ({ limits, onChange }) => {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const { colors } = useThemeColors();

  const handleAdd = (key: string = newKey, val: string = newValue) => {
    if (key.trim() && val.trim()) {
      const numVal = !isNaN(Number(val)) ? Number(val) : val;
      onChange({ ...limits, [key.trim()]: numVal });
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
    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Zap size={14} /> Limits / Quotas
      </label>
      <div className="grid grid-cols-5 gap-2 mb-3">
        <input type="text" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="Limit Name" className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2" />
        <input type="text" value={newValue} onChange={(e) => setNewValue(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAdd()} placeholder="Value" className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2" />
        <button onClick={() => handleAdd()} className={`col-span-1 flex items-center justify-center ${colors.bg[600]} text-white rounded-lg`}><Plus size={18} /></button>
      </div>
      {/* Common Limits Suggestions */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {COMMON_LIMITS.filter(l => limits[l] === undefined).map(l => (
          <button
            key={l}
            onClick={() => { setNewKey(l); }}
            className="px-2 py-1 text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md text-slate-500 hover:text-amber-500 hover:border-amber-200 transition-colors"
          >
            {l}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(limits).map(([key, value]) => (
          <span key={key} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold">
            {key}: <span className={colors.text[600]}>{value}</span>
            <button onClick={() => handleDelete(key)} className="text-slate-500 hover:text-rose-500"><X size={12} /></button>
          </span>
        ))}
      </div>
    </div>
  );
};

// --- Main Plans Component ---

const Plans: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { colors } = useThemeColors();

  // State
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [licenses, setLicenses] = useState<LicenseKey[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast>({ open: false, message: '', type: 'success' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const [formData, setFormData] = useState<FormData>({
    name: '', durationMonths: 12, prices: [], features: {}, limits: {}, isActive: true, deviceLimit: 1
  });

  // Fetch Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, currenciesRes, licensesRes] = await Promise.all([
        api.getPlans(),
        api.getCurrencies(),
        api.getLicenses().catch(e => [])
      ]);
      setPlans(Array.isArray(plansRes) ? plansRes : (plansRes as any)?.plans || []);
      setCurrencies(Array.isArray(currenciesRes) ? currenciesRes : (currenciesRes as any)?.currencies || []);
      setLicenses(Array.isArray(licensesRes) ? licensesRes : []);
    } catch (err: any) {
      setToast({ open: true, message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Handlers
  const handleOpenModal = (plan?: SubscriptionPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        durationMonths: plan.durationMonths || 12,
        prices: plan.prices || [],
        features: plan.features || {},
        limits: plan.limits || {},
        isActive: plan.isActive,
        deviceLimit: plan.deviceLimit || 1
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        durationMonths: 12,
        prices: [{ currency: currencies[0]?.code || 'IQD', monthlyPrice: 0, periodPrice: 0, yearlyPrice: 0, discount: 0, isPrimary: true }],
        features: {},
        limits: {},
        isActive: true,
        deviceLimit: 1
      });
    }
    setModalOpen(true);
  };


  const handleDuplicate = (plan: SubscriptionPlan) => {
    setEditingPlan(null); // Create mode
    setFormData({
      name: `${plan.name} (Copy)`,
      durationMonths: plan.durationMonths || 12,
      prices: plan.prices || [],
      features: plan.features || {},
      limits: plan.limits || {},
      isActive: true,
      deviceLimit: plan.deviceLimit || 1
    });
    setModalOpen(true);
    setToast({ open: true, message: 'Plan copied. Review and save.', type: 'success' });
  };

  const handlePriceChange = (index: number, field: keyof PlanPrice, value: any) => {
    const newPrices = [...formData.prices];
    newPrices[index] = { ...newPrices[index], [field]: value };

    // Auto Calculate
    if (field === 'monthlyPrice' || field === 'discount') {
      const monthly = field === 'monthlyPrice' ? Number(value) : newPrices[index].monthlyPrice;
      const discount = field === 'discount' ? Number(value) : newPrices[index].discount;
      const duration = formData.durationMonths || 12;

      const totalRaw = monthly * duration;
      const discountedTotal = totalRaw - (totalRaw * (discount / 100));

      newPrices[index].periodPrice = Math.round(discountedTotal);
      newPrices[index].yearlyPrice = Math.round((monthly * 12) - ((monthly * 12) * (discount / 100)));
    }
    setFormData({ ...formData, prices: newPrices });
  };

  const handleSubmit = async () => {
    if (!formData.name) return setToast({ open: true, message: 'Name is required', type: 'error' });

    setSaving(true);
    try {
      const payload = { ...formData, durationMonths: Number(formData.durationMonths) };
      if (editingPlan) {
        await api.updatePlan(editingPlan.id, payload);
        setToast({ open: true, message: 'Plan updated successfully', type: 'success' });
      } else {
        await api.createPlan(payload);
        setToast({ open: true, message: 'New plan created successfully', type: 'success' });
      }
      await fetchData();
      setModalOpen(false);
    } catch (err: any) {
      setToast({ open: true, message: 'Operation failed', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (plan: SubscriptionPlan) => {
    try {
      await api.togglePlanStatus(plan.id, plan.isActive ? 'deactivate' : 'activate');
      // Optimistic update
      setPlans(plans.map(p => p.id === plan.id ? { ...p, isActive: !p.isActive } : p));
      setToast({ open: true, message: `Plan ${plan.isActive ? 'deactivated' : 'activated'}`, type: 'success' });
    } catch (err) {
      setToast({ open: true, message: 'Failed to update status', type: 'error' });
      fetchData(); // Revert on error
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this plan? This action cannot be undone.')) return;
    try {
      await api.deletePlan(id);
      setPlans(plans.filter(p => p.id !== id));
      setToast({ open: true, message: 'Plan deleted', type: 'success' });
    } catch (e) {
      setToast({ open: true, message: 'Failed to delete plan', type: 'error' });
    }
  };

  // Filter Logic
  const filteredPlans = plans.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' ? true : (filterStatus === 'active' ? p.isActive : !p.isActive);
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">

      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <span className={`bg-gradient-to-r ${colors.gradient} text-transparent bg-clip-text`}>
              {t('plans.title')}
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Manage your subscription tiers, limits, and pricing strategies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Stats */}
          <div className="hidden md:flex gap-4 mr-4 text-sm font-bold text-slate-500">
            <span className="flex items-center gap-1"><Layers size={16} /> {plans.length} Total</span>
            <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 size={16} /> {plans.filter(p => p.isActive).length} Active</span>
          </div>

          <button
            onClick={() => handleOpenModal()}
            className={`flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r ${colors.gradient} hover:opacity-90 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all font-bold transform hover:-translate-y-0.5`}
          >
            <Plus size={18} strokeWidth={3} /> {t('plans.add')}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-2 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-2">
        <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
          {['all', 'active', 'inactive'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s as any)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${filterStatus === s ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search plans by name..."
            className="w-full pl-10 pr-4 py-2.5 bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none"
          />
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader className={`w-10 h-10 ${colors.text[600]} animate-spin mb-4`} />
          <p className="text-slate-400 font-medium">Loading subscription plans...</p>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
          <div className={`w-16 h-16 mx-auto rounded-full ${colors.bg[50]} flex items-center justify-center mb-4`}>
            <LayoutGrid className={colors.text[500]} size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No plans found</h3>
          <p className="text-slate-500 text-sm mt-1">Try adjusting your search or create a new plan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => {
            const primaryPrice = plan.prices.find(p => p.isPrimary) || plan.prices[0];
            const activeLicenses = licenses.filter(l => l.planId === plan.id && l.status === 'active').length;

            return (
              <div
                key={plan.id}
                className={`group relative flex flex-col bg-white dark:bg-slate-800 rounded-3xl border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden ${plan.isActive ? 'border-slate-200 dark:border-slate-700' : 'border-slate-100 dark:border-slate-800 opacity-75 grayscale-[0.5] hover:grayscale-0'}`}
              >
                {/* Active Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={() => handleToggleStatus(plan)}
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm transition-all ${plan.isActive
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                  >
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>

                {/* Card Header */}
                <div className={`p-6 bg-gradient-to-br ${plan.isActive ? colors.lightGradient : 'from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900'}`}>
                  <div className="mb-6">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">{plan.name}</h3>
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {plan.durationMonths} Mo</span>
                      {activeLicenses > 0 && <span className="flex items-center gap-1 text-emerald-600"><Users size={12} /> {activeLicenses} Subs</span>}
                    </div>
                  </div>

                  {/* Price Display */}
                  {primaryPrice && (
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-black ${colors.text[700]}`}>
                        {primaryPrice.periodPrice.toLocaleString()}
                      </span>
                      <span className="text-sm font-bold text-slate-400">{primaryPrice.currency}</span>
                    </div>
                  )}
                  {plan.prices.length > 1 && (
                    <div className="mt-2 text-xs text-slate-400 font-medium">
                      + {plan.prices.length - 1} other currencies available
                    </div>
                  )}
                </div>

                {/* Features & Limits */}
                <div className="p-6 flex-1 flex flex-col gap-6">
                  {/* Limits Mini Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Device Limit Badge */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700/50 text-center">
                      <div className={`text-sm font-black ${colors.text[600]}`}>{plan.deviceLimit || 1}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold truncate">Max Devices</div>
                    </div>
                    {Object.entries(plan.limits).slice(0, 3).map(([k, v]) => (
                      <div key={k} className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700/50 text-center">
                        <div className={`text-sm font-black ${colors.text[600]}`}>{v}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold truncate">{k}</div>
                      </div>
                    ))}
                  </div>

                  {/* Features List */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Includes</p>
                    <ul className="space-y-2">
                      {Object.keys(plan.features).slice(0, 5).map(f => (
                        <li key={f} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                          <CheckCircle2 size={16} className={`mt-0.5 ${colors.text[500]} shrink-0`} />
                          <span className="capitalize">{f.replace(/([A-Z])/g, ' $1').trim()}</span>
                        </li>
                      ))}
                      {Object.keys(plan.features).length > 5 && (
                        <li className="text-xs text-slate-400 font-medium pl-6">
                          + {Object.keys(plan.features).length - 5} more features
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-700/50 flex gap-2 bg-slate-50/50 dark:bg-slate-900/30">
                  <button
                    onClick={() => handleOpenModal(plan)}
                    className="flex-1 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm shadow-sm hover:border-indigo-300 transition-all flex items-center justify-center gap-2 group/edit"
                  >
                    <Edit2 size={14} className="group-hover/edit:text-indigo-500" /> Edit
                  </button>
                  <button
                    onClick={() => handleDuplicate(plan)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 hover:border-indigo-200 transition-all"
                    title="Duplicate Plan"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all"
                    title="Delete Plan"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- Create/Edit Modal --- */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  {editingPlan ? 'Edit Plan' : 'Create New Plan'}
                </h2>
                <p className="text-sm text-slate-500">Configure pricing tiers, features, and limitations.</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column: Basic Info & Prices */}
                <div className="lg:col-span-7 space-y-8">

                  {/* Templates (Only for New) */}
                  {!editingPlan && (
                    <div className="p-5 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
                      <div className="flex items-center gap-2 mb-3 text-indigo-800 dark:text-indigo-300 font-bold text-xs uppercase tracking-wide">
                        <Zap size={14} /> Quick Start Templates
                      </div>
                      <div className="flex gap-2">
                        {DEFAULT_TEMPLATES.map(tpl => (
                          <button
                            key={tpl.name}
                            onClick={() => setFormData({ ...tpl, isActive: true })}
                            className="px-4 py-2 bg-white dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-200 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all"
                          >
                            {tpl.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Basic Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Plan Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Gold Tier"
                        className={`w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white transition-all outline-none focus:ring-2 ${colors.ring[500]}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Duration (Months)</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.durationMonths}
                        onChange={e => setFormData({ ...formData, durationMonths: Number(e.target.value) })}
                        className={`w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white transition-all outline-none focus:ring-2 ${colors.ring[500]}`}
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <LayoutGrid size={14} /> Device Limit
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={formData.deviceLimit}
                          onChange={e => setFormData({ ...formData, deviceLimit: Number(e.target.value) })}
                          className={`w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white transition-all outline-none focus:ring-2 ${colors.ring[500]}`}
                        />
                        <p className="text-[10px] text-slate-500 mt-1">Number of devices allowed per license.</p>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Section */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <DollarSign size={16} /> Pricing Configuration
                      </label>
                      <button
                        onClick={() => setFormData({ ...formData, prices: [...formData.prices, { currency: 'IQD', monthlyPrice: 0, periodPrice: 0, yearlyPrice: 0, discount: 0, isPrimary: false }] })}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg ${colors.bg[50]} ${colors.text[600]} hover:${colors.bg[100]} transition-colors`}
                      >
                        + Add Currency
                      </button>
                    </div>

                    <div className="space-y-3">
                      {formData.prices.map((p, i) => (
                        <div key={i} className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative group">
                          <div className="absolute top-4 right-4 flex gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            {!p.isPrimary && (
                              <button onClick={() => {
                                const newPrices = formData.prices.map((pr, idx) => ({ ...pr, isPrimary: idx === i }));
                                setFormData({ ...formData, prices: newPrices });
                              }} className="p-1.5 text-slate-400 hover:text-amber-500 bg-slate-50 dark:bg-slate-900 rounded-md" title="Set Primary">
                                <Tag size={14} />
                              </button>
                            )}
                            <button onClick={() => {
                              const newPrices = [...formData.prices]; newPrices.splice(i, 1); setFormData({ ...formData, prices: newPrices })
                            }} className="p-1.5 text-slate-400 hover:text-rose-500 bg-slate-50 dark:bg-slate-900 rounded-md" title="Remove">
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${p.isPrimary ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                              {p.currency.substring(0, 2)}
                            </div>
                            <div>
                              <select
                                value={p.currency}
                                onChange={e => handlePriceChange(i, 'currency', e.target.value)}
                                className="text-sm font-bold bg-transparent outline-none cursor-pointer hover:underline"
                              >
                                {currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                              </select>
                              <div className="text-xs text-slate-400 font-medium">
                                {p.isPrimary ? 'Primary Currency' : 'Secondary Currency'}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Monthly Price</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={p.monthlyPrice}
                                  onChange={e => handlePriceChange(i, 'monthlyPrice', e.target.value)}
                                  className="w-full pl-3 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none focus:border-indigo-500"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Discount %</label>
                              <input
                                type="number"
                                value={p.discount}
                                onChange={e => handlePriceChange(i, 'discount', e.target.value)}
                                className="w-full pl-3 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none focus:border-indigo-500"
                              />
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs">
                            <span className="text-slate-500">Calculated Total:</span>
                            <span className={`font-black text-lg ${colors.text[600]}`}>
                              {p.periodPrice.toLocaleString()} {p.currency}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Features & Limits */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 h-full">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white mb-6 uppercase tracking-wider">Plan Capabilities</h3>
                    <div className="space-y-6">
                      <FeatureEditor features={formData.features} onChange={f => setFormData({ ...formData, features: f })} />
                      <LimitEditor limits={formData.limits} onChange={l => setFormData({ ...formData, limits: l })} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className={`px-8 py-2.5 rounded-xl text-white font-bold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all transform hover:-translate-y-0.5 ${colors.bg[600]}`}
              >
                {saving ? <div className="flex items-center gap-2"><Loader className="animate-spin" size={16} /> Saving...</div> : 'Save Plan Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast({ ...toast, open: false })} isRtl={isRtl} />
    </div>
  );
};

export default Plans;