
import React, { useEffect, useState } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import { useTranslation } from '../hooks/useTranslation';
import { Bell, Send, Users, User, CheckCircle2, Trash2, History } from 'lucide-react';
import { api } from '../services/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

const Notifications: React.FC = () => {
    const { t } = useTranslation();
    const [notifications, setNotifications] = useState<any[]>([]);
    const { tick: autoRefreshTick, requestRefresh } = useAutoRefresh();
    useEffect(() => {
        api.getNotifications().then(setNotifications).catch(console.error);
    }, [autoRefreshTick]);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [targetType, setTargetType] = useState<'broadcast' | 'serial'>('broadcast');
    const [targetSerial, setTargetSerial] = useState('');
    const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);

    const handleSend = () => {
        if (!title || !body) return;
        const target = targetType === 'serial' ? targetSerial : undefined;

        const payload = targetType === 'serial' ? { title, body, targetSerial } : { title, body };
        api.sendNotification(payload).then(async () => {
            setNotifications(await api.getNotifications());
            requestRefresh();
        });

        // Reset
        setTitle('');
        setBody('');
        setTargetSerial('');
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <Bell className="text-sky-600" />
                    {t('notifications.title')}
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Send Form */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 h-fit">
                    <div className="flex items-center gap-2 mb-6 text-sky-600 dark:text-sky-400">
                        <Send size={20} />
                        <h2 className="font-bold">{t('notifications.sendNotification')}</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('notifications.titleLabel')}</label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                                placeholder="e.g. Update Available"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('notifications.messageLabel')}</label>
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-sky-500 outline-none h-24 resize-none"
                                placeholder="Type your message..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Audience</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setTargetType('broadcast')}
                                    className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm border transition-all ${targetType === 'broadcast' ? 'bg-sky-50 dark:bg-sky-900/30 border-sky-500 text-sky-700 dark:text-sky-300 font-bold' : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                                >
                                    <Users size={16} /> {t('notifications.broadcast')}
                                </button>
                                <button
                                    onClick={() => setTargetType('serial')}
                                    className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm border transition-all ${targetType === 'serial' ? 'bg-sky-50 dark:bg-sky-900/30 border-sky-500 text-sky-700 dark:text-sky-300 font-bold' : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
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
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-sky-500 outline-none font-mono text-sm"
                                    placeholder="SP-2024-XXXX-XXXX"
                                />
                            </div>
                        )}

                        <button
                            onClick={handleSend}
                            disabled={!title || !body || (targetType === 'serial' && !targetSerial)}
                            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                            {t('notifications.sendNotification')}
                        </button>
                    </div>
                </div>

                {/* History */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Notification History</h2>
                        {notifications.length > 0 && (
                            <button
                                onClick={handleClearHistory}
                                className="text-xs flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-3 py-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                            >
                                <Trash2 size={14} />
                                {t('notifications.clearHistory')}
                            </button>
                        )}
                    </div>

                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
                            <History size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
                            <p className="text-slate-500 dark:text-slate-400 font-medium">No notification history found.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {notifications.map((notif) => (
                                <div key={notif.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 flex gap-4 group">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notif.targetSerial ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
                                        {notif.targetSerial ? <User size={20} /> : <Users size={20} />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-gray-900 dark:text-white">{notif.title}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-400">{new Date(notif.sentAt).toLocaleString()}</span>
                                                <button
                                                    onClick={() => handleDeleteOne(notif.id)}
                                                    className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{notif.body}</p>
                                        {notif.targetSerial && (
                                            <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded text-xs font-mono text-gray-600 dark:text-gray-300">
                                                Target: {notif.targetSerial}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center text-emerald-600 dark:text-emerald-400" title="Sent Successfully">
                                        <CheckCircle2 size={18} />

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
                message="Are you sure you want to clear the entire notification history?"
                confirmText={t('notifications.clearHistory')}
                type="danger"
            />
        </div >
    );
};

export default Notifications;
