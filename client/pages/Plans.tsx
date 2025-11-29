import React, { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Copy, Check, X, Loader, AlertCircle, 
  CheckCircle2, XCircle, Eye, EyeOff
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
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success'
            ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-200 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-200 border border-red-200 dark:border-red-800'
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
      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">
        {label}
      </label>
      <div className={`flex flex-wrap gap-2 mb-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
        {Object.keys(features).length > 0 ? (
          Object.keys(features).map((feature) => (
            <div
              key={feature}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-700/50"
            >
              <span className="text-sm font-medium">{feature}</span>
              <button
                onClick={() => handleDelete(feature)}
                className="hover:text-primary-900 dark:hover:text-primary-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-2">No features yet</p>
        )}
      </div>
      <div className={`flex gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <input
          type="text"
          value={newFeature}
          onChange={(e) => setNewFeature(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add feature..."
          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
        />
        <button
          onClick={handleAdd}
          className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add
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
      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">
        {label}
      </label>
      <div className={`flex flex-wrap gap-2 mb-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
        {Object.keys(limits).length > 0 ? (
          Object.entries(limits).map(([key, value]) => (
            <div
              key={key}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700/50"
            >
              <span className="text-sm font-medium">{key}: {value}</span>
              <button
                onClick={() => handleDelete(key)}
                className="hover:text-green-900 dark:hover:text-green-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-2">No limits yet</p>
        )}
      </div>
      <div className={`grid grid-cols-3 gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <input
          type="text"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="Key (e.g. maxUsers)"
          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
        />
        <input
          type="number"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Value"
          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
        />
        <button
          onClick={handleAdd}
          className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add
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
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none`}>
        <div
          className={`pointer-events-auto bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-in fade-in duration-300 ${
            isRtl ? 'text-right' : 'text-left'
          }`}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-b from-slate-50 to-white dark:from-slate-750 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{subtitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
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
    return `${symbol}${amount.toLocaleString()}`;
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
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-8 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className={`mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {t.plans}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Manage your subscription tiers, pricing, and features
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg"
        >
          <Plus className="w-5 h-5" />
          {t.addPlan}
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-900 dark:text-red-200">{error}</p>
            {error.includes('column') && (
              <p className="text-xs text-red-800 dark:text-red-300 mt-1">
                Run "npx prisma db push" on the server to fix this.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader className="w-10 h-10 text-primary-600 dark:text-primary-400 mx-auto animate-spin mb-3" />
            <p className="text-slate-600 dark:text-slate-400">Loading plans...</p>
          </div>
        </div>
      ) : plans.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <div className="inline-block p-3 bg-slate-100 dark:bg-slate-700 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-slate-600 dark:text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            No Plans Yet
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Create your first subscription plan to get started
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Plan
          </button>
        </div>
      ) : (
        /* Plans Grid */
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="group relative bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              {/* Status Indicator */}
              <div className={`absolute top-0 ${isRtl ? 'left-0' : 'right-0'} w-1 h-full bg-gradient-to-b ${plan.isActive ? 'from-green-500 to-green-400' : 'from-slate-400 to-slate-300'}`} />

              {/* Content */}
              <div className="p-6">
                {/* Header */}
                <div className={`flex items-start justify-between gap-3 mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                      {plan.name}
                    </h3>
                    <div className="flex gap-2 flex-wrap">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-semibold">
                        {plan.currency}
                      </span>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                          plan.isActive
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {plan.isActive ? (
                          <>
                            <Check className="w-3 h-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3" />
                            Inactive
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/10 rounded-lg p-4 mb-4 border border-primary-200 dark:border-primary-800">
                  <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-1">
                    Monthly
                  </p>
                  <p className="text-2xl font-bold text-primary-700 dark:text-primary-300 mb-3">
                    {formatPrice(plan.price_monthly, plan.currency)}
                  </p>
                  <p className="text-sm text-primary-600 dark:text-primary-400">
                    or {formatPrice(plan.price_yearly, plan.currency)} / year
                  </p>
                </div>

                {/* Features */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
                    Features
                  </p>
                  <div className={`flex flex-wrap gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    {Object.keys(plan.features || {}).length > 0 ? (
                      Object.keys(plan.features).map((f) => (
                        <span
                          key={f}
                          className="inline-block px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium"
                        >
                          ✓ {f}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400">—</p>
                    )}
                  </div>
                </div>

                {/* Limits */}
                <div className="mb-6">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
                    Limits
                  </p>
                  <div className={`flex flex-wrap gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    {Object.keys(plan.limits || {}).length > 0 ? (
                      Object.entries(plan.limits).map(([k, v]) => (
                        <span
                          key={k}
                          className="inline-block px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium"
                        >
                          {k}: {v}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400">—</p>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-200 dark:bg-slate-700 my-4" />

                {/* Actions */}
                <div className={`flex gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <button
                    onClick={() => handleToggleStatus(plan)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                    title={plan.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {plan.isActive ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDuplicate(plan)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-medium transition-colors text-sm"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenModal(plan)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-primary-100 hover:bg-primary-200 dark:bg-primary-900/30 dark:hover:bg-primary-900/50 text-primary-700 dark:text-primary-300 rounded-lg font-medium transition-colors text-sm"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id, plan.name)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg font-medium transition-colors text-sm"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingPlan ? 'Edit Plan' : 'Create New Plan'}
        subtitle={editingPlan ? 'Update plan details and pricing' : 'Set up a new subscription tier'}
        isRtl={isRtl}
      >
        <div className={`space-y-6 ${isRtl ? 'text-right' : 'text-left'}`}>
          {/* Quick Templates */}
          {!editingPlan && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-3">
                Quick Start Templates
              </p>
              <div className={`flex flex-wrap gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                {PLAN_TEMPLATES.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => handleTemplateSelect(t.name)}
                    className="px-3 py-1.5 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium"
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Plan Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Plan Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Professional Plan"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Pricing */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">
              Pricing
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1 block">
                  Monthly Price
                </label>
                <input
                  type="number"
                  value={formData.price_monthly}
                  onChange={(e) => setFormData({ ...formData, price_monthly: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1 block">
                  Yearly Price
                </label>
                <input
                  type="number"
                  value={formData.price_yearly}
                  onChange={(e) => setFormData({ ...formData, price_yearly: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Currency *
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {currencies.length > 0 ? (
                currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} {c.code}
                  </option>
                ))
              ) : (
                <option value="IQD">د.ع IQD</option>
              )}
            </select>
          </div>

          {/* Features */}
          <FeatureEditor
            features={formData.features}
            onChange={(features) => setFormData({ ...formData, features })}
            label="Features"
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
          <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Plan Status</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {formData.isActive ? '✓ Active and available' : '○ Hidden from customers'}
              </p>
            </div>
            <button
              onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                formData.isActive
                  ? 'bg-green-600'
                  : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  formData.isActive ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className={`flex gap-3 pt-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={handleCloseModal}
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !formData.name || !formData.currency}
              className="flex-1 px-4 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
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
