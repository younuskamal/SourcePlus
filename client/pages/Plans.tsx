import React, { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Copy, Check, X, Loader, AlertCircle,
  CheckCircle2, XCircle, Eye, EyeOff, ShieldCheck, Zap, Globe,
  AlertTriangle, LayoutTemplate, Save
} from 'lucide-react';
import { api } from '../services/api';
import { CurrencyRate } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface Plan {
  id: string;
  name: string;
  price_monthly: number | null;
  price_yearly: number | null;
  currency: string | null;
  features: Record<string, any>;
  limits: Record<string, any>;
  isActive: boolean;
}

interface Toast {
  open: boolean;
  message: string;
  type: 'success' | 'error';
}

interface FormData {
  name: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  features: Record<string, any>;
  limits: Record<string, any>;
  isActive: boolean;
}

const DEFAULT_TEMPLATES = [
  {
    name: 'Starter',
    price_monthly: 15000,
    price_yearly: 150000,
    currency: 'IQD',
    features: { pos: true, inventory: true },
    limits: { maxUsers: 1, maxProducts: 500, maxBranches: 1 }
  },
  {
    name: 'Professional',
    price_monthly: 35000,
    price_yearly: 350000,
    currency: 'IQD',
    features: { pos: true, inventory: true, reports: true, support: true },
    limits: { maxUsers: 5, maxProducts: 5000, maxBranches: 3 }
  },
  {
    name: 'Enterprise',
    price_monthly: 75000,
    price_yearly: 750000,
    currency: 'IQD',
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
          className={`pointer-events-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700 flex flex-col`}
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

  const [plans, setPlans] = useState<Plan[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast>({ open: false, message: '', type: 'success' });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; name: string } | null>(null);
  const [customTemplates, setCustomTemplates] = useState<any[]>([]);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    price_monthly: 0,
    price_yearly: 0,
    currency: 'IQD',
    features: {},
    limits: {},
    isActive: true
  });

  const formatPrice = (amount: number | null | undefined, currencyCode: string | null | undefined) => {
    const safeAmount = amount ?? 0;
    const safeCurrencyCode = currencyCode || 'IQD';
    const currency = currencies.find(c => c.code === safeCurrencyCode);
    const symbol = currency?.symbol || safeCurrencyCode;
    return `${symbol} ${safeAmount.toLocaleString()}`;
  };

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
      if (msg.includes('price_monthly') || msg.includes('does not exist')) {
        setError('Database Error: Missing columns. Please run "npx prisma db push" on the server.');
      }
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

  const handleOpenModal = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        price_monthly: plan.price_monthly || 0,
        price_yearly: plan.price_yearly || 0,
        currency: plan.currency || 'IQD',
        features: plan.features || {},
        limits: plan.limits || {},
        isActive: plan.isActive
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        price_monthly: 0,
        price_yearly: 0,
        currency: currencies.length > 0 ? currencies[0].code : 'IQD',
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
      ...formData, // Keep current state if needed, but usually we overwrite
      name: template.name,
      price_monthly: template.price_monthly,
      price_yearly: template.price_yearly,
      currency: currencies.some(c => c.code === template.currency) ? template.currency : (currencies[0]?.code || 'IQD'),
      features: template.features,
      limits: template.limits
    });
  };

  const handleSaveTemplate = () => {
    if (!formData.name) return;
    const newTemplate = { ...formData };
    const updated = [...customTemplates, newTemplate];
    setCustomTemplates(updated);
    localStorage.setItem('sourceplus_plan_templates', JSON.stringify(updated));
    setToast({ open: true, message: 'Template saved successfully', type: 'success' });
  };

  const handleDeleteTemplate = (index: number) => {
    const updated = customTemplates.filter((_, i) => i !== index);
    setCustomTemplates(updated);
    localStorage.setItem('sourceplus_plan_templates', JSON.stringify(updated));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.currency) {
      setToast({ open: true, message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        price_monthly: Number(formData.price_monthly),
        price_yearly: Number(formData.price_yearly),
        currency: formData.currency,
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
      if (msg.includes('price_monthly') || msg.includes('does not exist')) {
        setToast({ open: true, message: 'Database Error: Missing columns. Run migration.', type: 'error' });
      }
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

  const handleToggleStatus = async (plan: Plan) => {
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

  const handleDuplicate = async (plan: Plan) => {
    try {
      const payload = {
        name: `${plan.name} (Copy)`,
        price_monthly: plan.price_monthly,
        price_yearly: plan.price_yearly,
        currency: plan.currency,
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
            {error.includes('column') && (
              <p className="text-xs text-rose-800 dark:text-rose-300 mt-1">
                Run <code className="bg-rose-100 dark:bg-rose-900/50 px-1 py-0.5 rounded">npx prisma db push</code> on the server to fix this.
              </p>
            )}
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
                        {plan.currency || 'IQD'}
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
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                      {formatPrice(plan.price_monthly, plan.currency)}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">/ month</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    or {formatPrice(plan.price_yearly, plan.currency)} / year
                  </p>
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

                {customTemplates.length > 0 && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/50">
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-300 mb-3 uppercase tracking-wider flex items-center gap-2">
                      <LayoutTemplate size={12} /> {t('plans.customTemplates')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {customTemplates.map((t, idx) => (
                        <div key={idx} className="group relative inline-flex">
                          <button
                            onClick={() => handleTemplateSelect(t)}
                            className="px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/50 transition-colors text-xs font-bold shadow-sm pr-7"
                          >
                            {t.name}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(idx); }}
                            className="absolute right-1 top-1.5 p-0.5 text-amber-400 hover:text-rose-500 rounded-full transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Plan Name */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                {t('plans.name')} <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Professional Plan"
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                />
                {!editingPlan && (
                  <button
                    onClick={handleSaveTemplate}
                    disabled={!formData.name}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                    title={t('plans.saveAsTemplate')}
                  >
                    <Save size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Pricing */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                {t('plans.price')}
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 mb-1 block">Monthly</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 text-sm">$</span>
                    <input
                      type="number"
                      value={formData.price_monthly}
                      onChange={(e) => setFormData({ ...formData, price_monthly: Number(e.target.value) })}
                      className="w-full pl-7 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 mb-1 block">Yearly</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 text-sm">$</span>
                    <input
                      type="number"
                      value={formData.price_yearly}
                      onChange={(e) => setFormData({ ...formData, price_yearly: Number(e.target.value) })}
                      className="w-full pl-7 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
              >
                {currencies.map(c => (
                  <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>

            {/* Features & Limits */}
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

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-primary-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Live Preview */}
          <div className="hidden lg:block space-y-4">
            <div className="sticky top-6">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Eye size={16} /> {t('plans.livePreview')}
              </h3>

              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden flex flex-col transform transition-all duration-300">
                {/* Status Indicator */}
                <div className={`h-1 ${formData.isActive ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-slate-200 dark:bg-slate-700'}`} />

                {/* Content */}
                <div className="p-6 flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                        {formData.name || 'Plan Name'}
                      </h3>
                      <div className="flex gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                          {formData.currency || 'IQD'}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${formData.isActive
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                            }`}
                        >
                          {formData.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl text-primary-600 dark:text-primary-400">
                      <ShieldCheck size={20} />
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4 mb-5 border border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                        {formatPrice(formData.price_monthly, formData.currency)}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">/ month</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      or {formatPrice(formData.price_yearly, formData.currency)} / year
                    </p>
                  </div>

                  {/* Features */}
                  <div className="mb-5">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                      {t('plans.features')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(formData.features || {}).length > 0 ? (
                        Object.keys(formData.features).map((f) => (
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
                      {Object.keys(formData.limits || {}).length > 0 ? (
                        Object.entries(formData.limits).map(([k, v]) => (
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

                {/* Actions Mock */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex gap-2 opacity-50 pointer-events-none">
                  <button className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                    <Eye size={14} /> Publish
                  </button>
                  <button className="inline-flex items-center justify-center p-2 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg">
                    <Copy size={14} />
                  </button>
                  <button className="inline-flex items-center justify-center p-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800 rounded-lg">
                    <Edit2 size={14} />
                  </button>
                  <button className="inline-flex items-center justify-center p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title={t('plans.deleteConfirm')}
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        isRtl={isRtl}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        isDestructive={true}
      />

      <Toast
        toast={toast}
        onClose={() => setToast({ ...toast, open: false })}
        isRtl={isRtl}
      />
    </div>
  );
};

export default Plans;
