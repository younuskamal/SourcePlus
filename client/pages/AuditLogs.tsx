import React, { useEffect, useState } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import TrafficLogs from '../components/TrafficLogs';
import { exportToExcel } from '../utils/excelExport';
import { translations, Language } from '../locales';
import { ClipboardList, Search, User, Trash2, Download, Filter, Calendar, CheckCircle2, Activity, Server } from 'lucide-react';
import { api } from '../services/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { useSystem } from '../context/SystemContext';

interface AuditLogsProps {
  currentLang: Language;
}

const AuditLogs: React.FC<AuditLogsProps> = ({ currentLang }) => {
  const t = translations[currentLang];
  const { product } = useSystem();
  const { tick: autoRefreshTick, requestRefresh } = useAutoRefresh();
  const [activeTab, setActiveTab] = useState<'system' | 'traffic'>('system');

  // System Logs State
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');
  const [isClearing, setIsClearing] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  useEffect(() => {
    if (activeTab === 'system') {
      api.getAuditLogs(product).then(setLogs).catch(console.error);
    }
  }, [autoRefreshTick, activeTab, product]);

  const handleClearLogs = () => {
    setIsClearModalOpen(true);
  };

  const confirmClear = () => {
    setIsClearing(true);
    // Simulate a small delay for better UX
    setTimeout(async () => {
      await api.clearAuditLogs();
      setLogs(await api.getAuditLogs());
      requestRefresh();
      setIsClearing(false);
      setIsClearModalOpen(false);
    }, 800);
  };

  const handleExport = () => {
    const data = logs.map(l => ({
      "Timestamp": l.timestamp,
      "User": l.userName,
      "Action": l.action,
      "Details": l.details,
      "IP": l.ipAddress
    }));
    exportToExcel(data, "audit_logs", "Audit Logs");
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = (log.userName || '').toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filterAction === 'ALL' || log.action.includes(filterAction);

    return matchesSearch && matchesFilter;
  });

  const getActionBadge = (action: string) => {
    let colorClass = 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300';

    if (action.includes('DELETE') || action.includes('REVOKE') || action.includes('CLEAR')) {
      colorClass = 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800';
    } else if (action.includes('CREATE') || action.includes('ADD') || action.includes('GENERATE')) {
      colorClass = 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800';
    } else if (action.includes('UPDATE') || action.includes('EDIT') || action.includes('SYNC')) {
      colorClass = 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800';
    } else if (action.includes('LOGIN')) {
      colorClass = 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800';
    }

    return (
      <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${colorClass}`}>
        {action.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="text-sky-600 dark:text-sky-400" />
            {t.auditLogs}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Monitor system security and trace user activities.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('system')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'system'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-slate-400 dark:hover:text-slate-300'}
            `}
          >
            <Activity size={18} />
            System Logs
          </button>
          <button
            onClick={() => setActiveTab('traffic')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'traffic'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-slate-400 dark:hover:text-slate-300'}
            `}
          >
            <Server size={18} />
            Traffic Logs
          </button>
        </nav>
      </div>

      {activeTab === 'system' ? (
        <>
          <div className="flex justify-end gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Download size={16} />
              {t.exportCsv}
            </button>
            <button
              onClick={handleClearLogs}
              disabled={isClearing}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors text-sm font-medium shadow-sm disabled:opacity-50"
            >
              {isClearing ? <CheckCircle2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              {isClearing ? 'Clearing...' : t.clearLogs}
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col">
            {/* Controls Bar */}
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search user, action, or details..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                />
              </div>

              <div className="relative min-w-[200px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm appearance-none cursor-pointer"
                >
                  <option value="ALL">All Actions</option>
                  <option value="LOGIN">Logins</option>
                  <option value="CREATE">Creations</option>
                  <option value="UPDATE">Updates</option>
                  <option value="DELETE">Deletions</option>
                  <option value="CLEAR_LOGS">Log Clearing</option>
                </select>
              </div>
            </div>

            {/* Logs Table */}
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left text-sm text-gray-600 dark:text-slate-400">
                <thead className="bg-gray-50 dark:bg-slate-900/50 text-gray-700 dark:text-slate-300 font-semibold uppercase tracking-wider text-xs border-b border-gray-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-4">{t.timestamp}</th>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">{t.action}</th>
                    <th className="px-6 py-4 w-1/3">{t.details}</th>
                    <th className="px-6 py-4 text-right">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-16">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <ClipboardList size={48} strokeWidth={1} className="mb-4 text-slate-300 dark:text-slate-600" />
                          <p className="text-lg font-medium text-slate-500">No logs found</p>
                          <p className="text-sm">Try adjusting your search or filters.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <Calendar size={14} />
                            <span className="font-mono text-xs">{new Date(log.timestamp || log.createdAt).toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium">
                            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs">
                              <User size={12} className="text-slate-500 dark:text-slate-400" />
                            </div>
                            {log.userName}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getActionBadge(log.action)}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                          {log.details}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-xs text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                          {log.ipAddress}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/30 text-xs text-slate-500 flex justify-between items-center">
              <span>Showing {filteredLogs.length} records</span>
              {logs.length > 50 && (
                <button className="text-sky-600 hover:text-sky-700 font-medium">Load More</button>
              )}
            </div>
          </div>

          <ConfirmModal
            isOpen={isClearModalOpen}
            onClose={() => setIsClearModalOpen(false)}
            onConfirm={confirmClear}
            title={t.clearLogs || "Clear Audit Logs"}
            message={t.confirmClearLogs || "Are you sure you want to clear the entire audit log history?"}
            confirmText={t.clearLogs || "Clear"}
            type="danger"
          />
        </>
      ) : (
        <TrafficLogs />
      )}
    </div >
  );
};

export default AuditLogs;
