
import React, { useEffect, useState } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import { useTranslation } from '../hooks/useTranslation';
import {
    Bell, Send, Users, User, CheckCircle2, Trash2, History,
    Clock, Sparkles, TrendingUp, MessageSquare, AlertCircle,
    Calendar, Filter, Search, X
} from 'lucide-react';
import { api } from '../services/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

// Notification Templates
const TEMPLATES = [
    {
        id: 'update',
        icon: '🔄',
        title: 'System Update Available',
        body: 'A new version is available. Please update your app to enjoy the latest features and improvements.',
        category: 'update'
    },
    {
        id: 'expiry',
        icon: '⏰',
        title: 'License Expiring Soon',
        body: 'Your license will expire in 7 days. Please renew to continue using our services.',
        category: 'warning'
    },
    {
        id: 'welcome',
        icon: '👋',
        title: 'Welcome to SourcePlus',
        body: 'Thank you for choosing SourcePlus! We\'re excited to have you on board.',
        category: 'info'
    },
    {
        id: 'maintenance',
        icon: '🔧',
        title: 'Scheduled Maintenance',
        body: 'We will be performing system maintenance on [DATE]. Service may be temporarily unavailable.',
        category: 'warning'
    },
    {
        id: 'feature',
        icon: '✨',
        title: 'New Feature Released',
        body: 'Check out our latest feature! [FEATURE_NAME] is now available in your dashboard.',
        category: 'info'
    },
    {
        id: 'security',
        icon: '🔒',
        title: 'Security Alert',
        body: 'We detected unusual activity on your account. Please review your recent activity.',
        category: 'alert'
    }
];

