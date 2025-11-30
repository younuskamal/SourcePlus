
import React, { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Copy, Check, X, Loader, AlertCircle,
  CheckCircle2, XCircle, Eye, EyeOff, ShieldCheck, Zap, Globe,
  AlertTriangle, LayoutTemplate, Save, Calendar, Coins, Calculator, Star
} from 'lucide-react';
import { api } from '../services/api';
import { CurrencyRate, SubscriptionPlan, PlanPrice } from '../types';
import { useTranslation } from '../hooks/useTranslation';

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
        {toast.type === 'success' ? (
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
        ) : (
          <XCircle className="w-5 h-5 flex-shrink-0" />
        )}
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
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] transition-opacity" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`pointer-events-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700 flex flex-col`}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <div className="p-6 text-center">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDestructive ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{message}</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex gap-3 rounded-b-2xl">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 font-bold transition-colors text-sm"
            >
              {cancelLabel}
            </button>
            <button
              onClick={() => { onConfirm(); onClose(); }}
              className={`flex-1 px-4 py-2.5 rounded-xl text-white font-bold transition-colors text-sm shadow-lg ${isDestructive
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                : 'bg-primary-600 hover:bg-primary-700 shadow-primary-600/20'}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ============ Feature Editor Component ============
const FeatureEditor: React.FC<{
  features: Record<string, any>;
  onChange: (features: Record<string, any>) => void;
  label: string;
  isRtl: boolean;
}> = ({ features, onChange, label, isRtl }) => {
  const [newFeature, setNewFeature] = useState('');

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
        <input
          type="text"
          value={newFeature}
          onChange={(e) => setNewFeature(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add feature (e.g. Offline Mode)..."
          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm transition-all shadow-sm"
        />
        <button
          onClick={handleAdd}
          className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center gap-1.5 shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 min-h-[40px]">
        {Object.keys(features).length > 0 ? (
          Object.keys(features).map((feature) => (
            <div
              key={feature}
              className="group animate-in zoom-in-95 duration-200 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 shadow-sm"
            >
              <span className="text-xs font-medium">{feature}</span>
              <button
                onClick={() => handleDelete(feature)}
                className="text-slate-400 hover:text-rose-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
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

// ============ Limit Editor Component ============
const LimitEditor: React.FC<{
  limits: Record<string, any>;
  onChange: (limits: Record<string, any>) => void;
  label: string;
  isRtl: boolean;
}> = ({ limits, onChange, label, isRtl }) => {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

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
        <input
          type="text"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="Key (e.g. users)"
          className="col-span-3 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm transition-all shadow-sm"
        />
        <input
          type="number"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Val"
          className="col-span-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm transition-all shadow-sm"
        />
        <button
          onClick={handleAdd}
          className="col-span-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 min-h-[40px]">
        {Object.keys(limits).length > 0 ? (
          Object.entries(limits).map(([key, value]) => (
            <div
              key={key}
              className="group animate-in zoom-in-95 duration-200 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 shadow-sm"
            >
              <span className="text-xs font-medium"><span className="text-slate-400">{key}:</span> {value}</span>
              <button
                onClick={() => handleDelete(key)}
                className="text-slate-400 hover:text-rose-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        ) : (
          <div className="w-full text-center py-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
            <p className="text-xs text-slate-400 italic">No limits added yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============ Modal Component ============
const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  isRtl: boolean;
}> = ({ isOpen, onClose, title, subtitle, children, isRtl }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`pointer-events-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700 flex flex-col`}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-700 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">{children}</div>
        </div>
      </div>
    </>
  );
};

// ============ Plans Page Component ============
const Plans: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast>({ open: false, message: '', type: 'success' });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; name: string } | null>(null);
  const [customTemplates, setCustomTemplates] = useState<any[]>([]);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    durationMonths: 12,
    prices: [],
    features: {},
    limits: {},
    isActive: true
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, currenciesRes] = await Promise.all([
        api.getPlans(),
        api.getCurrencies()
      ]);
      setPlans(plansRes);
      setCurrencies(currenciesRes);
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch data', err);
      const msg = err.message || 'Failed to load plans';
      setError(msg);
      setToast({ open: true, message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const savedTemplates = localStorage.getItem('sourceplus_plan_templates');
    if (savedTemplates) {
      try {
        setCustomTemplates(JSON.parse(savedTemplates));
      } catch (e) {
        console.error('Failed to parse templates', e);
      }
    }
  }, []);

  const handleOpenModal = (plan?: SubscriptionPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        durationMonths: plan.durationMonths || 12,
        prices: plan.prices || [],
        features: plan.features || {},
        limits: plan.limits || {},
        isActive: plan.isActive
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        durationMonths: 12,
        prices: currencies.length > 0 ? [{ currency: currencies[0].code, monthlyPrice: 0, periodPrice: 0, yearlyPrice: 0, discount: 0, isPrimary: true }] : [{ currency: 'IQD', monthlyPrice: 0, periodPrice: 0, yearlyPrice: 0, discount: 0, isPrimary: true }],
        features: {},
        limits: {},
        isActive: true
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingPlan(null);
  };

  const handleTemplateSelect = (template: any) => {
    setFormData({
      ...formData,
      name: template.name,
      durationMonths: template.durationMonths || 12,
      prices: template.prices || [],
      features: template.features,
      limits: template.limits
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || formData.prices.length === 0) {
      setToast({ open: true, message: 'Please fill in all required fields and at least one price', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        durationMonths: Number(formData.durationMonths),
        prices: formData.prices.map(p => ({
          currency: p.currency,
          monthlyPrice: Number(p.monthlyPrice),
          periodPrice: Number(p.periodPrice),
          yearlyPrice: Number(p.yearlyPrice),
          discount: Number(p.discount),
          isPrimary: p.isPrimary
        })),
        features: formData.features,
        limits: formData.limits,
        isActive: formData.isActive
      };

      if (editingPlan) {
        await api.updatePlan(editingPlan.id, payload);
        setToast({ open: true, message: 'Plan updated successfully', type: 'success' });
      } else {
        await api.createPlan(payload);
        setToast({ open: true, message: 'Plan created successfully', type: 'success' });
      }

      await fetchData();
      handleCloseModal();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to save plan';
      setToast({ open: true, message: msg, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteConfirm({ open: true, id, name });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await api.deletePlan(deleteConfirm.id);
      setToast({ open: true, message: 'Plan deleted successfully', type: 'success' });
      await fetchData();
    } catch (err: any) {
      const msg = err.message || 'Failed to delete plan';
      setToast({ open: true, message: msg, type: 'error' });
    }
  };

  const handleToggleStatus = async (plan: SubscriptionPlan) => {
    try {
      const action = plan.isActive ? 'deactivate' : 'activate';
      await api.togglePlanStatus(plan.id, action);
      setToast({
        open: true,
        message: `Plan ${action === 'activate' ? 'activated' : 'deactivated'} successfully`,
        type: 'success'
      });
      await fetchData();
    } catch (err: any) {
      const msg = err.message || 'Failed to update plan status';
      setToast({ open: true, message: msg, type: 'error' });
    }
  };

  const handleDuplicate = async (plan: SubscriptionPlan) => {
    try {
      const payload = {
        name: `${plan.name} (Copy)`,
        durationMonths: plan.durationMonths,
        prices: plan.prices,
        features: plan.features,
        limits: plan.limits,
        isActive: false
      };
      await api.createPlan(payload);
      setToast({ open: true, message: 'Plan duplicated successfully', type: 'success' });
      await fetchData();
    } catch (err: any) {
      const msg = err.message || 'Failed to duplicate plan';
      setToast({ open: true, message: msg, type: 'error' });
    }
  };

  const handleAddPrice = () => {
    setFormData({
      ...formData,
      prices: [...formData.prices, { currency: currencies[0]?.code || 'IQD', monthlyPrice: 0, periodPrice: 0, yearlyPrice: 0, discount: 0, isPrimary: false }]
    });
  };

  const handleRemovePrice = (index: number) => {
    const newPrices = [...formData.prices];
    newPrices.splice(index, 1);
    setFormData({ ...formData, prices: newPrices });
  };

  const handlePriceChange = (index: number, field: keyof PlanPrice, value: any) => {
    const newPrices = [...formData.prices];
    newPrices[index] = { ...newPrices[index], [field]: value };

    // Auto-calculate logic
    if (field === 'monthlyPrice' || field === 'discount') {
      const monthly = field === 'monthlyPrice' ? Number(value) : newPrices[index].monthlyPrice;
      const discount = field === 'discount' ? Number(value) : newPrices[index].discount;
      const duration = formData.durationMonths;

      const basePeriodPrice = monthly * duration;
      const baseYearlyPrice = monthly * 12;

      const discountedPeriodPrice = basePeriodPrice - (basePeriodPrice * (discount / 100));
      const discountedYearlyPrice = baseYearlyPrice - (baseYearlyPrice * (discount / 100));

      newPrices[index].periodPrice = discountedPeriodPrice;
      newPrices[index].yearlyPrice = discountedYearlyPrice;
    }

    setFormData({ ...formData, prices: newPrices });
  };

  const handleDurationChange = (months: number) => {
    // Recalculate all prices based on new duration
    const newPrices = formData.prices.map(price => {
      const monthly = price.monthlyPrice;
      const discount = price.discount;
      const duration = months;

      const basePeriodPrice = monthly * duration;
      const baseYearlyPrice = monthly * 12;

      const discountedPeriodPrice = basePeriodPrice - (basePeriodPrice * (discount / 100));
      const discountedYearlyPrice = baseYearlyPrice - (baseYearlyPrice * (discount / 100));

      return {
        ...price,
        periodPrice: discountedPeriodPrice,
        yearlyPrice: discountedYearlyPrice
      };
    });

    setFormData({ ...formData, durationMonths: months, prices: newPrices });
  };

  const handleSetPrimary = (index: number) => {
    const newPrices = formData.prices.map((p, i) => ({
      ...p,
      isPrimary: i === index
    }));
    setFormData({ ...formData, prices: newPrices });
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {t('plans.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your subscription tiers, pricing, and features
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-md shadow-primary-600/20 transition-all active:scale-95 text-sm font-bold"
        >
          <Plus size={16} /> {t('plans.add')}
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 flex gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-rose-900 dark:text-rose-200">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader className="w-10 h-10 text-primary-500 animate-spin mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Loading plans...</p>
        </div>
      ) : plans.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-full mb-4">
            <ShieldCheck className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            No Plans Yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 text-center max-w-sm">
            Create your first subscription plan to start selling licenses.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('plans.add')}
          </button>
        </div>
      ) : (
        /* Plans Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className="group relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 overflow-hidden flex flex-col"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Status Indicator */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${plan.isActive ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-slate-200 dark:bg-slate-700'}`} />

              {/* Content */}
              <div className="p-6 flex-1">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                      {plan.name}
                    </h3>
                    <div className="flex gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                        <Calendar size={10} /> {plan.durationMonths} Months
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${plan.isActive
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                          }`}
                      >
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl text-primary-600 dark:text-primary-400">
                    <ShieldCheck size={20} />
                  </div>
                </div>

                {/* Pricing */}
                <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4 mb-5 border border-slate-100 dark:border-slate-700/50">
                  {plan.prices && plan.prices.length > 0 ? (
                    <div className="space-y-2">
                      {plan.prices.map((price, idx) => (
                        <div key={idx} className={`flex justify-between items-center text-sm ${price.isPrimary ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                          <div className="flex items-center gap-1">
                            <span>{price.currency}</span>
                            {price.isPrimary && <Star size={10} className="text-amber-500 fill-amber-500" />}
                          </div>
                          <div className="flex flex-col items-end">
                            <span>{price.periodPrice.toLocaleString()}</span>
                            {price.discount > 0 && (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 rounded-full">
                                -{price.discount}%
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No prices defined</p>
                  )}
                </div>

                {/* Features */}
                <div className="mb-5">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    {t('plans.features')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(plan.features || {}).length > 0 ? (
                      Object.keys(plan.features).map((f) => (
                        <span
                          key={f}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-medium shadow-sm"
                        >
                          <Check size={10} className="text-emerald-500" /> {f}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No features defined</p>
                    )}
                  </div>
                </div>

                {/* Limits */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Limits
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(plan.limits || {}).length > 0 ? (
                      Object.entries(plan.limits).map(([k, v]) => (
                        <span
                          key={k}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-medium shadow-sm"
                        >
                          <Zap size={10} className="text-amber-500" /> {k}: {v}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No limits defined</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex gap-2">
                <button
                  onClick={() => handleToggleStatus(plan)}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${plan.isActive
                    ? 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                    : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                    }`}
                  title={plan.isActive ? 'Deactivate' : 'Activate'}
                >
                  {plan.isActive ? (
                    <>
                      <EyeOff size={14} /> Hide
                    </>
                  ) : (
                    <>
                      <Eye size={14} /> Publish
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDuplicate(plan)}
                  className="inline-flex items-center justify-center p-2 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                  title="Duplicate"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={() => handleOpenModal(plan)}
                  className="inline-flex items-center justify-center p-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                  title="Edit"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDeleteClick(plan.id, plan.name)}
                  className="inline-flex items-center justify-center p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingPlan ? t('plans.edit') : t('plans.add')}
        subtitle={editingPlan ? 'Update plan details and pricing' : 'Set up a new subscription tier'}
        isRtl={isRtl}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Form */}
          <div className="space-y-5">
            {/* Quick Templates */}
            {!editingPlan && (
              <div className="space-y-3">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-300 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <Zap size={12} /> {t('plans.quickTemplates')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_TEMPLATES.map((t) => (
                      <button
                        key={t.name}
                        onClick={() => handleTemplateSelect(t)}
                        className="px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-colors text-xs font-bold shadow-sm"
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Plan Name */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('plans.name')}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                placeholder="e.g. Gold Plan"
              />
            </div>

            {/* Duration Selector */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Duration (Months)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[6, 12].map(months => (
                  <button
                    key={months}
                    onClick={() => handleDurationChange(months)}
                    className={`px-4 py-2.5 rounded-xl border font-bold text-sm transition-all ${formData.durationMonths === months
                      ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-600/20'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                  >
                    {months} Months
                  </button>
                ))}
                <div className="relative">
                  <input
                    type="number"
                    value={formData.durationMonths}
                    onChange={(e) => handleDurationChange(Number(e.target.value))}
                    className={`w-full px-4 py-2.5 rounded-xl border font-bold text-sm outline-none transition-all text-center ${![6, 12].includes(formData.durationMonths)
                      ? 'border-primary-600 ring-2 ring-primary-500/20 bg-white dark:bg-slate-900'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
                      }`}
                    placeholder="Custom"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                    Custom
                  </span>
                </div>
              </div>
            </div>

            {/* Multi-Currency Pricing */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-3">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Coins size={14} /> Pricing
                </label>
                <button
                  onClick={handleAddPrice}
                  className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <Plus size={12} /> Add Currency
                </button>
              </div>

              <div className="space-y-4">
                {formData.prices.map((price, index) => (
                  <div key={index} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm animate-in slide-in-from-left-2 relative">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={price.currency}
                          onChange={(e) => handlePriceChange(index, 'currency', e.target.value)}
                          className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          {currencies.map(c => (
                            <option key={c.code} value={c.code}>{c.code}</option>
                          ))}
                          {!currencies.some(c => c.code === price.currency) && (
                            <option value={price.currency}>{price.currency}</option>
                          )}
                        </select>
                        <button
                          onClick={() => handleSetPrimary(index)}
                          className={`p-1 rounded-full transition-colors ${price.isPrimary ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-slate-300 hover:text-amber-400'}`}
                          title="Set as Primary Currency"
                        >
                          <Star size={14} className={price.isPrimary ? 'fill-amber-500' : ''} />
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemovePrice(index)}
                        className="text-slate-400 hover:text-rose-500 transition-colors"
                        disabled={formData.prices.length === 1}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Monthly Price</label>
                        <input
                          type="number"
                          value={price.monthlyPrice}
                          onChange={(e) => handlePriceChange(index, 'monthlyPrice', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Discount %</label>
                        <input
                          type="number"
                          value={price.discount}
                          onChange={(e) => handlePriceChange(index, 'discount', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="0%"
                        />
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{formData.durationMonths} Months: <strong className="text-slate-900 dark:text-white">{price.periodPrice.toLocaleString()}</strong></span>
                      <span>Yearly: <strong className="text-slate-900 dark:text-white">{price.yearlyPrice.toLocaleString()}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Features & Limits */}
          <div className="space-y-5">
            <FeatureEditor
              label={t('plans.features')}
              features={formData.features}
              onChange={(f) => setFormData({ ...formData, features: f })}
              isRtl={isRtl}
            />

            <LimitEditor
              label="Limits"
              limits={formData.limits}
              onChange={(l) => setFormData({ ...formData, limits: l })}
              isRtl={isRtl}
            />

            {/* Preview Card */}
            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 text-center">
                {t('plans.livePreview')}
              </p>
              <div className="max-w-xs mx-auto bg-white dark:bg-slate-800 rounded-2xl border border-primary-500 shadow-xl shadow-primary-500/10 overflow-hidden transform scale-95">
                <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
                <div className="p-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 text-center">
                    {formData.name || 'Plan Name'}
                  </h3>
                  <div className="flex justify-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                      <Calendar size={10} /> Billed every {formData.durationMonths} months
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4 mb-5 text-center">
                    {formData.prices.length > 0 ? (
                      <div className="space-y-2">
                        {formData.prices.filter(p => p.isPrimary).map((p, i) => (
                          <div key={i}>
                            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                              {p.currency} {p.periodPrice.toLocaleString()}
                            </div>
                            {p.discount > 0 && (
                              <div className="text-xs text-emerald-600 font-bold mt-1">
                                Save {p.discount}%
                              </div>
                            )}
                          </div>
                        ))}
                        {formData.prices.filter(p => !p.isPrimary).length > 0 && (
                          <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-600 text-xs text-slate-500">
                            Also available in: {formData.prices.filter(p => !p.isPrimary).map(p => p.currency).join(', ')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-2xl font-extrabold text-slate-900 dark:text-white">0</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {Object.keys(formData.features).slice(0, 3).map(f => (
                      <div key={f} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <CheckCircle2 size={12} className="text-emerald-500" /> {f}
                      </div>
                    ))}
                    {Object.keys(formData.features).length > 3 && (
                      <p className="text-xs text-slate-400 text-center italic">+ {Object.keys(formData.features).length - 3} more features</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
          <button
            onClick={handleCloseModal}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold transition-colors text-sm"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary-600/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          >
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editingPlan ? 'Update Plan' : 'Create Plan'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title={t('plans.deleteConfirm')}
        message={`Are you sure you want to delete ${deleteConfirm?.name}? This action cannot be undone.`}
        isRtl={isRtl}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        isDestructive
      />

      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast({ ...toast, open: false })} isRtl={isRtl} />
    </div>
  );
};

export default Plans;
