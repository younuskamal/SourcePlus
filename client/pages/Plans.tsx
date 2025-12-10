import React, { useState, useEffect } from 'react';
import {
  Edit2, Check, X, Loader, AlertTriangle,
  CheckCircle2, Zap, LayoutGrid, DollarSign,
  Shield, Calendar, Tag, Trash2, Infinity, Plus
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
  id?: string;
  name: string;
  durationMonths: number;
  prices: PlanPrice[];
  features: Record<string, any>;
  limits: Record<string, any>;
  isActive: boolean;
  deviceLimit: number;
}

// --- Constants ---
const FIXED_SLOTS = [
  { defaultName: 'Starter', color: 'blue', description: 'Essential features for small businesses' },
  { defaultName: 'Professional', color: 'indigo', description: 'Advanced tools for growing companies' },
  { defaultName: 'Enterprise', color: 'emerald', description: 'Maximum power and unlimited potential' }
];

// Added requested features: customers, suppliers, purchase_orders
const COMMON_FEATURES = ['pos', 'inventory', 'reports', 'customers', 'suppliers', 'purchase_orders', 'support', 'api', 'backups', 'dashboard_access'];
const COMMON_LIMITS = ['maxUsers', 'maxBranches', 'maxInvoices', 'maxProducts', 'maxCustomers'];

