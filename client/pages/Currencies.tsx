
import React, { useEffect, useState } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import { translations, Language } from '../locales';
import { CurrencyRate } from '../types';
import { api } from '../services/api';
import { RefreshCw, Save, Plus, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

interface CurrenciesProps {
  currentLang: Language;
}

const Currencies: React.FC<CurrenciesProps> = ({ currentLang }) => {
  const t = translations[currentLang] as any;
  const { tick: autoRefreshTick, requestRefresh } = useAutoRefresh();
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempRate, setTempRate] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [error, setError] = useState<string>('');
  const [createError, setCreateError] = useState<string>('');
  const [deleteCode, setDeleteCode] = useState<string | null>(null);

  // Form State
  const [newCode, setNewCode] = useState('');
  const [newRate, setNewRate] = useState(1);
  const [newSymbol, setNewSymbol] = useState('');

  useEffect(() => {
    api.getCurrencies().then(setRates).catch(console.error);
  }, [autoRefreshTick]);

  const startEdit = (code: string, currentRate: number) => {
    setEditingId(code);
    setTempRate(currentRate);
    setError('');
  };

  const handleSave = async (code: string) => {
    setError('');
    if (tempRate <= 0) {
      setError('Rate must be greater than 0');
      return;
    }
    try {
      setIsSaving(true);
      await api.updateCurrency(code, { rate: tempRate });
      const updated = await api.getCurrencies();
      setRates(updated);
      requestRefresh();
      setEditingId(null);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.issues?.[0]?.message ||
        err?.response?.data?.message ||
        'Failed to update currency';
      setError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (code: string) => {
    setDeleteCode(code);
  };

  const confirmDelete = async () => {
    if (deleteCode) {
      try {
        await api.deleteCurrency(deleteCode);
        const updated = await api.getCurrencies();
        setRates(updated);
        requestRefresh();
        setDeleteCode(null);
      } catch (err: any) {
        const errorMsg = err?.response?.data?.message || 'Failed to delete currency';
        setError(errorMsg);
      }
    }
  };

  const handleCreate = async () => {
    setCreateError('');

    if (!newCode.trim() || newCode.length !== 3) {
      setCreateError('Currency code must be exactly 3 characters');
      return;
    }

    if (!newSymbol.trim()) {
      setCreateError('Currency symbol is required');
      return;
    }

    if (newRate <= 0) {
      setCreateError('Rate must be greater than 0');
      return;
    }

    try {
      setIsCreating(true);
      await api.createCurrency({ code: newCode.toUpperCase(), rate: newRate, symbol: newSymbol });
      const updated = await api.getCurrencies();
      setRates(updated);
      requestRefresh();
      setIsModalOpen(false);
      setNewCode('');
      setNewRate(1);
      setNewSymbol('');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.issues?.[0]?.message ||
        err?.response?.data?.message ||
        'Failed to create currency';
      setCreateError(errorMsg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(async () => {
      await api.syncCurrencies();
      setRates(await api.getCurrencies());
      requestRefresh();
      setIsSyncing(false);
    }, 500);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.currencies}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 text-sm text-white bg-sky-600 hover:bg-sky-700 px-3 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} />
            <span>{t.addCurrency}</span>
          </button>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 text-sm text-sky-600 dark:text-sky-400 hover:text-sky-700 bg-sky-50 dark:bg-slate-800 px-3 py-2 rounded-lg disabled:opacity-50 transition-all"
          >
            {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            <span>{isSyncing ? 'Syncing...' : t.syncRates}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rates.map((currency) => (
          <div key={currency.code} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 relative overflow-hidden group transition-colors">
            {/* Background Symbol Watermark */}
            <div className="absolute top-[-10px] right-[-10px] p-4 opacity-5 dark:opacity-[0.03] font-bold text-8xl text-gray-900 dark:text-white select-none pointer-events-none">
              {currency.symbol || currency.code}
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-sky-50 dark:bg-slate-700 flex items-center justify-center font-bold text-sky-600 dark:text-sky-400 text-lg border border-sky-100 dark:border-slate-600">
                    {currency.symbol}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">{currency.code}</h3>
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">1 USD =</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(currency.code)}
                  className="text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="mt-4 pl-1">
                {error && editingId === currency.code && (
                  <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 px-3 py-2 rounded-lg text-xs mb-2 flex items-center gap-2">
                    <span>⚠️</span>
                    <span>{error}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {editingId === currency.code ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="number"
                        value={tempRate}
                        onChange={(e) => { setTempRate(parseFloat(e.target.value)); setError(''); }}
                        className="w-full px-3 py-2 border border-sky-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none font-mono dark:bg-slate-700 dark:text-white dark:border-slate-600"
                      />
                      <button
                        onClick={() => handleSave(currency.code)}
                        disabled={isSaving}
                        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                      >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-baseline w-full">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-mono font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                          {currency.rate ? currency.rate.toLocaleString() : '0'}
                        </span>
                        <span className="text-sm font-medium text-slate-400">{currency.code}</span>
                      </div>
                      <button
                        onClick={() => startEdit(currency.code, currency.rate)}
                        className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-medium"
                      >
                        {t.edit}
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-3 border-t border-gray-100 dark:border-slate-700 pt-2">
                  Last Synced: {new Date(currency.lastUpdated).toLocaleDateString()} {new Date(currency.lastUpdated).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ADD CURRENCY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setIsModalOpen(false); setCreateError(''); }} />
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm z-10 p-6 space-y-6 border border-gray-100 dark:border-slate-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t.addCurrency}</h2>

            {createError && (
              <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency Code</label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => { setNewCode(e.target.value.toUpperCase()); setCreateError(''); }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-sky-500 outline-none uppercase placeholder:normal-case font-mono"
                  placeholder="e.g. KWD"
                  maxLength={3}
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Exactly 3 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.symbol}</label>
                <input
                  type="text"
                  value={newSymbol}
                  onChange={(e) => { setNewSymbol(e.target.value); setCreateError(''); }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-sky-500 outline-none placeholder:normal-case"
                  placeholder="e.g. د.ك or €"
                  maxLength={5}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.rate}</label>
                <input
                  type="number"
                  value={newRate}
                  onChange={(e) => { setNewRate(Number(e.target.value)); setCreateError(''); }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-sky-500 outline-none font-mono"
                  min="0.0001"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
              <button
                onClick={() => { setIsModalOpen(false); setCreateError(''); }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg font-medium text-sm transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleCreate}
                disabled={!newCode.trim() || !newSymbol.trim() || isCreating}
                className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors shadow-sm flex items-center gap-2"
              >
                {isCreating ? <Loader2 size={14} className="animate-spin" /> : null}
                {isCreating ? 'Creating...' : t.save}
              </button>
            </div>
          </div>
        </div>
      )}


      <ConfirmModal
        isOpen={!!deleteCode}
        onClose={() => setDeleteCode(null)}
        onConfirm={confirmDelete}
        title={t.delete + " Currency"}
        message={t.confirmDelete || "Delete currency?"}
        confirmText={t.delete}
        type="danger"
      />
    </div>
  );
};

export default Currencies;
