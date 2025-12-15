import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { ServerHealth, SubscriptionPlan, AuditLog } from '../types';
import { api } from '../services/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import {
  Users,
  DollarSign,
  Activity,
  Plus,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  FileText,
  CreditCard,
  Settings,
  Zap,
  ArrowUpRight,
  Server,
  Cpu,
  HardDrive,
  Database,
  ArrowRight,
  RefreshCw,
  Globe
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar
} from 'recharts';

interface DashboardProps {
  setPage: (page: string) => void;
}

// --- Helper Components ---

const StatCard = ({ title, value, icon: Icon, color, trend, trendValue, subtitle }: any) => {
  const isPositive = trend === 'up';

  const gradients: any = {
    sky: 'from-sky-500 to-blue-600 shadow-blue-500/20',
    emerald: 'from-emerald-400 to-green-600 shadow-emerald-500/20',
    indigo: 'from-indigo-500 to-violet-600 shadow-indigo-500/20',
    rose: 'from-rose-500 to-red-600 shadow-rose-500/20',
    amber: 'from-amber-400 to-orange-500 shadow-amber-500/20',
  };

  const bgGradient = gradients[color] || gradients.sky;

  return (
    <div className="relative bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 group overflow-hidden">
      <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${bgGradient} rounded-full opacity-10 group-hover:opacity-20 transition-opacity blur-2xl`}></div>

      <div className="relative z-10 flex justify-between items-start mb-3">
        <div>
          <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</h3>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{value}</p>
        </div>
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${bgGradient} text-white shadow-lg`}>
          <Icon size={18} />
        </div>
      </div>

      <div className="flex items-center gap-2 relative z-10">
        {trendValue && (
          <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${isPositive ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-400'}`}>
            {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {trendValue}
          </div>
        )}
        {subtitle && <span className="text-[10px] text-slate-400">{subtitle}</span>}
      </div>
    </div>
  );
};

const ResourceBar = ({ label, percentage, colorClass, icon: Icon }: any) => (
  <div className="mb-3 last:mb-0">
    <div className="flex justify-between text-xs mb-1 font-medium text-slate-600 dark:text-slate-300">
      <span className="flex items-center gap-1.5"><Icon size={12} className="opacity-70" /> {label}</span>
      <span className="font-mono">{percentage}%</span>
    </div>
    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden border border-slate-100 dark:border-slate-700/50">
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${colorClass}`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  </div>
);

const ActivityItem = ({ log }: { log: any }) => {
  const getIcon = (action: string) => {
    if (action.includes('LOGIN')) return <Users size={14} className="text-blue-500" />;
    if (action.includes('create') || action.includes('GENERATE') || action.includes('ADD')) return <Plus size={14} className="text-emerald-500" />;
    if (action.includes('DELETE') || action.includes('REVOKE')) return <AlertTriangle size={14} className="text-rose-500" />;
    if (action.includes('UPDATE')) return <FileText size={14} className="text-amber-500" />;
    return <Activity size={14} className="text-slate-500" />;
  };

  return (
    <div className="flex items-start gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded-lg transition-colors border-b border-slate-50 dark:border-slate-700/50 last:border-0">
      <div className="mt-0.5 w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
        {getIcon(log.action)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
          <span className="font-bold text-slate-900 dark:text-white">{log.userName}</span> {log.action.toLowerCase().replace(/_/g, ' ')}
        </p>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{log.details}</p>
      </div>
      <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
        {new Date(log.timestamp || log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
};

const QuickActionCard = ({ title, icon: Icon, colorClass, onClick }: any) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-2 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-md transition-all group h-full"
  >
    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass} group-hover:scale-110 transition-transform`}>
      <Icon size={20} />
    </div>
    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide text-center">{title}</span>
  </button>
);

