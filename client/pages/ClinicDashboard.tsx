import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Stethoscope, ShieldCheck, Clock, CheckCircle2, RefreshCw, Zap, Radio, Building2, ExternalLink, ChevronRight, Activity } from 'lucide-react';
import { api } from '../services/api';
import { Clinic, RegistrationStatus } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface Props {
  setPage: (page: string) => void;
}

const DashboardStat = ({ label, value, icon: Icon, colorClass, delay }: { label: string; value: string | number; icon: any; colorClass: string; delay: number }) => (
  <div className="glass-stat-card group relative animate-scaleUp" style={{ animationDelay: `${delay}ms` }}>
    <div className="relative z-10">
      <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center transition-all bg-slate-100 dark:bg-slate-800 ${colorClass}`}>
        <Icon size={24} />
      </div>
      <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">{label}</p>
      <p className="text-3xl font-black text-slate-900 dark:text-white leading-none">{value}</p>
    </div>
    <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl rounded-full -mr-12 -mt-12 opacity-0 group-hover:opacity-20 transition-opacity ${colorClass.split(' ')[0]}`} />
  </div>
);

const ClinicDashboard: React.FC<Props> = ({ setPage }) => {
  const { t } = useTranslation();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refreshIntervalMs = 30000;

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await api.getClinics();
      setClinics(data);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Failed to load clinics', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
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

  if (loading) {
    return (
      <div className="clinic-bg-gradient flex flex-col items-center justify-center min-h-screen">
        <div className="glass-modal p-10 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary-500/5 animate-pulse" />
          <RefreshCw className="animate-spin text-primary-500 mx-auto mb-6 relative z-10" size={64} />
          <p className="text-slate-900 dark:text-white text-xl font-black uppercase tracking-widest relative z-10">{t('common.loading')}</p>
          <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold mt-2 uppercase tracking-[0.2em] relative z-10">Syncing Global Topology...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="clinic-bg-gradient min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
              <span className="text-[10px] font-black text-primary-500 uppercase tracking-[0.4em]">SmartClinic Node Telemetry</span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
              Control <span className="text-primary-500">Center</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm tracking-tight opacity-70">Infrastructure Pulse • v{clinics.length}.0.4</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Last Data Ingest</p>
              <p className="text-xs font-mono font-bold text-slate-700 dark:text-white">
                {lastUpdated ? lastUpdated.toLocaleTimeString() : '--:--:--'}
              </p>
            </div>
            <button
              onClick={load}
              disabled={refreshing}
              className="glass-button p-4 hover:scale-105 active:scale-95 transition-all group"
            >
              <RefreshCw size={22} className={`text-primary-500 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            </button>
          </div>
        </div>

        {/* Global Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardStat
            label="Total Nodes"
            value={clinics.length}
            icon={Building2}
            colorClass="text-blue-500 bg-blue-500/10"
            delay={100}
          />
          <DashboardStat
            label="Live Provisioning"
            value={statusCounts[RegistrationStatus.APPROVED]}
            icon={CheckCircle2}
            colorClass="text-emerald-500 bg-emerald-500/10"
            delay={200}
          />
          <DashboardStat
            label="Pending Inbound"
            value={statusCounts[RegistrationStatus.PENDING]}
            icon={Clock}
            colorClass="text-amber-500 bg-amber-500/10"
            delay={300}
          />
          <DashboardStat
            label="Security Lockdown"
            value={statusCounts[RegistrationStatus.SUSPENDED]}
            icon={ShieldCheck}
            colorClass="text-rose-500 bg-rose-500/10"
            delay={400}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Alerts & Monitoring */}
          <div className="lg:col-span-2 space-y-8">
            {/* Urgent Alerts Section */}
            <div className="glass-card overflow-hidden">
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                  <Radio size={16} className="text-primary-500 animate-pulse" />
                  Active Infrastructure Pulse
                </h3>
                <button onClick={() => setPage('clinics')} className="text-[10px] font-black text-primary-500 hover:text-primary-600 transition-colors uppercase flex items-center gap-1">
                  Operational Map <ExternalLink size={10} />
                </button>
              </div>
              <div className="p-10 text-center space-y-4">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-primary-500/10 blur-3xl rounded-full" />
                  <Activity size={80} className="text-slate-200 dark:text-slate-800 relative z-10" />
                </div>
                <div>
                  <p className="text-slate-900 dark:text-white font-black uppercase tracking-tight text-xl">System Analytics Active</p>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Monitoring {clinics.length} Global Discovery Nodes</p>
                </div>
                <button
                  onClick={() => setPage('clinics')}
                  className="glass-button px-6 py-3 text-xs font-black uppercase tracking-widest hover:bg-primary-500 hover:text-white transition-all"
                >
                  Open Management Console
                </button>
              </div>
            </div>

            {/* Registration Feed */}
            <div className="glass-card overflow-hidden">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Inbound Queue</h3>
                <span className="glass-badge py-1 px-3 text-[10px]">{pending.length} Awaiting</span>
              </div>
              <div className="divide-y divide-white/5">
                {pending.length > 0 ? pending.slice(0, 4).map(clinic => (
                  <div key={clinic.id} className="p-6 flex items-center justify-between hover:bg-white/[0.03] transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-500 group-hover:scale-110 transition-transform">
                        {clinic.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase leading-none mb-1">{clinic.name}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                          <Clock size={10} />
                          {clinic.createdAt ? new Date(clinic.createdAt).toLocaleDateString() : 'Sync Pending'}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setPage('clinics')} className="p-2 text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )) : (
                  <div className="p-12 text-center text-slate-500 font-bold text-xs uppercase tracking-widest">Queue Clear • No Pending Actions</div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: System Status */}
          <div className="space-y-8">
            <div className="glass-card p-8 bg-gradient-to-br from-primary-500 to-primary-600 text-white border-none shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <Stethoscope size={40} className="mb-6 opacity-80" />
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">SmartClinic<br />Infrastructure</h2>
                <p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-6 leading-relaxed">Enterprise management and global provisioning system active.</p>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('dashboard.active')}</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 space-y-6">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-white/10 pb-4">Security Protocol</h3>
              <div className="space-y-4">
                {[
                  { label: 'Uplink Encryption', status: 'AES-256', icon: ShieldCheck, color: 'text-emerald-500' },
                  { label: 'Node Isolation', status: 'Enabled', icon: Zap, color: 'text-primary-500' },
                  { label: 'Latency Check', status: '12ms', icon: Activity, color: 'text-blue-500' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <item.icon size={16} className={item.color} />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{item.label}</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicDashboard;
