import React, { useEffect, useState } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import { exportToExcel } from '../utils/excelExport';
import { translations, Language } from '../locales';
import { api } from '../services/api';
import { LicenseKey, LicenseStatus, SubscriptionPlan } from '../types';
import { Plus, Search, Monitor, Shield, Ban, CalendarClock, Download, Trash2, Filter, X, Copy, Check, WifiOff, LockKeyhole, PauseCircle, PlayCircle, Hash, CreditCard, Edit2, AlertTriangle, User, Save } from 'lucide-react';

interface LicensesProps {
  currentLang: Language;
}

const Licenses: React.FC<LicensesProps> = ({ currentLang }) => {
  const t = translations[currentLang];
  const [licenses, setLicenses] = useState<LicenseKey[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPlan, setFilterPlan] = useState<string>('ALL');

  const [newCustomer, setNewCustomer] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);

  const [selectedLicenseId, setSelectedLicenseId] = useState<string | null>(null);
  const [renewMonths, setRenewMonths] = useState(6);

  const [editingLicense, setEditingLicense] = useState<LicenseKey | null>(null);
  const [editName, setEditName] = useState('');

  const [revokeId, setRevokeId] = useState<string | null>(null);

  const [deletingLicenseId, setDeletingLicenseId] = useState<string | null>(null);

  const [offlineRequestCode, setOfflineRequestCode] = useState('');
  const [offlineResponseCode, setOfflineResponseCode] = useState('');
  const [offlineSelectedSerial, setOfflineSelectedSerial] = useState('');

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    refreshAll();
  }, []);

  const refreshAll = async () => {
    try {
      const [lics, plansList] = await Promise.all([api.getLicenses(), api.getPlans()]);
      setLicenses(
        lics.map((l: any) => ({
          ...l,
          userName: l.userName || l.customerName
        }))
      );
      setPlans(plansList);
      setSelectedPlan((prev) => prev || plansList[0]?.id);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshLicenses = async () => {
    const lics = await api.getLicenses();
    setLicenses(lics.map((l: any) => ({ ...l, userName: l.userName || l.customerName })));
  };

  const handleCreate = async () => {
    if (!selectedPlan) return;

    setCreateError('');

    if (newCustomer.trim().length < 2) {
      setCreateError('Customer name must be at least 2 characters');
      return;
    }

    try {
      setIsCreating(true);
      await api.generateLicense(selectedPlan, newCustomer, quantity);
      await refreshLicenses();
      setIsModalOpen(false);
      setNewCustomer('');
      setQuantity(1);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.issues?.[0]?.message ||
        err?.response?.data?.message ||
        'Failed to generate license';
      setCreateError(errorMsg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = (id: string) => {
    setRevokeId(id);
  }

  const confirmRevoke = () => {
    if (revokeId) {
      api.revoke(revokeId).then(() => {
        refreshLicenses();
        setRevokeId(null);
      });
    }
  }

  const handlePauseToggle = (id: string) => {
    api.togglePause(id).then(refreshLicenses);
  }

  const handleDeleteClick = (id: string) => {
    setDeletingLicenseId(id);
    setIsDeleteModalOpen(true);
  }

  const handleConfirmDelete = () => {
    if (deletingLicenseId) {
      api.deleteLicense(deletingLicenseId).then(async () => {
        await refreshLicenses();
        setIsDeleteModalOpen(false);
        setDeletingLicenseId(null);
      });
    }
  }

  const handleEditClick = (license: LicenseKey) => {
    setEditingLicense(license);
    setEditName(license.userName || license.customerName || '');
    setIsEditModalOpen(true);
  }

  const handleSaveEdit = async () => {
    if (editingLicense && editName.trim()) {
      await api.updateLicense(editingLicense.id, { customerName: editName });
      await refreshLicenses();
      setIsEditModalOpen(false);
      setEditingLicense(null);
    }
  }

  const openRenewModal = (id: string) => {
    setSelectedLicenseId(id);
    setIsRenewModalOpen(true);
  }

  const handleRenew = async () => {
    if (selectedLicenseId) {
      await api.renewLicense(selectedLicenseId, renewMonths);
      await refreshLicenses();
      setIsRenewModalOpen(false);
    }
  }

  const handleGenerateOfflineCode = () => {
    if (!offlineRequestCode || !offlineSelectedSerial) return;
    const part1 = offlineRequestCode.substring(0, 4);
    const part2 = offlineSelectedSerial.split('-')[2] || 'XXXX';
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    const response = `ACT-${part1}-${part2}-${random}-OK`;
    setOfflineResponseCode(response);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const handleExport = () => {
    const data = licenses.map(l => {
      const plan = plans.find(p => p.id === l.planId)?.name || 'Unknown';
      return {
        "Serial Key": l.serial,
        "Customer Name": l.userName,
        "Plan Name": plan,
        "Status": l.status,
        "Activations": l.activationCount,
        "Max Devices": l.deviceLimit,
        "Hardware ID": l.hardwareId || 'N/A',
        "Expire Date": l.expireDate || 'N/A',
        "Created At": l.createdAt
      };
    });
    exportToExcel(data, "sourceplus_licenses_export", "Licenses");
  }

  const filteredLicenses = licenses.filter(license => {
    const matchesSearch = license.serial.toLowerCase().includes(search.toLowerCase()) ||
      license.userName.toLowerCase().includes(search.toLowerCase()) ||
      (license.hardwareId && license.hardwareId.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = filterStatus === 'ALL' || license.status === filterStatus;
    const matchesPlan = filterPlan === 'ALL' || license.planId === filterPlan;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const getStatusColor = (status: LicenseStatus) => {
    switch (status) {
      case LicenseStatus.ACTIVE: return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-600/20';
      case LicenseStatus.EXPIRED: return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 ring-1 ring-amber-600/20';
      case LicenseStatus.PENDING: return 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 ring-1 ring-sky-600/20';
      case LicenseStatus.REVOKED: return 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 ring-1 ring-rose-600/20';
      case LicenseStatus.PAUSED: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 ring-1 ring-gray-500/20';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.licenses}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage, renew, and audit all deployed licenses.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsOfflineModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-lg transition-colors shadow-sm text-sm font-bold border border-indigo-200 dark:border-indigo-800"
          >
            <WifiOff size={18} />
            {t.offlineActivation}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white px-4 py-2 rounded-lg transition-colors shadow-sm text-sm font-medium"
          >
            <Download size={18} />
            {t.exportCsv}
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm text-sm font-bold"
          >
            <Plus size={18} />
            {t.create}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col">
        <div className="p-5 border-b border-gray-200 dark:border-slate-700 flex flex-col lg:flex-row gap-4 bg-gray-50/50 dark:bg-slate-800/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.serial + ' / ' + t.customer + ' / HWID'}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm shadow-sm"
            />
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 lg:pb-0">
            <div className="relative min-w-[160px]">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm appearance-none cursor-pointer shadow-sm font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value={LicenseStatus.ACTIVE}>Active</option>
                <option value={LicenseStatus.EXPIRED}>Expired</option>
                <option value={LicenseStatus.PENDING}>Pending</option>
                <option value={LicenseStatus.REVOKED}>Revoked</option>
                <option value={LicenseStatus.PAUSED}>Paused</option>
              </select>
              <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative min-w-[160px]">
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm appearance-none cursor-pointer shadow-sm font-medium"
              >
                <option value="ALL">All Plans</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {(filterStatus !== 'ALL' || filterPlan !== 'ALL' || search) && (
              <button
                onClick={() => { setFilterStatus('ALL'); setFilterPlan('ALL'); setSearch(''); }}
                className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center transition-colors"
                title="Clear Filters"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm text-gray-600 dark:text-slate-400">
            <thead className="bg-gray-50 dark:bg-slate-900/50 text-gray-700 dark:text-slate-300 font-semibold uppercase tracking-wider text-xs border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4">{t.serial}</th>
                <th className="px-6 py-4">{t.customer}</th>
                <th className="px-6 py-4 text-center">{t.status}</th>
                <th className="px-6 py-4 text-center">{t.activationCount}</th>
                <th className="px-6 py-4 text-center">Last Payment</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
              {filteredLicenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No licenses found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredLicenses.map((license) => (
                  <tr key={license.id} className="hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 group/copy">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 tracking-wide select-all">{license.serial}</span>
                        <button
                          onClick={() => handleCopy(license.serial, license.id)}
                          className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-primary-600 transition-all opacity-100 md:opacity-0 md:group-hover/copy:opacity-100 focus:opacity-100"
                          title="Copy Serial"
                        >
                          {copiedId === license.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${license.hardwareId ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                        {license.hardwareId ? 'Device Locked' : 'Unbound'}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium dark:text-slate-300">
                      {license.userName}
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {plans.find(p => p.id === license.planId)?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(license.status)}`}>
                        {t[license.status as unknown as keyof typeof t] || license.status}
                      </span>
                      {license.expireDate && (
                        <div className="text-[10px] text-slate-400 mt-1">
                          {new Date(license.expireDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-lg text-xs font-bold dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                        <Monitor size={14} className="text-slate-500" />
                        {license.activationCount} / {license.deviceLimit}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1 text-xs text-slate-500">
                        <CreditCard size={14} />
                        {license.lastRenewalDate ? new Date(license.lastRenewalDate).toLocaleDateString() : 'Initial'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditClick(license)}
                          className="text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 p-2 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-colors"
                          title={t.edit}
                        >
                          <Edit2 size={18} />
                        </button>
                        {license.status !== LicenseStatus.REVOKED && (
                          <>
                            <button
                              onClick={() => handlePauseToggle(license.id)}
                              className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                              title={license.status === LicenseStatus.PAUSED ? t.resume : t.pause}
                            >
                              {license.status === LicenseStatus.PAUSED ? <PlayCircle size={18} /> : <PauseCircle size={18} />}
                            </button>
                            <button
                              onClick={() => openRenewModal(license.id)}
                              className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                              title={t.renew}
                            >
                              <CalendarClock size={18} />
                            </button>
                            <button
                              onClick={() => handleRevoke(license.id)}
                              className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 p-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                              title={t.revoke}
                            >
                              <Ban size={18} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteClick(license.id)}
                          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                          title={t.delete}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setIsModalOpen(false); setCreateError(''); }} />
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md z-10 p-6 space-y-6 border border-gray-100 dark:border-slate-700 animate-in zoom-in-95">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Plus size={24} className="text-primary-500" />
              {t.newLicense}
            </h2>

            {createError && (
              <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.customer}</label>
                <input
                  type="text"
                  value={newCustomer}
                  onChange={(e) => { setNewCustomer(e.target.value); setCreateError(''); }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Company or User Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.plan}</label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - {plan.priceUSD === 0 ? 'FREE' : `$${plan.priceUSD}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.quantity} <span className="text-xs text-slate-400 font-normal">(Bulk Generation)</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Math.min(50, Number(e.target.value))))}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                  <div className="text-xs text-slate-500">Max: 50</div>
                </div>
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
                disabled={!newCustomer.trim() || isCreating}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors shadow-sm"
              >
                {isCreating ? 'Generating...' : (quantity > 1 ? `${t.bulkGenerate} (${quantity})` : t.generateResponse)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && editingLicense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md z-10 p-6 space-y-6 border border-gray-100 dark:border-slate-700 animate-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-700 pb-4">
              <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-full flex items-center justify-center">
                <Edit2 size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t.editLicense}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{editingLicense.serial}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.customer}</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                    placeholder="Enter new customer name"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm font-medium">{t.cancel}</button>
              <button onClick={handleSaveEdit} className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 text-sm font-bold flex items-center gap-2">
                <Save size={16} /> {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md z-10 p-6 space-y-6 border border-gray-100 dark:border-slate-700 animate-in zoom-in-95">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-500 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t.deleteLicenseTitle}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                {t.deleteWarning}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-colors"
              >
                {t.confirmAction}
              </button>
            </div>
          </div>
        </div>
      )}

      {isRenewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsRenewModalOpen(false)} />
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm z-10 p-6 space-y-6 border border-gray-100 dark:border-slate-700 animate-in zoom-in-95">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t.renew} License</h2>
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">Extend license validity.</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.duration}</label>
                <select
                  value={renewMonths}
                  onChange={(e) => setRenewMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value={1}>1 Month</option>
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={12}>1 Year</option>
                  <option value={24}>2 Years</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setIsRenewModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm font-medium">{t.cancel}</button>
              <button onClick={handleRenew} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-bold">{t.renew}</button>
            </div>
          </div>
        </div>
      )}

      {isOfflineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsOfflineModalOpen(false)} />
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg z-10 p-6 space-y-6 border border-gray-100 dark:border-slate-700 animate-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-700 pb-4">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center">
                <LockKeyhole size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t.offlineActivation}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Generate activation code for offline devices</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.serial}</label>
                <select
                  value={offlineSelectedSerial}
                  onChange={(e) => setOfflineSelectedSerial(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                >
                  <option value="">Select a License...</option>
                  {licenses.filter(l => l.status !== LicenseStatus.REVOKED).map(l => (
                    <option key={l.id} value={l.serial}>{l.serial} - {l.userName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.requestString}</label>
                <input
                  value={offlineRequestCode}
                  onChange={(e) => setOfflineRequestCode(e.target.value.toUpperCase())}
                  placeholder="e.g. REQ-XXXX-YYYY-ZZZZ"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm uppercase"
                />
                <p className="text-xs text-slate-400 mt-1">Enter the code displayed on the client's screen.</p>
              </div>

              {offlineResponseCode && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-800 animate-in fade-in slide-in-from-top-2">
                  <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">{t.activationCode}</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 font-mono text-lg font-bold text-emerald-900 dark:text-white bg-white dark:bg-slate-900 px-3 py-2 rounded border border-emerald-200 dark:border-emerald-700 select-all">
                      {offlineResponseCode}
                    </code>
                    <button
                      onClick={() => handleCopy(offlineResponseCode, 'offline-code')}
                      className="p-2 bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-100 rounded hover:bg-emerald-200 dark:hover:bg-emerald-700 transition-colors"
                    >
                      {copiedId === 'offline-code' ? <Check size={20} /> : <Copy size={20} />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => { setIsOfflineModalOpen(false); setOfflineResponseCode(''); setOfflineRequestCode(''); }}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm font-medium"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleGenerateOfflineCode}
                disabled={!offlineRequestCode || !offlineSelectedSerial}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold shadow-md shadow-indigo-500/20"
              >
                {t.generateResponse}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!revokeId}
        onClose={() => setRevokeId(null)}
        onConfirm={confirmRevoke}
        title={t.revoke + " License"}
        message="Are you sure you want to revoke this license? It will stop working immediately."
        confirmText={t.revoke}
        type="danger"
      />
    </div>
  );
};

export default Licenses;
