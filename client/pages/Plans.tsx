
import React, { useEffect, useState } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import { translations, Language } from '../locales';
import { Check, Edit2, Plus, Trash2, X, Gift, Users, DollarSign, Globe, Coins } from 'lucide-react';
import { SubscriptionPlan, PlanPrice, LicenseKey, CurrencyRate } from '../types';
import { api } from '../services/api';

interface PlansProps {
  currentLang: Language;
}

const Plans: React.FC<PlansProps> = ({ currentLang }) => {
  const t = translations[currentLang];
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [licenses, setLicenses] = useState<LicenseKey[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyRate[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [priceUSD, setPriceUSD] = useState(0);
  const [alternativePrices, setAlternativePrices] = useState<PlanPrice[]>([]);
  const [duration, setDuration] = useState(12);
  const [deviceLimit, setDeviceLimit] = useState(1);
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');

  const [selectedCurrencyToAdd, setSelectedCurrencyToAdd] = useState('');

  const [deletePlanId, setDeletePlanId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [plansRes, licensesRes, currencyRes] = await Promise.all([
          api.getPlans(),
          api.getLicenses(),
          api.getCurrencies().catch(() => [])
        ]);
        setPlans(plansRes);
        setLicenses(licensesRes);
        setCurrencies(currencyRes as CurrencyRate[]);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const openCreateModal = () => {
    resetForm();
    setEditingPlanId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (plan: SubscriptionPlan) => {
    setEditingPlanId(plan.id);
    setName(plan.name);
    setPriceUSD(plan.priceUSD);
    setAlternativePrices(plan.alternativePrices || []);
    setDuration(plan.durationMonths);
    setDeviceLimit(plan.deviceLimit);
    setFeatures([...plan.features]);
    setIsModalOpen(true);
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleAddCurrency = () => {
    if (!selectedCurrencyToAdd) return;
    if (selectedCurrencyToAdd === 'USD') {
      setAlertMessage("USD is the base currency.");
      return;
    }
    if (alternativePrices.some(p => p.currency === selectedCurrencyToAdd)) return;

    setAlternativePrices([...alternativePrices, { currency: selectedCurrencyToAdd, amount: 0 }]);
    setSelectedCurrencyToAdd('');
  };

  const handleRemoveCurrency = (currency: string) => {
    setAlternativePrices(alternativePrices.filter(p => p.currency !== currency));
  };

  const handlePriceChange = (currency: string, amount: number) => {
    setAlternativePrices(alternativePrices.map(p => p.currency === currency ? { ...p, amount } : p));
  };

  const handleSave = async () => {
    if (!name) return;

    const planData = {
      name,
      priceUSD,
      alternativePrices,
      durationMonths: duration,
      deviceLimit,
      features
    };

    try {
      if (editingPlanId) {
        await api.updatePlan(editingPlanId, planData);
      } else {
        await api.createPlan(planData);
      }
      const updatedPlans = await api.getPlans();
      setPlans(updatedPlans);
    } catch (err) {
      console.error(err);
    }
    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    setDeletePlanId(id);
  };

  const confirmDelete = () => {
    if (deletePlanId) {
      api.deletePlan(deletePlanId).then(() => {
        api.getPlans().then(setPlans);
        setDeletePlanId(null);
      });
    }
  };

  const resetForm = () => {
    setName('');
    setPriceUSD(0);
    setAlternativePrices([]);
    setDuration(12);
    setDeviceLimit(1);
    setFeatures([]);
    setNewFeature('');
    setSelectedCurrencyToAdd('');
  };

  const getPlanUserCount = (planId: string) => {
    return licenses.filter(l => l.planId === planId).length;
  }

  const availableCurrencies = currencies
    .filter(c => c.code !== 'USD' && !alternativePrices.some(p => p.currency === c.code));

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.plans}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configure pricing tiers and feature sets.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-primary-600/20 font-bold"
        >
          <Plus size={18} />
          {t.addPlan}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {plans.map(plan => {
          const userCount = getPlanUserCount(plan.id);
          const isFree = plan.priceUSD === 0;
          return (
            <div key={plan.id} className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 relative group">

              <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={() => openEditModal(plan)}
                  className="p-2 bg-white/20 backdrop-blur-md hover:bg-primary-500 rounded-full text-white transition-colors border border-white/10"
                  title={t.edit}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="p-2 bg-white/20 backdrop-blur-md hover:bg-rose-500 rounded-full text-white transition-colors border border-white/10"
                  title={t.delete}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className={`p-8 relative overflow-hidden ${isFree ? 'bg-emerald-600 dark:bg-emerald-900' : 'bg-slate-900 dark:bg-slate-950'}`}>
                <div className="flex justify-between items-start text-white">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                    <div className="flex items-center gap-2 text-xs opacity-80">
                      <Users size={12} /> {userCount} Active Users
                    </div>
                  </div>
                  {isFree && (
                    <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                      <Gift size={12} /> Trial
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1 mt-6 text-white">
                  {isFree ? (
                    <span className="text-5xl font-extrabold tracking-tight">FREE</span>
                  ) : (
                    <>
                      <span className="text-2xl font-bold opacity-60">$</span>
                      <span className="text-5xl font-extrabold tracking-tight">{plan.priceUSD}</span>
                      <span className="text-sm opacity-60 ml-2 font-medium">/ {plan.durationMonths} Mo</span>
                    </>
                  )}
                </div>

                {plan.alternativePrices && plan.alternativePrices.length > 0 && !isFree && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {plan.alternativePrices.map(ap => (
                      <span key={ap.currency} className="text-[10px] bg-white/10 backdrop-blur-sm px-2 py-1 rounded-md text-white/80 font-mono">
                        {ap.amount.toLocaleString()} {ap.currency}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-8 flex-1 flex flex-col">
                <div className="mb-6 flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-4">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.deviceLimit}</span>
                  <p className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full text-xs">
                    {plan.deviceLimit === 99 ? 'Unlimited' : plan.deviceLimit} Device(s)
                  </p>
                </div>

                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-4">{t.features}</span>
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-700 dark:text-slate-300 text-sm">
                      <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${isFree ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400' : 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'}`}>
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <span className="leading-tight">{feat}</span>
                    </li>
                  ))}
                </ul>

                {!isFree && (
                  <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
                      <DollarSign size={14} /> Total Revenue
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      ${(userCount * plan.priceUSD).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg z-10 p-6 space-y-6 max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-slate-700 animate-in zoom-in-95">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {editingPlanId ? t.editPlan : t.addPlan}
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.name}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="e.g. Gold Plan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Base Price (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    value={priceUSD}
                    onChange={(e) => setPriceUSD(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-bold"
                    placeholder="0 for Free"
                  />
                </div>
                {priceUSD === 0 && <span className="text-xs text-emerald-500 font-bold mt-1 block">Plan will be FREE</span>}
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-600">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <Globe size={16} className="text-sky-500" />
                    Regional Pricing
                  </label>
                </div>

                {availableCurrencies.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    <select
                      value={selectedCurrencyToAdd}
                      onChange={(e) => setSelectedCurrencyToAdd(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-500 dark:bg-slate-600 dark:text-white rounded-lg text-sm"
                    >
                      <option value="">Select Currency...</option>
                      {availableCurrencies.map(c => (
                        <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddCurrency}
                      disabled={!selectedCurrencyToAdd}
                      className="bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-white px-3 rounded-lg disabled:opacity-50"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  {alternativePrices.length === 0 && (
                    <div className="text-center text-xs text-slate-400 py-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
                      No additional currencies added.
                    </div>
                  )}
                  {alternativePrices.map((price) => (
                    <div key={price.currency} className="flex items-center gap-2">
                      <span className="w-12 font-mono text-sm font-bold text-slate-600 dark:text-slate-300">{price.currency}</span>
                      <input
                        type="number"
                        value={price.amount}
                        onChange={(e) => handlePriceChange(price.currency, Number(e.target.value))}
                        className="flex-1 px-3 py-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-sm"
                      />
                      <button
                        onClick={() => handleRemoveCurrency(price.currency)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.duration}</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.deviceLimit}</label>
                  <input
                    type="number"
                    value={deviceLimit}
                    onChange={(e) => setDeviceLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.features}</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="Add a feature..."
                    onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
                  />
                  <button
                    onClick={handleAddFeature}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-500"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                  {features.map((feat, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200">
                      <span>{feat}</span>
                      <button onClick={() => removeFeature(idx)} className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-400">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg font-medium text-sm transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSave}
                disabled={!name}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors shadow-sm"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}


      <ConfirmModal
        isOpen={!!deletePlanId}
        onClose={() => setDeletePlanId(null)}
        onConfirm={confirmDelete}
        title={t.delete + " Plan"}
        message={t.confirmDelete || "Are you sure you want to delete this plan?"}
        confirmText={t.delete}
        type="danger"
      />

      <ConfirmModal
        isOpen={!!alertMessage}
        onClose={() => setAlertMessage(null)}
        onConfirm={() => setAlertMessage(null)}
        title="Notice"
        message={alertMessage || ""}
        confirmText="OK"
        type="info"
        showCancel={false}
      />
    </div>
  );
};

export default Plans;
