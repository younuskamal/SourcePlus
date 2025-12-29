
import React from 'react';
import { Loader2, CheckCircle2, XCircle, Ban, PlayCircle, Trash2, ShieldAlert, Zap } from 'lucide-react';
import { Clinic } from '../../types';

type ActionType = 'approve' | 'reject' | 'suspend' | 'reactivate' | 'delete';

interface ConfirmActionModalProps {
    action: { type: ActionType; clinic: Clinic };
    rejectReason: string;
    setRejectReason: (reason: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
    processing: boolean;
}

const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
    action,
    rejectReason,
    setRejectReason,
    onConfirm,
    onCancel,
    processing
}) => {
    const actionConfig: Record<ActionType, { title: string; color: string; icon: any; description: string; glow: string }> = {
        approve: {
            title: 'Authorize Node',
            color: 'emerald',
            icon: CheckCircle2,
            description: 'This will grant full network access to the target clinic instance.',
            glow: 'shadow-emerald-500/20'
        },
        reject: {
            title: 'Deny Provisioning',
            color: 'rose',
            icon: XCircle,
            description: 'This will terminate the registration request and block future attempts.',
            glow: 'shadow-rose-500/20'
        },
        suspend: {
            title: 'Lock Access',
            color: 'amber',
            icon: Ban,
            description: 'This will temporarily disconnect the node from the central grid.',
            glow: 'shadow-amber-500/20'
        },
        reactivate: {
            title: 'Restore Bridge',
            color: 'emerald',
            icon: PlayCircle,
            description: 'This will restore full operational connectivity to the node.',
            glow: 'shadow-emerald-500/20'
        },
        delete: {
            title: 'Purge Instance',
            color: 'rose',
            icon: Trash2,
            description: 'This will permanently erase the node from the global cluster. INREVERSIBLE.',
            glow: 'shadow-rose-500/20'
        }
    };

    const config = actionConfig[action.type];
    const Icon = config.icon;

    const colors: Record<string, any> = {
        emerald: 'bg-emerald-600 dark:bg-emerald-500 text-white',
        rose: 'bg-rose-600 dark:bg-rose-500 text-white',
        amber: 'bg-amber-600 dark:bg-amber-500 text-white'
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-md w-full p-10 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                <div className="flex flex-col items-center text-center">
                    <div className={`p-6 rounded-[2rem] mb-6 shadow-2xl ${colors[config.color]} ${config.glow} animate-bounce-subtle`}>
                        <Icon size={40} />
                    </div>

                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">
                        {config.title}
                    </h3>

                    <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg mb-6">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate max-w-[200px]">
                            ID: {action.clinic.id}
                        </p>
                    </div>

                    <p className="text-slate-500 font-bold text-sm mb-8 leading-relaxed">
                        Are you sure you want to execute <span className="text-slate-900 dark:text-white uppercase font-black">{action.type}</span> routine for <span className="text-emerald-500 font-black">{action.clinic.name}</span>?
                        <br />
                        <span className="text-xs opacity-70 mt-2 block">{config.description}</span>
                    </p>

                    {action.type === 'reject' && (
                        <div className="w-full mb-8 text-left">
                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
                                REJECTION_MANIFEST_LOG <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Enter reason for access denial..."
                                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-rose-500/20 resize-none transition-all"
                                rows={3}
                                autoFocus
                            />
                        </div>
                    )}

                    <div className="flex gap-4 w-full">
                        <button
                            onClick={onCancel}
                            disabled={processing}
                            className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:text-slate-900 transition-all disabled:opacity-50"
                        >
                            Abort
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={processing || (action.type === 'reject' && !rejectReason.trim())}
                            className={`flex-1 px-6 py-4 rounded-2xl ${colors[config.color]} font-black uppercase tracking-widest text-[10px] shadow-xl ${config.glow} transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2`}
                        >
                            {processing ? (
                                <Loader2 className="animate-spin" size={16} />
                            ) : (
                                <Zap size={14} />
                            )}
                            {processing ? 'Processing...' : 'Confirm'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmActionModal;
