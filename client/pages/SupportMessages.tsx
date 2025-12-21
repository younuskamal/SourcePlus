import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useTranslation } from '../hooks/useTranslation';
import {
    X,
    Send,
    MessageSquare,
    AlertCircle,
    Clock,
    CheckCircle2,
    Loader2,
    User,
    Shield,
    AlertTriangle,
    ArrowLeft,
    Search,
    Filter,
    Users,
    Trash,
    RefreshCw
} from 'lucide-react';

interface SupportMessage {
    id: string;
    clinicId: string;
    clinicName: string;
    accountCode?: string;
    subject: string;
    message: string;
    source: string;
    status: 'NEW' | 'READ' | 'CLOSED';
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    assignedTo?: string;
    assignedUser?: { id: string; name: string; email: string };
    readAt?: string;
    closedAt?: string;
    createdAt: string;
    updatedAt: string;
    replies?: SupportReply[];
    _count?: { replies: number };
}

interface SupportReply {
    id: string;
    messageId: string;
    senderId?: string;
    senderName: string;
    content: string;
    isFromAdmin: boolean;
    createdAt: string;
}

const SupportMessages: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'NEW' | 'READ' | 'CLOSED'>('ALL');
    const [filterPriority, setFilterPriority] = useState<'ALL' | 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('ALL');
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadMessages();
    }, [filterStatus, filterPriority, searchQuery]);

    useEffect(() => {
        if (selectedMessage) {
            scrollToBottom();
        }
    }, [selectedMessage?.replies]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadMessages = async () => {
        try {
            setLoading(true);
            setError(null); // Clear previous errors

            const params: any = {};
            if (filterStatus !== 'ALL') params.status = filterStatus;
            if (filterPriority !== 'ALL') params.priority = filterPriority;
            if (searchQuery) params.search = searchQuery;

            console.log('🔍 Loading support messages with params:', params);

            const response = await api.getSupportMessages(params);

            console.log('✅ Support messages response:', {
                count: response.messages?.length || 0,
                unreadCount: response.unreadCount,
                messages: response.messages
            });

            // Validate response structure
            if (!response || typeof response !== 'object') {
                throw new Error('❌ Invalid response format from server');
            }

            if (!Array.isArray(response.messages)) {
                console.error('⚠️ Messages is not an array:', response);
                throw new Error('❌ Messages data is corrupted');
            }

            setMessages(response.messages);

            // Log success
            if (response.messages.length > 0) {
                console.log(`✅ Successfully loaded ${response.messages.length} messages`);
            } else {
                console.log('ℹ️ No messages found (database might be empty)');
            }

        } catch (error: any) {
            console.error('❌ Failed to load support messages:', error);

            // Determine error message
            let errorMessage = 'Failed to load support messages';

            if (error.response) {
                // HTTP error
                errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
            } else if (error.message) {
                // JS error
                errorMessage = error.message;
            }

            setError(errorMessage);
            setMessages([]); // Clear messages on error

            console.error('📊 Error details:', {
                message: errorMessage,
                response: error.response,
                stack: error.stack
            });

        } finally {
            setLoading(false);
        }
    };

    const handleSelectMessage = async (message: SupportMessage) => {
        try {
            const fullMessage = await api.getSupportMessage(message.id);
            setSelectedMessage(fullMessage);
        } catch (error) {
            console.error('Failed to load message:', error);
            alert('Failed to load message details');
        }
    };

    const handleSendReply = async () => {
        if (!selectedMessage || !replyContent.trim()) {
            alert('Please enter a reply message');
            return;
        }

        try {
            setSending(true);
            console.log('📤 Sending reply to message:', selectedMessage.id);

            await api.addSupportReply(selectedMessage.id, replyContent);

            console.log('✅ Reply sent successfully');
            setReplyContent('');

            // Reload conversation
            const updated = await api.getSupportMessage(selectedMessage.id);
            setSelectedMessage(updated);

            // Reload messages list
            await loadMessages();

            console.log('✅ Messages list refreshed');
        } catch (error: any) {
            console.error('❌ Failed to send reply:', error);
            alert(`Failed to send reply: ${error.response?.data?.message || error.message}`);
        } finally {
            setSending(false);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
            return;
        }

        try {
            console.log('🗑️ Deleting message:', messageId);

            await api.deleteSupportMessage(messageId);

            console.log('✅ Message deleted successfully');

            // Close modal if this message is selected
            if (selectedMessage?.id === messageId) {
                setSelectedMessage(null);
            }

            // Reload messages list
            await loadMessages();

            alert('Message deleted successfully');
        } catch (error: any) {
            console.error('❌ Failed to delete message:', error);
            alert(`Failed to delete message: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleUpdateStatus = async (status: 'NEW' | 'READ' | 'CLOSED') => {
        if (!selectedMessage) return;

        try {
            console.log(`🔄 Updating status to ${status} for message:`, selectedMessage.id);

            await api.updateSupportMessageStatus(selectedMessage.id, status);

            console.log('✅ Status updated successfully');

            const updated = await api.getSupportMessage(selectedMessage.id);
            setSelectedMessage(updated);
            await loadMessages();
        } catch (error: any) {
            console.error('❌ Failed to update status:', error);
            alert(`Failed to update status: ${error.response?.data?.message || error.message}`);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'bg-rose-500 text-white';
            case 'HIGH': return 'bg-orange-500 text-white';
            case 'NORMAL': return 'bg-blue-500 text-white';
            case 'LOW': return 'bg-slate-400 text-white';
            default: return 'bg-slate-400 text-white';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'NEW': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
            case 'READ': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            case 'CLOSED': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                                    <MessageSquare size={32} />
                                </div>
                                {t('supportMessages.title')}
                            </h1>
                            <p className="text-slate-600 dark:text-slate-300 mt-2">
                                {t('supportMessages.subtitle')}
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="mt-6 flex flex-wrap gap-3">
                        {/* Search */}
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('supportMessages.searchPlaceholder')}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                        >
                            <option value="ALL">All Status</option>
                            <option value="NEW">New</option>
                            <option value="READ">Read</option>
                            <option value="CLOSED">Closed</option>
                        </select>

                        {/* Priority Filter */}
                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value as any)}
                            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                        >
                            <option value="ALL">All Priorities</option>
                            <option value="URGENT">Urgent</option>
                            <option value="HIGH">High</option>
                            <option value="NORMAL">Normal</option>
                            <option value="LOW">Low</option>
                        </select>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Messages List */}
                    <div className={`${selectedMessage ? 'hidden lg:block' : ''} lg:col-span-1 space-y-3`}>
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <Loader2 className="animate-spin text-purple-500" size={48} />
                            </div>
                        ) : error ? (
                            <div className="bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-200 dark:border-rose-800 rounded-2xl p-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0">
                                        <AlertCircle className="text-rose-600 dark:text-rose-400" size={32} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-rose-900 dark:text-rose-200 mb-2">
                                            ⚠️ Error Loading Messages
                                        </h3>
                                        <p className="text-rose-700 dark:text-rose-300 mb-4">
                                            {error}
                                        </p>
                                        <button
                                            onClick={loadMessages}
                                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                                        >
                                            <RefreshCw size={16} />
                                            Retry
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl">
                                <MessageSquare className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={64} />
                                <p className="text-slate-500 dark:text-slate-400">No messages found</p>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <button
                                    key={msg.id}
                                    onClick={() => handleSelectMessage(msg)}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedMessage?.id === msg.id
                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-300'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                                                {msg.subject}
                                            </h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-300 truncate">
                                                {msg.clinicName}
                                            </p>
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-bold rounded ${getPriorityColor(msg.priority)}`}>
                                            {msg.priority}
                                        </span>
                                    </div>

                                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                                        {msg.message}
                                    </p>

                                    <div className="flex items-center justify-between text-xs">
                                        <span className={`px-2 py-1 rounded-full ${getStatusColor(msg.status)}`}>
                                            {msg.status}
                                        </span>
                                        <div className="flex items-center gap-2 text-slate-500">
                                            {msg._count && msg._count.replies > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <MessageSquare size={14} />
                                                    {msg._count.replies}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Clock size={14} />
                                                {new Date(msg.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Conversation View */}
                    <div className={`${selectedMessage ? '' : 'hidden lg:block'} lg:col-span-2`}>
                        {selectedMessage ? (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col h-[calc(100vh-16rem)]">
                                {/* Conversation Header */}
                                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <button
                                                onClick={() => setSelectedMessage(null)}
                                                className="lg:hidden mb-3 text-purple-600 hover:text-purple-700 flex items-center gap-2"
                                            >
                                                <ArrowLeft size={20} />
                                                Back
                                            </button>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                                    {selectedMessage.subject}
                                                </h2>
                                                <span className={`px-3 py-1 text-xs font-bold rounded ${getPriorityColor(selectedMessage.priority)}`}>
                                                    {selectedMessage.priority}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                                                <span className="flex items-center gap-1">
                                                    <User size={16} />
                                                    {selectedMessage.clinicName}
                                                </span>
                                                {selectedMessage.accountCode && (
                                                    <span>#{selectedMessage.accountCode}</span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Clock size={16} />
                                                    {new Date(selectedMessage.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Status Actions */}
                                        <div className="flex gap-2">
                                            {selectedMessage.status !== 'CLOSED' && (
                                                <button
                                                    onClick={() => handleUpdateStatus('CLOSED')}
                                                    className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-all"
                                                >
                                                    Close
                                                </button>
                                            )}
                                            {selectedMessage.status === 'CLOSED' && (
                                                <button
                                                    onClick={() => handleUpdateStatus('READ')}
                                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-all"
                                                >
                                                    Reopen
                                                </button>
                                            )}
                                            {/* Delete Button */}
                                            <button
                                                onClick={() => handleDeleteMessage(selectedMessage.id)}
                                                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-1"
                                                title="Delete Message"
                                            >
                                                <Trash size={16} />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                    {/* Initial Message */}
                                    <div className="flex gap-3">
                                        <div className="flex-shrink-0">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                                                {selectedMessage.clinicName.charAt(0)}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl rounded-tl-sm p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="font-semibold text-slate-900 dark:text-white">
                                                        {selectedMessage.clinicName}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        {new Date(selectedMessage.createdAt).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                                                    {selectedMessage.message}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Replies */}
                                    {selectedMessage.replies?.map((reply) => (
                                        <div key={reply.id} className={`flex gap-3 ${reply.isFromAdmin ? 'flex-row-reverse' : ''}`}>
                                            <div className="flex-shrink-0">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${reply.isFromAdmin
                                                    ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                                                    : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                                                    }`}>
                                                    {reply.isFromAdmin ? <Shield size={20} /> : reply.senderName.charAt(0)}
                                                </div>
                                            </div>
                                            <div className="flex-1 max-w-[70%]">
                                                <div className={`rounded-2xl p-4 ${reply.isFromAdmin
                                                    ? 'bg-purple-50 dark:bg-purple-900/20 rounded-tr-sm'
                                                    : 'bg-blue-50 dark:bg-blue-900/20 rounded-tl-sm'
                                                    }`}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="font-semibold text-slate-900 dark:text-white">
                                                            {reply.senderName}
                                                        </span>
                                                        {reply.isFromAdmin && (
                                                            <span className="text-xs px-2 py-0.5 rounded bg-purple-500 text-white">
                                                                Support
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-slate-500">
                                                            {new Date(reply.createdAt).toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                                                        {reply.content}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Reply Input */}
                                {selectedMessage.status !== 'CLOSED' && (
                                    <div className="p-6 border-t border-slate-200 dark:border-slate-700">
                                        <div className="flex gap-3">
                                            <textarea
                                                value={replyContent}
                                                onChange={(e) => setReplyContent(e.target.value)}
                                                placeholder="Type your reply..."
                                                className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white resize-none"
                                                rows={3}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSendReply();
                                                    }
                                                }}
                                            />
                                            <button
                                                onClick={handleSendReply}
                                                disabled={sending || !replyContent.trim()}
                                                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                {sending ? (
                                                    <Loader2 className="animate-spin" size={20} />
                                                ) : (
                                                    <Send size={20} />
                                                )}
                                                Send
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="hidden lg:flex items-center justify-center h-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <div className="text-center">
                                    <MessageSquare className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={64} />
                                    <p className="text-slate-500 dark:text-slate-400 text-lg">
                                        Select a message to view conversation
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupportMessages;
