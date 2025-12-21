import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useTranslation } from '../hooks/useTranslation';
import {
    MessageSquare,
    Search,
    Filter,
    Inbox,
    Mail,
    MailOpen,
    Archive,
    Trash2,
    X,
    Calendar,
    Building2,
    CreditCard,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    RefreshCw
} from 'lucide-react';

interface SupportMessage {
    id: string;
    clinicId: string;
    clinicName: string;
    accountCode?: string;
    message: string;
    source: string;
    status: 'NEW' | 'READ' | 'CLOSED';
    readAt?: string;
    closedAt?: string;
    createdAt: string;
    updatedAt: string;
}

type FilterType = 'ALL' | 'NEW' | 'READ' | 'CLOSED';

const SupportMessages: React.FC = () => {
    const { t } = useTranslation();
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('ALL');
    const [search, setSearch] = useState('');
    const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadMessages();
    }, [filter]);

    const loadMessages = async () => {
        try {
            setLoading(true);
            const params: any = {};

            if (filter !== 'ALL') {
                params.status = filter;
            }

            if (search) {
                params.search = search;
            }

            const data = await api.getSupportMessages(params);
            setMessages(data.messages);
            setUnreadCount(data.unreadCount);
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadMessages();
        setTimeout(() => setRefreshing(false), 500);
    };

    const handleSearch = () => {
        loadMessages();
    };

    const handleViewMessage = async (message: SupportMessage) => {
        try {
            const fullMessage = await api.getSupportMessage(message.id);
            setSelectedMessage(fullMessage);
            // Reload messages to update status
            await loadMessages();
        } catch (error) {
            console.error('Failed to load message:', error);
        }
    };

    const handleUpdateStatus = async (id: string, status: 'NEW' | 'READ' | 'CLOSED') => {
        try {
            await api.updateSupportMessageStatus(id, status);
            setSelectedMessage(null);
            await loadMessages();
        } catch (error) {
            console.error('Failed to update status:', error);
            alert(t('supportMessages.error'));
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.deleteSupportMessage(id);
            setShowDeleteConfirm(false);
            setMessageToDelete(null);
            setSelectedMessage(null);
            await loadMessages();
        } catch (error) {
            console.error('Failed to delete message:', error);
            alert(t('supportMessages.error'));
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'NEW':
                return {
                    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
                    text: 'text-emerald-700 dark:text-emerald-300',
                    icon: Mail
                };
            case 'READ':
                return {
                    bg: 'bg-blue-100 dark:bg-blue-900/30',
                    text: 'text-blue-700 dark:text-blue-300',
                    icon: MailOpen
                };
            case 'CLOSED':
                return {
                    bg: 'bg-slate-100 dark:bg-slate-700',
                    text: 'text-slate-700 dark:text-slate-300',
                    icon: Archive
                };
            default:
                return {
                    bg: 'bg-slate-100 dark:bg-slate-700',
                    text: 'text-slate-700 dark:text-slate-300',
                    icon: Inbox
                };
        }
    };

    const filteredMessages = messages.filter(msg => {
        if (filter !== 'ALL' && msg.status !== filter) return false;
        if (search) {
            const searchLower = search.toLowerCase();
            return (
                msg.clinicName.toLowerCase().includes(searchLower) ||
                msg.accountCode?.toLowerCase().includes(searchLower) ||
                msg.message.toLowerCase().includes(searchLower)
            );
        }
        return true;
    });

    const stats = {
        total: messages.length,
        new: messages.filter(m => m.status === 'NEW').length,
        read: messages.filter(m => m.status === 'READ').length,
        closed: messages.filter(m => m.status === 'CLOSED').length
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
                            <MessageSquare size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                                {t('supportMessages.title')}
                            </h1>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                {t('supportMessages.subtitle')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
                                <Inbox size={20} className="text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{t('supportMessages.allMessages')}</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-emerald-300 dark:border-emerald-700 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                                <Mail size={20} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">{t('supportMessages.newMessages')}</p>
                                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.new}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30">
                                <MailOpen size={20} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{t('supportMessages.statusRead')}</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.read}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
                                <Archive size={20} className="text-slate-600 dark:text-slate-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{t('supportMessages.statusClosed')}</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.closed}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 mb-6 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Filter Buttons */}
                        <div className="flex gap-2 flex-wrap">
                            {(['ALL', 'NEW', 'READ', 'CLOSED'] as FilterType[]).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${filter === f
                                            ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                        }`}
                                >
                                    {t(`supportMessages.filter${f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}`)}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="flex-1 flex gap-2">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder={t('supportMessages.searchPlaceholder')}
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold hover:from-purple-600 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all"
                            >
                                {t('common.search')}
                            </button>
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                <RefreshCw size={20} className={`text-slate-700 dark:text-slate-300 ${refreshing ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Messages List */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
                            <p className="text-slate-600 dark:text-slate-400">{t('common.loading')}</p>
                        </div>
                    ) : filteredMessages.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-700 w-fit mx-auto mb-4">
                                <Inbox size={40} className="text-slate-400" />
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 font-medium">
                                {filter === 'NEW' ? t('supportMessages.noNewMessages') : t('supportMessages.noMessages')}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredMessages.map((message) => {
                                const badge = getStatusBadge(message.status);
                                const StatusIcon = badge.icon;

                                return (
                                    <div
                                        key={message.id}
                                        className="p-5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
                                        onClick={() => handleViewMessage(message)}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-xl ${badge.bg} flex-shrink-0`}>
                                                <StatusIcon size={20} className={badge.text} />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4 mb-2">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                                            {message.clinicName}
                                                        </h3>
                                                        {message.accountCode && (
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <CreditCard size={14} className="text-slate-400" />
                                                                <span className="text-sm font-mono text-slate-600 dark:text-slate-400">
                                                                    {message.accountCode}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-3 flex-shrink-0">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
                                                            {t(`supportMessages.status${message.status.charAt(0) + message.status.slice(1).toLowerCase()}`)}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                            <Clock size={14} />
                                                            <span>{new Date(message.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                                    {message.message}
                                                </p>

                                                <button className="mt-3 text-sm font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1.5 transition-colors">
                                                    <Eye size={16} />
                                                    {t('supportMessages.view')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Message Detail Modal */}
            {selectedMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-700/50 animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                                        <MessageSquare size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold mb-1">{t('supportMessages.messageDetails')}</h2>
                                        <p className="text-purple-100 text-sm">{selectedMessage.clinicName}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedMessage(null)}
                                    className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                            {/* Clinic Info */}
                            <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700">
                                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                    <Building2 size={16} />
                                    {t('supportMessages.clinicInfo')}
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t('supportMessages.clinicName')}</label>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{selectedMessage.clinicName}</p>
                                    </div>
                                    {selectedMessage.accountCode && (
                                        <div>
                                            <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t('supportMessages.accountCode')}</label>
                                            <p className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-1">{selectedMessage.accountCode}</p>
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t('supportMessages.source')}</label>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{selectedMessage.source}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t('supportMessages.status')}</label>
                                        <div className="mt-1">
                                            {(() => {
                                                const badge = getStatusBadge(selectedMessage.status);
                                                return (
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
                                                        <badge.icon size={14} />
                                                        {t(`supportMessages.status${selectedMessage.status.charAt(0) + selectedMessage.status.slice(1).toLowerCase()}`)}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>

                                {/* Timestamps */}
                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid md:grid-cols-3 gap-4 text-xs">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-slate-400" />
                                        <div>
                                            <span className="text-slate-500 dark:text-slate-400">{t('supportMessages.received')}:</span>
                                            <span className="ml-1 font-medium text-slate-900 dark:text-white">
                                                {new Date(selectedMessage.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    {selectedMessage.readAt && (
                                        <div className="flex items-center gap-2">
                                            <MailOpen size={14} className="text-blue-500" />
                                            <div>
                                                <span className="text-slate-500 dark:text-slate-400">{t('supportMessages.read')}:</span>
                                                <span className="ml-1 font-medium text-slate-900 dark:text-white">
                                                    {new Date(selectedMessage.readAt).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    {selectedMessage.closedAt && (
                                        <div className="flex items-center gap-2">
                                            <Archive size={14} className="text-slate-500" />
                                            <div>
                                                <span className="text-slate-500 dark:text-slate-400">{t('supportMessages.closed')}:</span>
                                                <span className="ml-1 font-medium text-slate-900 dark:text-white">
                                                    {new Date(selectedMessage.closedAt).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Full Message */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                    <MessageSquare size={16} />
                                    {t('supportMessages.fullMessage')}
                                </h3>
                                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                    <p className="text-sm text-slate-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                                        {selectedMessage.message}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between gap-3 rounded-b-3xl">
                            <button
                                onClick={() => {
                                    setMessageToDelete(selectedMessage.id);
                                    setShowDeleteConfirm(true);
                                }}
                                className="px-4 py-2.5 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900/50 font-semibold flex items-center gap-2 transition-all"
                            >
                                <Trash2 size={18} />
                                {t('supportMessages.delete')}
                            </button>

                            <div className="flex gap-3">
                                {selectedMessage.status === 'NEW' && (
                                    <button
                                        onClick={() => handleUpdateStatus(selectedMessage.id, 'READ')}
                                        className="px-5 py-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 font-semibold flex items-center gap-2 transition-all"
                                    >
                                        <MailOpen size={18} />
                                        {t('supportMessages.markAsRead')}
                                    </button>
                                )}
                                {selectedMessage.status !== 'CLOSED' && (
                                    <button
                                        onClick={() => handleUpdateStatus(selectedMessage.id, 'CLOSED')}
                                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold hover:from-purple-600 hover:to-pink-700 shadow-lg hover:shadow-xl flex items-center gap-2 transition-all"
                                    >
                                        <Archive size={18} />
                                        {t('supportMessages.markAsClosed')}
                                    </button>
                                )}
                                <button
                                    onClick={() => setSelectedMessage(null)}
                                    className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 font-semibold transition-all"
                                >
                                    {t('supportMessages.close')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && messageToDelete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border-2 border-rose-500 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col gap-4">
                            <div className="p-3 rounded-full w-fit bg-rose-100 dark:bg-rose-900/30 text-rose-600">
                                <AlertCircle size={28} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {t('common.confirm')}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                                    {t('supportMessages.deleteConfirm')}
                                </p>
                            </div>
                            <div className="flex gap-3 justify-end mt-2">
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setMessageToDelete(null);
                                    }}
                                    className="px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300 font-medium"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={() => handleDelete(messageToDelete)}
                                    className="px-5 py-2 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors shadow-lg"
                                >
                                    {t('supportMessages.delete')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupportMessages;
