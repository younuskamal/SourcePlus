
import React, { useEffect, useState } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import { useTranslation } from '../hooks/useTranslation';
import { SupportRequest } from '../types';
import { MessageSquare, CheckCircle, Monitor, HardDrive, Phone, Clock, Search, Send, User, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

const Support: React.FC = () => {
  const { t } = useTranslation();
  const { tick: autoRefreshTick, requestRefresh } = useAutoRefresh();
  const [tickets, setTickets] = useState<SupportRequest[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportRequest | null>(null);
  const [replyText, setReplyText] = useState('');
  const [deleteTicketId, setDeleteTicketId] = useState<string | null>(null);

  useEffect(() => {
    api.getTickets().then(setTickets).catch(console.error);
  }, [autoRefreshTick]);

  const handleResolve = (id: string) => {
    api.resolveTicket(id).then(async () => {
      const data = await api.getTickets();
      setTickets(data);
      requestRefresh();
      if (selectedTicket?.id === id) setSelectedTicket(null);
    });
  };

  const handleReply = () => {
    if (selectedTicket && replyText) {
      api.replyTicket(selectedTicket.id, replyText).then(async () => {
        setTickets(await api.getTickets());
        requestRefresh();
        setReplyText('');
        setSelectedTicket(null);
      });
    }
  };

  const requestDelete = (id: string) => {
    setDeleteTicketId(id);
  };

  const confirmDelete = () => {
    if (!deleteTicketId) return;
    api.deleteTicket(deleteTicketId).then(async () => {
      const updated = await api.getTickets();
      setTickets(updated);
      requestRefresh();
      if (selectedTicket?.id === deleteTicketId) {
        setSelectedTicket(null);
      }
      setDeleteTicketId(null);
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300';
      case 'in_progress': return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300';
      case 'resolved': return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const ActionButton = ({
    children,
    onClick,
    variant = 'default'
  }: {
    children: React.ReactNode;
    onClick: (event: React.MouseEvent) => void;
    variant?: 'default' | 'danger';
  }) => {
    const colorClasses =
      variant === 'danger'
        ? 'text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/30 border border-rose-200/70 dark:border-rose-800/50'
        : 'text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 border border-slate-200/70 dark:border-slate-700/70';

    return (
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${colorClasses}`}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('support.title')}</h1>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              placeholder="Search serial, phone..."
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-slate-400">
            <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-700 dark:text-slate-200 font-semibold uppercase tracking-wider text-xs border-b dark:border-slate-700">
              <tr>
                <th className="px-6 py-4">{t('support.serial')}</th>
                <th className="px-6 py-4">{t('support.phone')}</th>
                <th className="px-6 py-4">{t('support.status')}</th>
                <th className="px-6 py-4">{t('support.issue')}</th>
                <th className="px-6 py-4 text-right">{t('support.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <MessageSquare className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                    {t('support.noTickets')}
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-sky-50/30 dark:hover:bg-sky-900/10 transition-colors cursor-pointer"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <td className="px-6 py-4 font-mono font-medium text-slate-900 dark:text-white">{ticket.serial}</td>
                    <td className="px-6 py-4 font-mono">{ticket.phoneNumber}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-slate-700 dark:text-slate-300">{ticket.description}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <ActionButton
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTicket(ticket);
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                          View
                        </ActionButton>
                        <ActionButton
                          variant="danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            requestDelete(ticket.id);
                          }}
                        >
                          <Trash2 size={12} /> {t('support.delete')}
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TICKET DETAIL MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedTicket(null)} />
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl z-10 overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 dark:border-slate-700 animate-in zoom-in-95">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-start bg-slate-50 dark:bg-slate-900">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white font-mono">{selectedTicket.serial}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1"><Clock size={12} /> {new Date(selectedTicket.createdAt).toLocaleString()}</span>
                  <span className="flex items-center gap-1"><Phone size={12} /> {selectedTicket.phoneNumber}</span>
                </div>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-gray-600"><User size={20} /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Device Info - PC Centric */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">{t('support.device')}</span>
                  <div className="flex items-center gap-2 mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                    <Monitor size={16} className="text-sky-500" /> {selectedTicket.deviceName}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">{t('support.system')}</span>
                  <div className="flex items-center gap-2 mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                    <HardDrive size={16} className="text-indigo-500" /> {selectedTicket.systemVersion}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">{t('support.version')}</span>
                  <div className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">v{selectedTicket.appVersion}</div>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">{t('support.hardwareId')}</span>
                  <div className="mt-1 text-xs font-mono text-slate-500 truncate" title={selectedTicket.hardwareId}>{selectedTicket.hardwareId}</div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">{t('support.issue')}</h3>
                <div className="bg-gray-50 dark:bg-slate-700/30 p-4 rounded-lg text-gray-700 dark:text-gray-300 text-sm leading-relaxed border border-gray-100 dark:border-slate-700">
                  {selectedTicket.description}
                </div>
              </div>

              {selectedTicket.adminReply && (
                <div className="bg-sky-50 dark:bg-sky-900/20 p-4 rounded-lg border border-sky-100 dark:border-sky-800 ml-8">
                  <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase mb-1 block">Admin Reply</span>
                  <p className="text-gray-800 dark:text-gray-200 text-sm">{selectedTicket.adminReply}</p>
                  <span className="text-xs text-sky-400 mt-2 block">{new Date(selectedTicket.replyAt!).toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
              {selectedTicket.status !== 'resolved' ? (
                <div className="flex gap-3">
                  <input
                    className="flex-1 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                    placeholder="Type a reply to the user..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <button
                    onClick={handleReply}
                    disabled={!replyText}
                    className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
                  >
                    <Send size={16} /> {t('support.reply')}
                  </button>
                  <button
                    onClick={() => handleResolve(selectedTicket.id)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium flex items-center gap-2"
                  >
                    <CheckCircle size={16} /> {t('support.resolve')}
                  </button>
                  <button
                    onClick={() => requestDelete(selectedTicket.id)}
                    className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm font-medium flex items-center gap-2"
                  >
                    <Trash2 size={16} /> {t('support.delete')}
                  </button>
                </div>
              ) : (
                <div className="text-center text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-center gap-2">
                  <CheckCircle size={16} /> Ticket Resolved
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTicketId}
        onClose={() => setDeleteTicketId(null)}
        onConfirm={confirmDelete}
        title={t('support.delete')}
        message={`Are you sure you want to delete ticket ${tickets.find((t) => t.id === deleteTicketId)?.serial ?? ''}? This cannot be undone.`}
        confirmText={t('common.delete')}
        type="danger"
      />
    </div>
  );
};

export default Support;
