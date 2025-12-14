import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import {
    MessageSquare,
    Send,
    Search,
    Archive,
    ArchiveRestore,
    Trash2,
    Loader2,
    Clock,
    CheckCheck,
    User,
    X,
    Plus,
    Mail
} from 'lucide-react';

interface Message {
    id: string;
    message: string;
    createdAt: string;
    isRead: boolean;
    sender: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
}

interface Conversation {
    id: string;
    subject?: string;
    status: string;
    lastMessageAt: string;
    unreadCount: number;
    createdAt: string;
    clinic: {
        id: string;
        name: string;
        email: string;
        doctorName?: string;
    };
    messages: Message[];
}

const ClinicMessages: React.FC = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState('');
    const [search, setSearch] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 10000); // Refresh every 10 seconds
        return () => clearInterval(interval);
    }, [showArchived]);

    useEffect(() => {
        if (selectedConversation) {
            scrollToBottom();
        }
    }, [selectedConversation?.messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchConversations = async () => {
        try {
            const data = await api.getConversations();
            setConversations(data);
            if (!loading) setLoading(false);
        } catch (error) {
            console.error('Failed to fetch conversations', error);
        } finally {
            setLoading(false);
        }
    };

    const loadConversation = async (conv: Conversation) => {
        try {
            const fullConv = await api.getConversation(conv.id);
            setSelectedConversation(fullConv);
            // Update the conversation in the list
            setConversations(prev =>
                prev.map(c => c.id === fullConv.id ? { ...c, unreadCount: 0 } : c)
            );
        } catch (error) {
            console.error('Failed to load conversation', error);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !selectedConversation || sending) return;

        try {
            setSending(true);
            const newMessage = await api.sendMessage(selectedConversation.id, message.trim());

            setSelectedConversation(prev => prev ? {
                ...prev,
                messages: [...prev.messages, newMessage]
            } : null);

            setMessage('');
            scrollToBottom();
            await fetchConversations();
        } catch (error) {
            console.error('Failed to send message', error);
            alert('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleArchive = async (id: string) => {
        try {
            await api.archiveConversation(id);
            await fetchConversations();
            if (selectedConversation?.id === id) {
                setSelectedConversation(null);
            }
        } catch (error) {
            console.error('Failed to archive conversation', error);
        }
    };

    const handleUnarchive = async (id: string) => {
        try {
            await api.unarchiveConversation(id);
            await fetchConversations();
        } catch (error) {
            console.error('Failed to unarchive conversation', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this conversation? This cannot be undone.')) return;

        try {
            await api.deleteConversation(id);
            await fetchConversations();
            if (selectedConversation?.id === id) {
                setSelectedConversation(null);
            }
        } catch (error) {
            console.error('Failed to delete conversation', error);
        }
    };

    const filteredConversations = conversations
        .filter(c => showArchived ? c.status === 'archived' : c.status === 'active')
        .filter(c =>
            c.clinic.name.toLowerCase().includes(search.toLowerCase()) ||
            c.clinic.email.toLowerCase().includes(search.toLowerCase()) ||
            c.clinic.doctorName?.toLowerCase().includes(search.toLowerCase())
        );

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffDays > 0) return `${diffDays}d ago`;
        if (diffHours > 0) return `${diffHours}h ago`;
        if (diffMins > 0) return `${diffMins}m ago`;
        return 'Just now';
    };

    const formatMessageTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="h-[calc(100vh-12rem)] flex flex-col md:flex-row gap-4">
            {/* Conversations List */}
            <div className="w-full md:w-96 flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <MessageSquare size={20} className="text-emerald-500" />
                            Messages
                        </h2>
                        <button
                            onClick={() => setShowArchived(!showArchived)}
                            className={`p-2 rounded-lg transition-colors ${showArchived
                                ? 'bg-emerald-500 text-white'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500'
                                }`}
                            title={showArchived ? 'Show Active' : 'Show Archived'}
                        >
                            {showArchived ? <ArchiveRestore size={18} /> : <Archive size={18} />}
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                </div>

                {/* Conversations */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="animate-spin text-emerald-500" size={32} />
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                            <MessageSquare size={48} className="text-slate-300 dark:text-slate-600 mb-3" />
                            <p className="text-slate-500 dark:text-slate-400 font-medium">
                                {showArchived ? 'No archived conversations' : 'No active conversations'}
                            </p>
                        </div>
                    ) : (
                        filteredConversations.map(conv => (
                            <div
                                key={conv.id}
                                onClick={() => loadConversation(conv)}
                                className={`p-4 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 ${selectedConversation?.id === conv.id
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-l-emerald-500'
                                    : ''
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">
                                            {conv.clinic.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-bold text-slate-900 dark:text-white truncate">
                                                {conv.clinic.name}
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                {conv.clinic.doctorName || conv.clinic.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-xs text-slate-400">{formatTime(conv.lastMessageAt)}</span>
                                        {conv.unreadCount > 0 && (
                                            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-xs font-bold">
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {conv.messages[0] && (
                                    <p className="text-sm text-slate-600 dark:text-slate-300 truncate">
                                        {conv.messages[0].sender.role === 'admin' && 'You: '}
                                        {conv.messages[0].message}
                                    </p>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                                    {selectedConversation.clinic.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">
                                        {selectedConversation.clinic.name}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {selectedConversation.clinic.doctorName || selectedConversation.clinic.email}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {selectedConversation.status === 'active' ? (
                                    <button
                                        onClick={() => handleArchive(selectedConversation.id)}
                                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-amber-500 transition-colors"
                                        title="Archive"
                                    >
                                        <Archive size={18} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleUnarchive(selectedConversation.id)}
                                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-emerald-500 transition-colors"
                                        title="Unarchive"
                                    >
                                        <ArchiveRestore size={18} />
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(selectedConversation.id)}
                                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-rose-500 transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <button
                                    onClick={() => setSelectedConversation(null)}
                                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors md:hidden"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
                            {selectedConversation.messages.map((msg) => {
                                const isAdmin = msg.sender.role === 'admin';
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[70%] ${isAdmin ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                            {!isAdmin && (
                                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 px-1">
                                                    {msg.sender.name}
                                                </span>
                                            )}
                                            <div
                                                className={`px-4 py-2 rounded-2xl ${isAdmin
                                                    ? 'bg-emerald-500 text-white rounded-br-none'
                                                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-bl-none'
                                                    }`}
                                            >
                                                <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                                            </div>
                                            <div className="flex items-center gap-1 px-1">
                                                <span className="text-xs text-slate-400">
                                                    {formatMessageTime(msg.createdAt)}
                                                </span>
                                                {isAdmin && msg.isRead && (
                                                    <CheckCheck size={14} className="text-emerald-500" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex items-end gap-3">
                                <textarea
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage(e as any);
                                        }
                                    }}
                                    placeholder="Type your message..."
                                    className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                                    rows={2}
                                    disabled={sending}
                                />
                                <button
                                    type="submit"
                                    disabled={!message.trim() || sending}
                                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 h-[56px]"
                                >
                                    {sending ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            <span className="hidden sm:inline">Send</span>
                                        </>
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                                Press Enter to send, Shift+Enter for new line
                            </p>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <MessageSquare size={64} className="text-slate-300 dark:text-slate-600 mb-4 mx-auto" />
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                Select a conversation
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400">
                                Choose a conversation from the list to start messaging
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClinicMessages;
