import React, { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Copy, Check, X, Loader, AlertCircle,
  CheckCircle2, XCircle, Eye, EyeOff, ShieldCheck, Zap, Globe
} from 'lucide-react';
import { api } from '../services/api';
import { CurrencyRate } from '../types';
import { translations, Language } from '../locales';

interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
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

const PLAN_TEMPLATES = [
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
      className={`fixed bottom-6 ${isRtl ? 'left-6' : 'right-6'} z-50 animate-in slide-in-from-bottom-5 duration-300`}
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
    <div>
      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
        {label}
      </label>
      <div className="flex flex-wrap gap-2 mb-3">
        {Object.keys(features).length > 0 ? (
          Object.keys(features).map((feature) => (
            <div
              key={feature}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-100 dark:border-primary-800"
            >
              <span className="text-xs font-medium">{feature}</span>
              <button
                onClick={() => handleDelete(feature)}
                className="hover:text-primary-900 dark:hover:text-primary-100 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-400 italic py-1">No features added</p>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newFeature}
          onChange={(e) => setNewFeature(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add feature..."
          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm transition-all"
        />
        <button
          onClick={handleAdd}
          className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
        </button>
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
    <div>
      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
        {label}
      </label>
      <div className="flex flex-wrap gap-2 mb-3">
        {Object.keys(limits).length > 0 ? (
          Object.entries(limits).map(([key, value]) => (
            <div
              key={key}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800"
            >
              <span className="text-xs font-medium">{key}: {value}</span>
              <button
                onClick={() => handleDelete(key)}
                className="hover:text-emerald-900 dark:hover:text-emerald-100 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-400 italic py-1">No limits added</p>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <input
          type="text"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="Key (e.g. users)"
          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm transition-all"
        />
        <input
          type="number"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Val"
          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm transition-all"
        />
        <button
          onClick={handleAdd}
          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
        </button>
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
          className={`pointer-events-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700 flex flex-col`}
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
const Plans: React.FC<{ currentLang: Language }> = ({ currentLang }) => {
  const t = translations[currentLang];
  const isRtl = currentLang === 'ar';

  const [plans, setPlans] = useState<Plan[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast>({ open: false, message: '', type: 'success' });
  const [formData, setFormData] = useState<FormData>({
    name: '',
    price_monthly: 0,
    price_yearly: 0,
    currency: 'IQD',
    features: {},
    limits: {},
    isActive: true
  });

  const formatPrice = (amount: number, currencyCode: string) => {
    const currency = currencies.find(c => c.code === currencyCode);
    const symbol = currency?.symbol || currencyCode;
    return `${symbol} ${amount.toLocaleString()}`;
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
  }, []);

  const handleOpenModal = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        price_monthly: plan.price_monthly || 0,
        price_yearly: plan.price_yearly || 0,
        currency: plan.currency,
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

  const handleTemplateSelect = (templateName: string) => {
    const template = PLAN_TEMPLATES.find(t => t.name === templateName);
    if (template) {
      setFormData({
        ...template,
        currency: currencies.some(c => c.code === template.currency)
          ? template.currency
          : currencies[0]?.code || 'IQD'
      });
    }
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

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the "${name}" plan?`)) return;

    try {
      await api.deletePlan(id);
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
            {t.plans}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your subscription tiers, pricing, and features
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-md shadow-primary-600/20 transition-all active:scale-95 text-sm font-bold"
        >
          <Plus size={16} /> {t.addPlan}
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
            Create Plan
          </button>
        </div>
      ) : (
        /* Plans Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="group relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-300 overflow-hidden flex flex-col"
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
                        {plan.currency}
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
                    Features
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
                  onClick={() => handleDelete(plan.id, plan.name)}
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
        title={editingPlan ? t.editPlan : t.addPlan}
        subtitle={editingPlan ? 'Update plan details and pricing' : 'Set up a new subscription tier'}
        isRtl={isRtl}
      >
        <div className="space-y-5">
          {/* Quick Templates */}
          {!editingPlan && (
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-300 mb-3 uppercase tracking-wider flex items-center gap-2">
                <Zap size={12} /> Quick Start Templates
              </p>
              <div className="flex flex-wrap gap-2">
                {PLAN_TEMPLATES.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => handleTemplateSelect(t.name)}
                    className="px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-colors text-xs font-bold shadow-sm"
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Plan Name */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              {t.name} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Professional Plan"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
            />
          </div>

          {/* Pricing */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              {t.price}
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
              Currency <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all appearance-none"
              >
                {currencies.length > 0 ? (
                  currencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </option>
                  ))
                ) : (
                  <option value="IQD">IQD (د.ع)</option>
                )}
              </select>
            </div>
          </div>

          {/* Features */}
          <FeatureEditor
            features={formData.features}
            onChange={(features) => setFormData({ ...formData, features })}
            label={t.features}
            isRtl={isRtl}
          />

          {/* Limits */}
          <LimitEditor
            limits={formData.limits}
            onChange={(limits) => setFormData({ ...formData, limits })}
            label="Limits"
            isRtl={isRtl}
          />

          {/* Status Toggle */}
          <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">Plan Status</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {formData.isActive ? 'Visible to customers' : 'Hidden from customers'}
              </p>
            </div>
            <button
              onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${formData.isActive
                  ? 'bg-emerald-500'
                  : 'bg-slate-300 dark:bg-slate-600'
                }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCloseModal}
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 font-bold transition-colors disabled:opacity-50 text-sm"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !formData.name || !formData.currency}
              className="flex-1 px-4 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-bold transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2 text-sm shadow-lg shadow-primary-600/20"
            >
              {saving ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {editingPlan ? t.save : t.create}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      <Toast toast={toast} onClose={() => setToast({ ...toast, open: false })} isRtl={isRtl} />
    </div>
  );
};

export default Plans;
