import React from 'react';
import { Loader2, CheckCircle2, XCircle, Ban, PlayCircle, Trash2 } from 'lucide-react';
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
    const actionConfig = {
        approve: { title: 'Approve Clinic', color: 'emerald', icon: CheckCircle2, description: 'This will allow the clinic to access the system.' },
        reject: { title: 'Reject Clinic', color: 'rose', icon: XCircle, description: 'This will prevent the clinic from accessing the system.' },
        suspend: { title: 'Suspend Clinic', color: 'amber', icon: Ban, description: 'This will temporarily disable the clinic\'s access.' },
        reactivate: { title: 'Reactivate Clinic', color: 'emerald', icon: PlayCircle, description: 'This will restore the clinic\'s access.' },
        delete: { title: 'Delete Clinic', color: 'rose', icon: Trash2, description: 'This action cannot be undone.' }
    };

    const config = actionConfig[action.type];
    const Icon = config.icon;

    const colorClasses = {
        emerald: {
            bg: 'bg-emerald-100 dark:bg-emerald-900/30',
            text: 'text-emerald-600 dark:text-emerald-400',
            button: 'bg-emerald-500 hover:bg-emerald-600'
        },
        rose: {
            bg: 'bg-rose-100 dark:bg-rose-900/30',
            text: 'text-rose-600 dark:text-rose-400',
            button: 'bg-rose-500 hover:bg-rose-600'
        },
        amber: {
            bg: 'bg-amber-100 dark:bg-amber-900/30',
            text: 'text-amber-600 dark:text-amber-400',
            button: 'bg-amber-500 hover:bg-amber-600'
        }
    };

    const colors = colorClasses[config.color];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slideUp">
                <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-xl ${colors.bg} ${colors.text}`}>
                        <Icon size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{config.title}</h3>
                </div>

                <p className="text-slate-600 dark:text-slate-300 mb-2">
                    Are you sure you want to {action.type} <strong>{action.clinic.name || 'this clinic'}</strong>?
                </p>

                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    {config.description}
                </p>

                {action.type === 'reject' && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Rejection Reason <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Please provide a reason for rejection..."
                            className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white resize-none"
                            rows={3}
                            autoFocus
                        />
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={processing}
                        className="flex-1 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-medium transition-all disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={processing || (action.type === 'reject' && !rejectReason.trim())}
                        className={`flex-1 px-4 py-2 rounded-lg ${colors.button} text-white font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm`}
                    >
                        {processing ? <Loader2 className="animate-spin" size={16} /> : <Icon size={16} />}
                        {processing ? 'Processing...' : config.title.split(' ')[0]}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmActionModal;