class ChartBoundary extends React.Component<{ children: React.ReactNode, fallback?: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.error('Chart render error', error);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

const Dashboard: React.FC<DashboardProps> = ({ setPage }) => {
  const { t, i18n } = useTranslation();
  const { tick: autoRefreshTick } = useAutoRefresh();
  const [stats, setStats] = useState<any>({ activeLicenses: 0, expiredLicenses: 0, totalRevenueUSD: 0, totalCustomers: 0, expiringSoonCount: 0, openTickets: 0 });
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansData, setPlansData] = useState<any[]>([]);
  const [chartData, setChartData] = useState<{ name: string; revenue: number }[]>([]);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<'year' | '6months'>('year');
  const [serverHealth, setServerHealth] = useState<ServerHealth>({
    cpuUsage: 0,
    ramUsage: 0,
    diskUsage: 0,
    uptimeSeconds: 0,
    networkIn: 0,
    networkOut: 0,
    activeConnections: 0,
    lastUpdated: new Date().toISOString()
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, logsRes, plansRes, revenueRes, healthRes, licensesRes] = await Promise.all([
          api.getStats(),
          api.getAuditLogs().catch(() => []),
          api.getPlans(),
          api.getRevenueHistory(),
          api.getServerHealth(),
          api.getLicenses().catch(() => [])
        ]);
        setStats(statsRes);
        setLogs((logsRes as AuditLog[]).slice(0, 5));
        setPlans(plansRes);
        setPlansData(
          plansRes.map((p) => ({
            name: p.name,
            count: (licensesRes as any[]).filter((l) => l.planId === p.id).length,
            price: p.priceUSD
          }))
        );
        setChartData(revenueRes);
        setServerHealth(healthRes);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [chartPeriod, autoRefreshTick]);

  useEffect(() => {
    setMounted(true);
    const timeTimer = setInterval(() => setCurrentTime(new Date()), 60000);
    const healthTimer = setInterval(async () => {
      try {
        const h = await api.getServerHealth();
        setServerHealth(h);
      } catch (err) {
        console.error(err);
      }
    }, 3000);
    return () => {
      clearInterval(timeTimer);
      clearInterval(healthTimer);
    };
  }, []);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const canRenderRevenue = mounted && chartData.length > 0;
  const canRenderPlans = mounted && plansData.length > 0;

  // --- Safe sizing for charts ---
  const revenueRef = useRef<HTMLDivElement | null>(null);
  const plansRef = useRef<HTMLDivElement | null>(null);
  const [revenueSize, setRevenueSize] = useState({ width: 0, height: 0 });
  const [plansSize, setPlansSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const observe = (el: HTMLElement | null, setter: (v: { width: number; height: number }) => void) => {
      if (!el) return;
      const update = () => setter({ width: el.clientWidth, height: el.clientHeight });
      update();
      if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
      }
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    };