// --- Theme Hook ---
const useThemeColors = () => {
  const { primaryColor } = useSystem();
  // Default to indigo for a neutral premium feel if not specified
  const colors = {
    bg: { 50: 'bg-slate-50', 100: 'bg-slate-100', 600: 'bg-indigo-600', 700: 'bg-indigo-700' },
    text: { 600: 'text-indigo-600', 700: 'text-indigo-700' },
    ring: { 500: 'focus:ring-indigo-500' }
  };
  return { colors };
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
      </div>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={newFeature}
          onChange={(e) => setNewFeature(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="e.g. Free Domain"
          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button onClick={() => handleAdd()} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
          <Plus size={18} />
        </button>
      </div>

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
      </div>
    </div>
  );
};

const LimitEditor: React.FC<{ limits: Record<string, any>; onChange: (l: Record<string, any>) => void }> = ({ limits, onChange }) => {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleAdd = () => {
    if (newKey.trim() && newValue.trim()) {
      const numVal = newValue.toLowerCase() === 'infinity' || newValue === '∞' ? -1 : Number(newValue);
      onChange({ ...limits, [newKey.trim()]: isNaN(numVal) ? newValue : numVal });
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
        <div className="col-span-2 relative">
          <input type="text" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="Limit Name" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="col-span-2 relative">
          <input type="text" value={newValue} onChange={(e) => setNewValue(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAdd()} placeholder="Value (∞ for Unlimited)" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button onClick={() => setNewValue('∞')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500" title="Set Unlimited"><Infinity size={14} /></button>
        </div>
        <button onClick={() => handleAdd()} className="col-span-1 flex items-center justify-center bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><Plus size={18} /></button>
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {COMMON_LIMITS.filter(l => limits[l] === undefined).map(l => (
          <button
            key={l}
            onClick={() => setNewKey(l)}
            className="px-2 py-1 text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md text-slate-500 hover:text-amber-500 hover:border-amber-200 transition-colors"
          >
            {l}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(limits).map(([key, value]) => {
          const displayValue = value === -1 ? <Infinity size={14} /> : value;
          return (
            <span key={key} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold">
              {key}: <span className="text-indigo-600 dark:text-indigo-400">{displayValue}</span>
              <button onClick={() => handleDelete(key)} className="text-slate-500 hover:text-rose-500"><X size={12} /></button>
            </span>
          );
        })}
      </div>
    </div>
  );
};

// --- Main Plans Component ---

const Plans: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  // State
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast>({ open: false, message: '', type: 'success' });

  const [formData, setFormData] = useState<FormData>({
    name: '', durationMonths: 12, prices: [], features: {}, limits: {}, isActive: true, deviceLimit: 1
  });

  // Fetch Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, currenciesRes] = await Promise.all([
        api.getPlans(),
        api.getCurrencies()
      ]);
      setPlans(Array.isArray(plansRes) ? plansRes : (plansRes as any)?.plans || []);
      setCurrencies(Array.isArray(currenciesRes) ? currenciesRes : (currenciesRes as any)?.currencies || []);
    } catch (err: any) {
      setToast({ open: true, message: err.message || 'Failed to load plans', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleEdit = (planIndex: number, defaultName: string) => {
    // Try to find the plan corresponding to this "slot" by index or name match if previously created
    // A more robust way in a real app would be to store a "slotId" or "templateId" on the Plan model
    // identifying whether it is Plan 1, 2, or 3. For now, we match by name or return null.
    // However, since names are now editable, we can't reliably strict match by name if the user changed it.
    // In this simplified model, we will map the SORTED plans from API to these 3 slots.

    // Sort plans by creation time if not already sorted, to try and maintain order.
    // Ideally we'd have a 'type' field.
    const sortedPlans = [...plans].sort((a, b) => (new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()));
    const existingPlan = sortedPlans[planIndex];

    if (existingPlan) {
      setFormData({
        id: existingPlan.id,
        name: existingPlan.name,
        durationMonths: existingPlan.durationMonths || 12,
        prices: existingPlan.prices || [],
        features: existingPlan.features || {},
        limits: existingPlan.limits || {},
        isActive: existingPlan.isActive,
        deviceLimit: existingPlan.deviceLimit || 1
      });
    } else {
      // New Plan for this slot
      setFormData({
        name: defaultName,
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

  const handlePriceChange = (index: number, field: keyof PlanPrice, value: any) => {
    const newPrices = [...formData.prices];
    const numericFields = ['monthlyPrice', 'periodPrice', 'yearlyPrice', 'discount'];
    const safeValue = numericFields.includes(field) ? Number(value) : value;

    newPrices[index] = { ...newPrices[index], [field]: safeValue };

    // Auto Calculate
    if (field === 'monthlyPrice' || field === 'discount') {
      const monthly = field === 'monthlyPrice' ? safeValue : newPrices[index].monthlyPrice;
      const discount = field === 'discount' ? safeValue : newPrices[index].discount;
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
      const payload = {
        ...formData,
        durationMonths: Number(formData.durationMonths),
        deviceLimit: Number(formData.deviceLimit),
        prices: formData.prices.map(p => ({
          ...p,
          monthlyPrice: Number(p.monthlyPrice),
          periodPrice: Number(p.periodPrice),
          yearlyPrice: Number(p.yearlyPrice),
          discount: Number(p.discount)
        }))
      };

      if (formData.id) {
        await api.updatePlan(formData.id, payload);
        setToast({ open: true, message: 'Plan updated successfully', type: 'success' });
      } else {
        await api.createPlan(payload);
        setToast({ open: true, message: 'New plan initialized successfully', type: 'success' });
      }
      await fetchData();
      setModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setToast({ open: true, message: err.response?.data?.message || err.message || 'Operation failed', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
          Subscription Plans
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Configure the 3 core subscription tiers for your application.
        </p>
      </div>

      {/* 3 Fixed Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {FIXED_SLOTS.map((slot, index) => {
          // Bind Plans to Slots by creation order
          const sortedPlans = [...plans].sort((a, b) => (new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()));
          const plan = sortedPlans[index];

          const isConfigured = !!plan;
          const displayPlanName = plan ? plan.name : slot.defaultName;
          const prices = plan?.prices || [];
          const features = plan ? Object.keys(plan.features) : [];

          return (
            <div key={index} className={`relative flex flex-col bg-white dark:bg-slate-800 rounded-3xl border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden group ${isConfigured ? 'border-slate-200 dark:border-slate-700' : 'border-dashed border-slate-300 dark:border-slate-700 opacity-80'}`}>

              {/* Status Bar */}
              <div className={`h-2 w-full bg-${slot.color}-500`}></div>

              <div className="p-6 flex-1 flex flex-col">
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1 truncate" title={displayPlanName}>{displayPlanName}</h3>
                    {isConfigured && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${plan.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{slot.description}</p>
                </div>

                {/* Pricing */}
                <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                  {isConfigured && prices.length > 0 ? (
                    <div className="space-y-2">
                      {prices.slice(0, 3).map((price, idx) => (
                        <div key={idx} className="flex justify-between items-baseline">
                          <span className="text-xs font-bold text-slate-500">{price.currency}</span>
                          <span className="font-black text-slate-900 dark:text-white">{price.periodPrice.toLocaleString()}</span>
                        </div>
                      ))}
                      {prices.length > 3 && <div className="text-[10px] text-slate-400 text-right">+ {prices.length - 3} more</div>}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4 text-slate-400">
                      <Tag size={24} className="mb-2 opacity-50" />
                      <span className="text-xs font-medium">Not configured</span>
                    </div>
                  )}
                </div>

                {/* Features Preview */}
                <div className="space-y-2 mb-6 flex-1">
                  {features.length > 0 ? features.slice(0, 5).map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Check size={14} className="text-emerald-500" />
                      <span className="capitalize">{f}</span>
                    </div>
                  )) : (
                    <div className="text-xs text-slate-400 italic">No features defined</div>
                  )}
                </div>

                <button
                  onClick={() => handleEdit(index, slot.defaultName)}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${isConfigured
                    ? 'bg-white border border-slate-200 text-slate-700 hover:border-indigo-500 hover:text-indigo-600 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:hover:border-indigo-400'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20'}`}
                >
                  <Edit2 size={16} />
                  {isConfigured ? 'Edit Configuration' : 'Setup Plan'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center sticky top-0 z-10">
              <div className="flex-1 mr-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Plan Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="text-2xl font-black text-slate-900 dark:text-white bg-transparent border-none outline-none placeholder-slate-300 w-full focus:ring-0 p-0"
                  placeholder="Enter Plan Name"
                />
                <p className="text-sm text-slate-500 mt-1">Edit pricing, features, and system limits.</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-7 space-y-8">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Duration (Months)</label>
                      <input type="number" min="1" value={formData.durationMonths} onChange={e => setFormData({ ...formData, durationMonths: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Device Limit</label>
                      <input type="number" min="1" value={formData.deviceLimit} onChange={e => setFormData({ ...formData, deviceLimit: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>

                  {/* Prices */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <DollarSign size={16} /> Pricing ({formData.prices.length})
                      </label>
                      <button onClick={() => setFormData({ ...formData, prices: [...formData.prices, { currency: 'IQD', monthlyPrice: 0, periodPrice: 0, yearlyPrice: 0, discount: 0, isPrimary: false }] })} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">
                        + Add Currency
                      </button>
                    </div>
                    <div className="space-y-3">
                      {formData.prices.map((p, i) => (
                        <div key={i} className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative group">
                          <button onClick={() => { const newP = [...formData.prices]; newP.splice(i, 1); setFormData({ ...formData, prices: newP }) }} className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-rose-500"><Trash2 size={14} /></button>
                          <div className="flex gap-4">
                            <div className="w-24">
                              <label className="text-[10px] font-bold text-slate-400 mb-1 block">Currency</label>
                              <select value={p.currency} onChange={e => handlePriceChange(i, 'currency', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold py-1.5 px-2">
                                {currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                              </select>
                            </div>
                            <div className="flex-1">
                              <label className="text-[10px] font-bold text-slate-400 mb-1 block">Monthly Price</label>
                              <input type="number" value={p.monthlyPrice} onChange={e => handlePriceChange(i, 'monthlyPrice', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold py-1.5 px-2" />
                            </div>
                            <div className="w-24">
                              <label className="text-[10px] font-bold text-slate-400 mb-1 block">Discount %</label>
                              <input type="number" value={p.discount} onChange={e => handlePriceChange(i, 'discount', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold py-1.5 px-2" />
                            </div>
                          </div>
                          <div className="mt-2 text-right text-xs text-slate-500">
                            Total: <span className="font-bold text-slate-900 dark:text-white">{p.periodPrice.toLocaleString()} {p.currency}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-5 space-y-6">
                  <FeatureEditor features={formData.features} onChange={f => setFormData({ ...formData, features: f })} />
                  <LimitEditor limits={formData.limits} onChange={l => setFormData({ ...formData, limits: l })} />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
              <button onClick={() => setModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={handleSubmit} disabled={saving} className="px-8 py-2.5 rounded-xl text-white font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all">
                {saving ? <Loader className="animate-spin" /> : 'Save Changes'}
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