const Notifications: React.FC = () => {
    const { t } = useTranslation();
    const [notifications, setNotifications] = useState<any[]>([]);
    const { tick: autoRefreshTick, requestRefresh } = useAutoRefresh();

    // Form State
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [targetType, setTargetType] = useState<'broadcast' | 'serial'>('broadcast');
    const [targetSerial, setTargetSerial] = useState('');
    const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);

    // Filter State
    const [filterType, setFilterType] = useState<'all' | 'broadcast' | 'direct'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // UI State
    const [showTemplates, setShowTemplates] = useState(false);

    useEffect(() => {
        api.getNotifications().then(setNotifications).catch(console.error);
    }, [autoRefreshTick]);

    const handleSend = () => {
        if (!title || !body) return;

        const payload = targetType === 'serial' ? { title, body, targetSerial } : { title, body };
        api.sendNotification(payload).then(async () => {
            setNotifications(await api.getNotifications());
            requestRefresh();
            // Reset
            setTitle('');
            setBody('');
            setTargetSerial('');
            setShowTemplates(false);
        });
    };

    const handleTemplateSelect = (template: typeof TEMPLATES[0]) => {
        setTitle(template.title);
        setBody(template.body);
        setShowTemplates(false);
    };

    const handleClearHistory = () => {
        setIsClearHistoryModalOpen(true);
    };

    const confirmClearHistory = () => {
        api.clearNotifications().then(async () => {
            setNotifications(await api.getNotifications());
            requestRefresh();
            setIsClearHistoryModalOpen(false);
        });
    };

    const handleDeleteOne = (id: string) => {
        api.deleteNotification(id).then(async () => {
            setNotifications(await api.getNotifications());
            requestRefresh();
        });
    };

    // Filter notifications
    const filteredNotifications = notifications.filter(notif => {
        const matchesType =
            filterType === 'all' ? true :
                filterType === 'broadcast' ? !notif.targetSerial :
                    !!notif.targetSerial;

        const matchesSearch =
            searchQuery === '' ? true :
                notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                notif.body.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesType && matchesSearch;
    });

    // Statistics
    const stats = {
        total: notifications.length,
        broadcast: notifications.filter(n => !n.targetSerial).length,
        direct: notifications.filter(n => n.targetSerial).length,
        today: notifications.filter(n => {
            const sentDate = new Date(n.sentAt);
            const today = new Date();
            return sentDate.toDateString() === today.toDateString();
        }).length
    };

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-sky-500 to-indigo-500 rounded-xl text-white shadow-lg shadow-sky-500/20">
                            <Bell size={24} />
                        </div>
                        {t('notifications.title')}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Send notifications to users and manage notification history
                    </p>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Sent</p>
                            <p className="text-2xl font-black text-blue-900 dark:text-blue-100 mt-1">{stats.total}</p>
                        </div>
                        <div className="p-3 bg-blue-200 dark:bg-blue-800/50 rounded-lg">
                            <MessageSquare size={20} className="text-blue-700 dark:text-blue-300" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Broadcast</p>
                            <p className="text-2xl font-black text-emerald-900 dark:text-emerald-100 mt-1">{stats.broadcast}</p>
                        </div>
                        <div className="p-3 bg-emerald-200 dark:bg-emerald-800/50 rounded-lg">
                            <Users size={20} className="text-emerald-700 dark:text-emerald-300" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Direct</p>
                            <p className="text-2xl font-black text-purple-900 dark:text-purple-100 mt-1">{stats.direct}</p>
                        </div>
                        <div className="p-3 bg-purple-200 dark:bg-purple-800/50 rounded-lg">
                            <User size={20} className="text-purple-700 dark:text-purple-300" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Today</p>
                            <p className="text-2xl font-black text-amber-900 dark:text-amber-100 mt-1">{stats.today}</p>
                        </div>
                        <div className="p-3 bg-amber-200 dark:bg-amber-800/50 rounded-lg">
                            <TrendingUp size={20} className="text-amber-700 dark:text-amber-300" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Send Form */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                                <Send size={20} />
                                <h2 className="font-bold">{t('notifications.sendNotification')}</h2>
                            </div>
                            <button
                                onClick={() => setShowTemplates(!showTemplates)}
                                className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                            >
                                <Sparkles size={12} />
                                Templates
                            </button>
                        </div>

                        {/* Templates */}
                        {showTemplates && (
                            <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2">
                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Quick Templates</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {TEMPLATES.map(template => (
                                        <button
                                            key={template.id}
                                            onClick={() => handleTemplateSelect(template)}
                                            className="text-left p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-500 transition-colors group"
                                        >
                                            <div className="text-lg mb-1">{template.icon}</div>
                                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-2">
                                                {template.title}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('notifications.titleLabel')}</label>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                                    placeholder="e.g. Update Available"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('notifications.messageLabel')}</label>
                                <textarea
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-sky-500 outline-none h-32 resize-none transition-all"
                                    placeholder="Type your message..."
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{body.length} characters</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Audience</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setTargetType('broadcast')}
                                        className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm border transition-all ${targetType === 'broadcast'
                                                ? 'bg-sky-50 dark:bg-sky-900/30 border-sky-500 text-sky-700 dark:text-sky-300 font-bold shadow-sm'
                                                : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        <Users size={16} /> {t('notifications.broadcast')}
                                    </button>
                                    <button
                                        onClick={() => setTargetType('serial')}
                                        className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm border transition-all ${targetType === 'serial'
                                                ? 'bg-sky-50 dark:bg-sky-900/30 border-sky-500 text-sky-700 dark:text-sky-300 font-bold shadow-sm'
                                                : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        <User size={16} /> {t('notifications.target')}
                                    </button>
                                </div>
                            </div>

                            {targetType === 'serial' && (
                                <div className="animate-in slide-in-from-top-2">
                                    <input
                                        value={targetSerial}
                                        onChange={(e) => setTargetSerial(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-sky-500 outline-none font-mono text-sm"
                                        placeholder="SP-2024-XXXX-XXXX"
                                    />
                                </div>
                            )}

                            <button
                                onClick={handleSend}
                                disabled={!title || !body || (targetType === 'serial' && !targetSerial)}
                                className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-sky-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                            >
                                <Send size={18} />
                                {t('notifications.sendNotification')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* History */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Toolbar */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                            {/* Filters */}
                            <div className="flex gap-2">
                                <button onClick={() => setFilterType('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filterType === 'all' ? 'bg-primary-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                                    All <span className="ml-1 opacity-75">({notifications.length})</span>
                                </button>
                                <button onClick={() => setFilterType('broadcast')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filterType === 'broadcast' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                                    Broadcast <span className="ml-1 opacity-75">({stats.broadcast})</span>
                                </button>
                                <button onClick={() => setFilterType('direct')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filterType === 'direct' ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                                    Direct <span className="ml-1 opacity-75">({stats.direct})</span>
                                </button>
                            </div>

                            {/* Search */}
                            <div className="relative w-full md:w-64">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search notifications..."
                                    className="w-full pl-10 pr-10 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500/50 outline-none transition-all text-sm"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Results */}
                        {(searchQuery || filterType !== 'all') && (
                            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Showing <span className="font-bold text-slate-700 dark:text-slate-300">{filteredNotifications.length}</span> of <span className="font-bold">{notifications.length}</span> notifications
                                </p>
                                {notifications.length > 0 && (
                                    <button
                                        onClick={handleClearHistory}
                                        className="text-xs flex items-center gap-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-3 py-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                                    >
                                        <Trash2 size={12} />
                                        Clear All
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* List */}
                    {filteredNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-full mb-4">
                                <History size={32} className="text-slate-400 dark:text-slate-500" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                {searchQuery || filterType !== 'all' ? 'No Notifications Found' : 'No Notification History'}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 text-center max-w-sm">
                                {searchQuery || filterType !== 'all' ? 'Try adjusting your filters or search query.' : 'Send your first notification to get started.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredNotifications.map((notif) => (
                                <div key={notif.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-500 transition-all group">
                                    <div className="flex gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${notif.targetSerial
                                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                                                : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                            }`}>
                                            {notif.targetSerial ? <User size={20} /> : <Users size={20} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-3 mb-2">
                                                <h3 className="font-bold text-slate-900 dark:text-white">{notif.title}</h3>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                                                        {new Date(notif.sentAt).toLocaleString()}
                                                    </span>
                                                    <button
                                                        onClick={() => handleDeleteOne(notif.id)}
                                                        className="text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-300 text-sm mb-2">{notif.body}</p>
                                            <div className="flex items-center gap-2">
                                                {notif.targetSerial && (
                                                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-300">
                                                        <User size={10} />
                                                        {notif.targetSerial}
                                                    </div>
                                                )}
                                                <div className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs">
                                                    <CheckCircle2 size={12} />
                                                    Sent
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={isClearHistoryModalOpen}
                onClose={() => setIsClearHistoryModalOpen(false)}
                onConfirm={confirmClearHistory}
                title={t('notifications.clearHistory')}
                message="Are you sure you want to clear the entire notification history? This action cannot be undone."
                confirmText={t('notifications.clearHistory')}
                type="danger"
            />
        </div>
    );
};

export default Notifications;
