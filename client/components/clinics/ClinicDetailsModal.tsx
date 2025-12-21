import React from 'react';
import { X, Mail, Phone, MapPin, Calendar, Crown } from 'lucide-react';
import { Clinic, ClinicSubscriptionStatus } from '../../types';

interface ClinicDetailsModalProps {
    clinic: Clinic;
    subscription?: ClinicSubscriptionStatus;
    onClose: () => void;
}

const ClinicDetailsModal: React.FC<ClinicDetailsModalProps> = ({ clinic, subscription, onClose }) => {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-slideUp"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-t-2xl z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                {clinic.name ? clinic.name.charAt(0).toUpperCase() : 'C'}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">{clinic.name || 'Unknown Clinic'}</h2>
                                <p className="text-white/80">Clinic Details</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Basic Info */}
                    <Section title="Basic Information">
                        <InfoRow label="Clinic Name" value={clinic.name || 'N/A'} />
                        <InfoRow label="Email" value={clinic.email || 'N/A'} icon={Mail} />
                        <InfoRow label="Phone" value={clinic.phone || 'N/A'} icon={Phone} />
                        <InfoRow label="Address" value={clinic.address || 'N/A'} icon={MapPin} />
                        <InfoRow label="Status" value={clinic.status} badge />
                        <InfoRow label="Registered" value={new Date(clinic.createdAt).toLocaleString()} icon={Calendar} />
                    </Section>

                    {/* Subscription Info */}
                    {subscription && (
                        <Section title="Subscription Details">
                            <InfoRow label="Plan" value={subscription.planName} icon={Crown} />
                            <InfoRow label="Status" value={subscription.isActive ? 'Active' : 'Inactive'} badge />
                            {subscription.expiresAt && (
                                <InfoRow label="Expires" value={new Date(subscription.expiresAt).toLocaleString()} />
                            )}
                        </Section>
                    )}

                    {/* IDs Section */}
                    <Section title="System IDs">
                        <InfoRow label="Clinic ID" value={clinic.id} mono />
                        {clinic.licenseSerial && (
                            <InfoRow label="License Serial" value={clinic.licenseSerial} mono />
                        )}
                    </Section>
                </div>
            </div>
        </div>
    );
};

// Helper Components
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">
            {title}
        </h3>
        <div className="space-y-2">
            {children}
        </div>
    </div>
);

const InfoRow: React.FC<{
    label: string;
    value: string;
    icon?: React.ElementType;
    badge?: boolean;
    mono?: boolean;
}> = ({ label, value, icon: Icon, badge, mono }) => (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
            {Icon && <Icon size={16} />}
            {label}
        </span>
        {badge ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                {value}
            </span>
        ) : (
            <span className={`text-sm text-slate-900 dark:text-white ${mono ? 'font-mono text-xs' : ''}`}>
                {value}
            </span>
        )}
    </div>
);

export default ClinicDetailsModal;