    const cleanRevenue = observe(revenueRef.current, setRevenueSize);
    const cleanPlans = observe(plansRef.current, setPlansSize);
    return () => {
      cleanRevenue?.();
      cleanPlans?.();
    };
  }, []);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {t('dashboard.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            System Operational • {new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-EG' : 'en-US', { dateStyle: 'full' }).format(currentTime)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPage('licenses')}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-md shadow-primary-600/20 transition-all active:scale-95 text-sm font-bold"
          >
            <Plus size={16} /> {t('licenses.add')}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('dashboard.revenue')}
          value={`$${stats.totalRevenueUSD?.toLocaleString?.() || 0}`}
          icon={DollarSign}
          color="indigo"
          trend="up"
          trendValue="8.4%"
          subtitle="Total Income"
        />
        <StatCard
          title={t('dashboard.activeLicenses')}
          value={stats.activeLicenses}
          icon={ShieldCheck}
          color="emerald"
          trend="up"
          trendValue="12%"
          subtitle="Deployed Keys"
        />
        <StatCard
          title={t('dashboard.totalCustomers')}
          value={stats.totalCustomers}
          icon={Users}
          color="sky"
          trend="up"
          trendValue="4%"
          subtitle="Unique Clients"
        />
        <StatCard
          title={t('nav.support')}
          value={stats.openTickets}
          icon={Activity}
          color={stats.openTickets > 0 ? "rose" : "amber"}
          trend={stats.openTickets > 5 ? "up" : "down"}
          trendValue={stats.openTickets}
          subtitle="Pending Tickets"
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" suppressHydrationWarning>

        {/* Left Column (Charts & Quick Actions) */}
        <div className="lg:col-span-8 space-y-6">

          {/* Revenue Chart */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 min-w-0">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-indigo-500" />
                  {t('dashboard.revenueTrend')}
                </h2>
              </div>
              <select
                value={chartPeriod}
                onChange={(e) => setChartPeriod(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs px-2 py-1 text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
              >
                <option value="year">This Year</option>
                <option value="6months">Last 6 Months</option>
              </select>
            </div>
            <div className="h-[250px] w-full min-w-0" ref={revenueRef}>
              {canRenderRevenue && revenueSize.width > 10 ? (
                <ChartBoundary fallback={<div className="h-full w-full flex items-center justify-center bg-slate-50 dark:bg-slate-700/20 rounded-xl text-slate-400 text-xs">Chart unavailable</div>}>
                  <AreaChart
                    width={Math.max(200, revenueSize.width)}
                    height={250}
                    data={chartData}
                  >
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" strokeOpacity={0.1} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: any) => [`$${value}`, 'Revenue']}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      animationDuration={1000}
                    />
                  </AreaChart>
                </ChartBoundary>
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-slate-50 dark:bg-slate-700/20 rounded-xl text-slate-400 text-xs">
                  {mounted ? 'No data to display' : 'Loading chart...'}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <QuickActionCard
              title="Add User"
              icon={Users}
              colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
              onClick={() => setPage('team')}
            />
            <QuickActionCard
              title="Settings"
              icon={Settings}
              colorClass="bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
              onClick={() => setPage('config')}
            />
            <QuickActionCard
              title="Audit Logs"
              icon={FileText}
              colorClass="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
              onClick={() => setPage('audit-logs')}
            />
            <QuickActionCard
              title="Support"
              icon={RefreshCw}
              colorClass="bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400"
              onClick={() => setPage('support')}
            />
          </div>

          {/* Plans Performance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 min-w-0">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Sales by Plan</h3>
              <div className="h-[180px] w-full min-w-0" ref={plansRef}>
                {canRenderPlans && plansSize.width > 10 ? (
                  <ChartBoundary fallback={<div className="h-full w-full flex items-center justify-center bg-slate-50 dark:bg-slate-700/20 rounded-xl text-slate-400 text-xs">Chart unavailable</div>}>
                    <BarChart
                      width={Math.max(200, plansSize.width)}
                      height={180}
                      data={plansData}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" strokeOpacity={0.1} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={90} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                      />
                      <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={12} />
                    </BarChart>
                  </ChartBoundary>
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-slate-50 dark:bg-slate-700/20 rounded-xl text-slate-400 text-xs">
                    {mounted ? 'No plan data yet' : 'Loading chart...'}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-center">
              {(() => {
                const bestPlan = plansData.reduce((prev, current) => (prev.count > current.count ? prev : current), { name: 'No Data', count: 0, price: 0 });
                const totalLicenses = plansData.reduce((sum, item) => sum + item.count, 0);
                const percent = totalLicenses > 0 ? Math.round((bestPlan.count / totalLicenses) * 100) : 0;

                return (
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-2">
                      <CreditCard size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{bestPlan.name || 'No Plans Yet'}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Best Performing Plan</p>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mb-2 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${percent}%` }}></div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{percent}% of active licenses</span>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Right Column (Server Health & Logs) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Server Resource Monitor */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-500" />
                {t('dashboard.systemHealth')}
              </h2>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>

            <div className="mb-5 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">{t('dashboard.uptime')}</p>
                <p className="text-base font-mono font-bold text-slate-700 dark:text-slate-200">{formatUptime(serverHealth.uptimeSeconds)}</p>
              </div>
              <Activity className="text-emerald-500" size={18} />
            </div>

            <ResourceBar
              label={t('dashboard.cpu')}
              percentage={serverHealth.cpuUsage}
              colorClass="bg-indigo-500"
              icon={Cpu}
            />
            <ResourceBar
              label={t('dashboard.memory')}
              percentage={serverHealth.ramUsage}
              colorClass="bg-sky-500"
              icon={Database}
            />
            <ResourceBar
              label={t('dashboard.storage')}
              percentage={serverHealth.diskUsage}
              colorClass="bg-amber-500"
              icon={HardDrive}
            />

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                <Globe size={10} /> {t('dashboard.network')}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Incoming</span>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    <ArrowRight size={10} className="inline rotate-90" /> {serverHealth.networkIn} MB/s
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Outgoing</span>
                  <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">
                    <ArrowUpRight size={10} className="inline" /> {serverHealth.networkOut} MB/s
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-fit">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-orange-500" />
                Latest Activity
              </h2>
              <button onClick={() => setPage('audit-logs')} className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1">
                View All
              </button>
            </div>
            <div className="p-1">
              {logs.length > 0 ? logs.map(log => <ActivityItem key={log.id} log={log} />) : (
                <div className="p-6 text-center text-slate-400 text-xs">No recent activity.</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
