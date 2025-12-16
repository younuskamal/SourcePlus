import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Stethoscope, ShieldCheck, Ban, Clock, CheckCircle2, AlertTriangle, Bell, Mail, MapPin, Phone, LayoutDashboard, RefreshCw, Zap, Activity, Radio } from 'lucide-react';
import { api } from '../services/api';
import { Clinic, ClinicSubscriptionStatus, RegistrationStatus } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface Props {
  setPage: (page: string) => void;
}

const StatCard = ({ label, value, icon: Icon, className }: { label: string; value: string | number; icon: any; className?: string }) => (
  <div className={`p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm flex items-center gap-3 ${className || ''}`}>
    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-primary-600 dark:text-primary-300">
      <Icon size={18} />
    </div>
    <div>
      <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">{label}</p>
      <p className="text-xl font-extrabold text-slate-900 dark:text-white">{value}</p>
    </div>
  </div>
);

const ClinicDashboard: React.FC<Props> = ({ setPage }) => {
  const { t } = useTranslation();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [subscriptions, setSubscriptions] = useState<Record<string, ClinicSubscriptionStatus>>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refreshIntervalMs = 15000;

  const fetchSubscriptions = async (items: Clinic[]) => {
    const results = await Promise.all(
      items.map(async (clinic) => {
        try {
          const status = await api.getSubscriptionStatus(clinic.id);
          return [clinic.id, status] as const;
        } catch {
          return null;
        }
      })
    );
    const map: Record<string, ClinicSubscriptionStatus> = {};
    results.forEach((item) => {
      if (item) map[item[0]] = item[1];
    });
    setSubscriptions(map);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      const data = await api.getClinics();
      setClinics(data);
      await fetchSubscriptions(data);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Failed to load clinics', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, refreshIntervalMs);
    return () => clearInterval(timer);
  }, [load]);

  const statusCounts = clinics.reduce<Record<RegistrationStatus, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {
    [RegistrationStatus.APPROVED]: 0,
    [RegistrationStatus.PENDING]: 0,
    [RegistrationStatus.SUSPENDED]: 0,
    [RegistrationStatus.REJECTED]: 0
  });

  const pending = useMemo(
    () => clinics.filter(c => c.status === RegistrationStatus.PENDING).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
    [clinics]
  );

  const approved = useMemo(
    () => clinics.filter(c => c.status === RegistrationStatus.APPROVED).slice(0, 5),
    [clinics]
  );

  const expiringSoon = useMemo(() => {
    const today = Date.now();
    const in30 = 1000 * 60 * 60 * 24 * 30;
    const candidates = clinics.map((clinic) => {
      const sub = subscriptions[clinic.id];
      const expireDate = sub?.license?.expireDate || clinic.license?.expireDate;
      return expireDate ? { clinic, expireTs: new Date(expireDate as any).getTime() } : null;
    }).filter(Boolean) as { clinic: Clinic; expireTs: number }[];

    return candidates
      .filter(c => c.expireTs - today <= in30 && c.expireTs - today > 0)
      .sort((a, b) => a.expireTs - b.expireTs)
      .slice(0, 5);
  }, [clinics, subscriptions]);

  const forceLogoutCount = Object.values(subscriptions).filter((s) => s.forceLogout).length;
  const expiringCount = expiringSoon.length;
  const liveIndicator = lastUpdated ? `${t('clinicDashboard.lastUpdated')}: ${lastUpdated.toLocaleTimeString()}` : '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Stethoscope className="text-emerald-500" /> {t('clinicDashboard.title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t('clinicDashboard.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage('clinics')}
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold shadow-sm"
          >
            {t('clinicDashboard.requests')}
          </button>
          <button
            onClick={() => setPage('manage-clinics')}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-sm"
          >
            {t('clinicDashboard.manage')}
          </button>
          <button
            onClick={load}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm flex items-center gap-2"
          >
            <RefreshCw className={refreshing ? 'animate-spin' : ''} size={16} /> {t('clinicDashboard.refresh')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={t('clinicDashboard.total')} value={clinics.length} icon={LayoutDashboard} />
        <StatCard label={t('clinicDashboard.pending')} value={statusCounts[RegistrationStatus.PENDING] || 0} icon={Clock} className="bg-amber-50/50 dark:bg-amber-900/10" />
        <StatCard label={t('clinicDashboard.approved')} value={statusCounts[RegistrationStatus.APPROVED] || 0} icon={ShieldCheck} className="bg-emerald-50/50 dark:bg-emerald-900/10" />
        <StatCard label={t('clinicDashboard.suspendedRejected')} value={(statusCounts[RegistrationStatus.SUSPENDED] || 0) + (statusCounts[RegistrationStatus.REJECTED] || 0)} icon={Ban} className="bg-rose-50/50 dark:bg-rose-900/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-600 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider opacity-80 font-semibold">{t('clinicDashboard.liveStatus')}</p>
              <p className="text-3xl font-extrabold mt-1">{clinics.length} {t('clinicDashboard.clinicsCount')}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-full">
              <Radio />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-xs opacity-80">{t('clinicDashboard.pending')}</p>
              <p className="text-lg font-bold">{statusCounts[RegistrationStatus.PENDING] || 0}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-xs opacity-80">{t('clinicDashboard.approved')}</p>
              <p className="text-lg font-bold">{statusCounts[RegistrationStatus.APPROVED] || 0}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-xs opacity-80">{t('clinicDashboard.expiringSoon')}</p>
              <p className="text-lg font-bold">{expiringCount}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-xs opacity-80">{t('clinicDashboard.forceLogout')}</p>
              <p className="text-lg font-bold">{forceLogoutCount}</p>
            </div>
          </div>
          <div className="mt-3 text-xs opacity-80">
            {liveIndicator}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="text-indigo-500" size={16} />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('clinicDashboard.quickStatus')}</h3>
            </div>
            <span className="text-xs text-slate-500">+ {t('clinicDashboard.auto')}</span>
          </div>
          <div className="space-y-2">
            {[
              { key: t('clinicDashboard.pending'), count: statusCounts[RegistrationStatus.PENDING] || 0, color: 'bg-amber-500' },
              { key: t('clinicDashboard.approved'), count: statusCounts[RegistrationStatus.APPROVED] || 0, color: 'bg-emerald-500' },
              { key: t('clinicDashboard.suspendedRejected'), count: (statusCounts[RegistrationStatus.SUSPENDED] || 0) + (statusCounts[RegistrationStatus.REJECTED] || 0), color: 'bg-rose-500' }
            ].map((item) => (
              <div key={item.key} className="flex items-center gap-3">
                <div className="w-28 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">{item.key}</div>
                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color}`}
                    style={{ width: clinics.length ? `${Math.min(100, (item.count / clinics.length) * 100)}%` : '0%' }}
                  ></div>
                </div>
                <div className="w-10 text-right text-xs text-slate-500">{item.count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="text-sky-500" size={16} />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('clinicDashboard.priority')}</h3>
            </div>
            <button onClick={() => setPage('clinics')} className="text-xs text-primary-600 hover:underline">{t('clinicDashboard.viewAll')}</button>
          </div>
          <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
            <li>• {pending.length} {t('clinicDashboard.pendingRequests')}</li>
            <li>• {expiringCount} {t('clinicDashboard.expiringCount')}</li>
            <li>• {forceLogoutCount} {t('clinicDashboard.forceLogoutCount')}</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('clinicDashboard.requests')}</h3>
            </div>
            <span className="text-xs text-slate-500">{pending.length} {t('clinicDashboard.pending')}</span>
          </div>
          {loading ? (
            <div className="p-6 text-center text-slate-400">{t('common.loading')}</div>
          ) : pending.length === 0 ? (
            <div className="p-6 text-center text-slate-400">{t('clinicDashboard.noRequests')}</div>
          ) : (
            <div className="space-y-3">
              {pending.slice(0, 5).map(c => (
                <div key={c.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{c.name}</p>
                      <p className="text-xs text-slate-500">{c.email}</p>
                    </div>
                    <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">{t('clinicDashboard.pending')}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-2 flex flex-wrap gap-3">
                    {c.phone && <span className="flex items-center gap-1"><Phone size={12} /> {c.phone}</span>}
                    {c.address && <span className="flex items-center gap-1"><MapPin size={12} /> {c.address}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 text-right">
            <button onClick={() => setPage('clinics')} className="text-sm text-primary-600 hover:underline">{t('clinicDashboard.viewAll')}</button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('clinicDashboard.recentApproved')}</h3>
            </div>
            <span className="text-xs text-slate-500">{approved.length} {t('clinicDashboard.shown')}</span>
          </div>
          {approved.length === 0 ? (
            <div className="p-6 text-center text-slate-400">{t('clinicDashboard.noApproved')}</div>
          ) : (
            <div className="space-y-3">
              {approved.map(c => (
                <div key={c.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{c.name}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-500" /> {t('clinicDashboard.approved')}</p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <div className="font-mono text-emerald-600 dark:text-emerald-300">{c.id.slice(0, 8)}...</div>
                      {c.license?.plan?.name && <div>{c.license.plan.name}</div>}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 flex flex-wrap gap-2">
                    <span className="flex items-center gap-1"><Mail size={12} /> {c.email}</span>
                    {c.license?.expireDate && <span className="flex items-center gap-1"><AlertTriangle size={12} /> {t('clinics.expires')}: {new Date(c.license.expireDate).toLocaleDateString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 text-right">
            <button onClick={() => setPage('manage-clinics')} className="text-sm text-primary-600 hover:underline">{t('clinicDashboard.manage')}</button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-sky-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('clinicDashboard.reminders')}</h3>
            </div>
          <span className="text-xs text-slate-500">{t('clinicDashboard.auto')}</span>
        </div>
        <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-2 list-disc list-inside">
          <li>{t('clinicDashboard.reminder1')}</li>
          <li>{t('clinicDashboard.reminder2')}</li>
          <li>{t('clinicDashboard.reminder3')}</li>
        </ul>
      </div>
    </div>
  );
};

export default ClinicDashboard;
