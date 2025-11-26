import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { Clock, Search, Filter, RefreshCw, Eye, Trash2, CheckCircle2, XCircle, AlertTriangle, Info, Server, Monitor, Globe } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface TrafficLog {
    id: string;
    timestamp: string;
    method: string;
    endpoint: string;
    status: number;
    serial?: string;
    hardwareId?: string;
    ipAddress?: string;
    userAgent?: string;
    payload?: any;
    response?: any;
    durationMs?: number;
}

const TrafficLogs: React.FC = () => {
    const [logs, setLogs] = useState<TrafficLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [isClearing, setIsClearing] = useState(false);
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState<TrafficLog | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Filters
    const [methodFilter, setMethodFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');

    const pollingInterval = useRef<NodeJS.Timeout | null>(null);

    const fetchLogs = async () => {
        try {
            const params: any = {};
            if (methodFilter) params.method = methodFilter;
            if (statusFilter) params.status = statusFilter;
            if (search) params.search = search;

            const response = await api.getTrafficLogs(params);
            // Assuming response.data contains the logs
            setLogs(response.data || []);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch traffic logs', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();

        // Auto polling every 5 seconds
        pollingInterval.current = setInterval(fetchLogs, 5000);

        return () => {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        };
    }, [methodFilter, statusFilter, search]);

    const handleClearLogs = () => {
        setIsClearModalOpen(true);
    };

    const confirmClear = async () => {
        setIsClearing(true);
        try {
            await api.clearTrafficLogs();
            setLogs([]);
            setIsClearModalOpen(false);
        } catch (error) {
            console.error('Failed to clear logs', error);
        } finally {
            setIsClearing(false);
        }
    };

    const openDetails = async (log: TrafficLog) => {
        // Fetch full details including payload/response if not present
        try {
            const details = await api.getTrafficLogDetails(log.id);
            setSelectedLog(details);
            setIsDetailsOpen(true);
        } catch (error) {
            console.error('Failed to fetch log details', error);
        }
    };

    const getMethodBadge = (method: string) => {
        const colors: Record<string, string> = {
            GET: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
            POST: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
            PUT: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
            DELETE: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800',
            PATCH: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        };
        return (
            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${colors[method] || 'bg-gray-100 text-gray-800'}`}>
                {method}
            </span>
        );
    };

    const getStatusBadge = (status: number) => {
        let color = 'bg-gray-100 text-gray-800';
        if (status >= 200 && status < 300) color = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
        else if (status >= 300 && status < 400) color = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
        else if (status >= 400 && status < 500) color = 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
        else if (status >= 500) color = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';

        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search endpoint, serial, hardware ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none text-sm"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={methodFilter}
                        onChange={(e) => setMethodFilter(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    >
                        <option value="">All Methods</option>
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    >
                        <option value="">All Status</option>
                        <option value="200">200 OK</option>
                        <option value="400">400 Bad Request</option>
                        <option value="401">401 Unauthorized</option>
                        <option value="403">403 Forbidden</option>
                        <option value="404">404 Not Found</option>
                        <option value="500">500 Server Error</option>
                    </select>
                    <button
                        onClick={handleClearLogs}
                        className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <Trash2 size={16} />
                        Clear Logs
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-900/50 text-gray-500 dark:text-slate-400 font-medium border-b border-gray-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-3">Time</th>
                                <th className="px-6 py-3">Method</th>
                                <th className="px-6 py-3">Endpoint</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Serial / Hardware</th>
                                <th className="px-6 py-3">IP Address</th>
                                <th className="px-6 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                            {logs.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-slate-400">
                                        No traffic logs found.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-3 whitespace-nowrap text-gray-600 dark:text-slate-300">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="text-gray-400" />
                                                <span className="font-mono text-xs">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            {getMethodBadge(log.method)}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="font-mono text-xs text-gray-600 dark:text-slate-300" title={log.endpoint}>
                                                {log.endpoint.length > 40 ? log.endpoint.substring(0, 40) + '...' : log.endpoint}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            {getStatusBadge(log.status)}
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex flex-col gap-0.5">
                                                {log.serial && (
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-slate-300">
                                                        <Server size={12} className="text-gray-400" />
                                                        <span className="font-mono">{log.serial}</span>
                                                    </div>
                                                )}
                                                {log.hardwareId && (
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                                                        <Monitor size={12} className="text-gray-400" />
                                                        <span className="font-mono">{log.hardwareId.substring(0, 12)}...</span>
                                                    </div>
                                                )}
                                                {!log.serial && !log.hardwareId && <span className="text-gray-400">-</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-gray-600 dark:text-slate-300 font-mono text-xs">
                                            {log.ipAddress || '-'}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <button
                                                onClick={() => openDetails(log)}
                                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Details Modal */}
            {isDetailsOpen && selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                {getMethodBadge(selectedLog.method)}
                                <span className="font-mono text-sm text-gray-600 dark:text-slate-300">{selectedLog.endpoint}</span>
                                {getStatusBadge(selectedLog.status)}
                            </div>
                            <button
                                onClick={() => setIsDetailsOpen(false)}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                            >
                                <XCircle size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-3 bg-gray-50 dark:bg-slate-900/30 rounded-lg border border-gray-100 dark:border-slate-700/50">
                                    <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Timestamp</div>
                                    <div className="text-sm font-mono">{new Date(selectedLog.timestamp).toLocaleString()}</div>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-slate-900/30 rounded-lg border border-gray-100 dark:border-slate-700/50">
                                    <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Duration</div>
                                    <div className="text-sm font-mono">{selectedLog.durationMs ? `${selectedLog.durationMs.toFixed(2)}ms` : '-'}</div>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-slate-900/30 rounded-lg border border-gray-100 dark:border-slate-700/50">
                                    <div className="text-xs text-gray-500 uppercase font-semibold mb-1">IP Address</div>
                                    <div className="text-sm font-mono">{selectedLog.ipAddress || '-'}</div>
                                </div>
                            </div>

                            {/* Client Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-3 bg-gray-50 dark:bg-slate-900/30 rounded-lg border border-gray-100 dark:border-slate-700/50">
                                    <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Serial Number</div>
                                    <div className="text-sm font-mono break-all">{selectedLog.serial || '-'}</div>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-slate-900/30 rounded-lg border border-gray-100 dark:border-slate-700/50">
                                    <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Hardware ID</div>
                                    <div className="text-sm font-mono break-all">{selectedLog.hardwareId || '-'}</div>
                                </div>
                            </div>

                            {/* Request Payload */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                    <Server size={14} /> Request Payload
                                </h3>
                                <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                                    <pre className="text-xs font-mono text-emerald-400">
                                        {selectedLog.payload ? JSON.stringify(selectedLog.payload, null, 2) : '// No payload'}
                                    </pre>
                                </div>
                            </div>

                            {/* Response Body */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                    <Globe size={14} /> Response Body
                                </h3>
                                <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                                    <pre className="text-xs font-mono text-sky-400">
                                        {selectedLog.response ? JSON.stringify(selectedLog.response, null, 2) : '// No response body captured'}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={isClearModalOpen}
                onClose={() => setIsClearModalOpen(false)}
                onConfirm={confirmClear}
                title="Clear Traffic Logs"
                message="Are you sure you want to clear all traffic logs? This action cannot be undone."
                confirmText="Clear All"
                type="danger"
            />
        </div>
    );
};

export default TrafficLogs;
