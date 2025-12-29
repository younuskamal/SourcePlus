
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, CheckCircle2, Clock, ShieldAlert, Activity, Users, Smartphone, Calendar } from 'lucide-react';
import { api } from '../services/api';
import { Clinic, RegistrationStatus, LicenseStatus } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface Props {
  setPage: (page: string) => void;
}

const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) => (
  <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-4 shadow-sm">
    <div className={`p-3 rounded-md ${color} bg-opacity-10 dark:bg-opacity-20`}>
      <Icon size={24} className={color.replace('bg-', 'text-')} />
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  </div>
);

const ClinicDashboard: React.FC<Props> = ({ setPage }) => {
  const { t } = useTranslation();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getClinics();
      setClinics(data);
    } catch (e) {
      console.error('Failed to load clinics', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const statusCounts = useMemo(() => {
    const counts = {
      [RegistrationStatus.APPROVED]: 0,
      [RegistrationStatus.PENDING]: 0,
      [RegistrationStatus.SUSPENDED]: 0,
      [RegistrationStatus.REJECTED]: 0
    };
    clinics.forEach(c => {
      if (counts[c.status] !== undefined) counts[c.status]++;
    });
    return counts;
  }, [clinics]);

  const recentClinics = useMemo(() => {
    // Show active clinics first, or just recent ones?
    // User wants "defining resources", so let's show a robust list of clinics with their resources.
    return clinics.slice(0, 10); // Show top 10 for now
  }, [clinics]);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <p className="mt-2 text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Clinic Overview</h1>
        <button
          onClick={load}
          className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 text-sm font-medium"
        >
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Clinics"
          value={clinics.length}
          icon={Building2}
          color="text-blue-600"
        />
        <StatCard
          label="Active"
          value={statusCounts[RegistrationStatus.APPROVED]}
          icon={CheckCircle2}
          color="text-emerald-600"
        />
        <StatCard
          label="Pending"
          value={statusCounts[RegistrationStatus.PENDING]}
          icon={Clock}
          color="text-amber-500"
        />
        <StatCard
          label="Suspended"
          value={statusCounts[RegistrationStatus.SUSPENDED]}
          icon={ShieldAlert}
          color="text-rose-600"
        />
      </div>

      {/* Resource Overview Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Resource Allocation & Status</h2>
          <button onClick={() => setPage('clinics')} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-medium border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3">Clinic Name</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Plan / Resources</th>
                <th className="px-6 py-3">Device Usage</th>
                <th className="px-6 py-3">Doctor</th>
                <th className="px-6 py-3 text-right">Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {recentClinics.map((clinic) => {
                const planName = clinic.license?.plan?.name || 'No Plan';
                const deviceLimit = clinic.license?.deviceLimit || 0;
                const usedDevices = clinic.license?.activationCount || 0;
                const expiry = clinic.license?.expireDate;

                return (
                  <tr
                    key={clinic.id}
                    onClick={() => setPage(`manage-clinics/${clinic.id}`)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                      {clinic.name}
                      <div className="text-xs text-slate-500 font-normal">{clinic.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${clinic.status === RegistrationStatus.APPROVED ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}
                        ${clinic.status === RegistrationStatus.PENDING ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' : ''}
                        ${clinic.status === RegistrationStatus.SUSPENDED ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400' : ''}
                        ${clinic.status === RegistrationStatus.REJECTED ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400' : ''}
                      `}>
                        {clinic.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Activity size={16} className="text-slate-400" />
                        <span className="text-slate-700 dark:text-slate-300">{planName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Smartphone size={16} />
                        <span>{usedDevices} / {deviceLimit}</span>
                      </div>
                      {deviceLimit > 0 && (
                        <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.min((usedDevices / deviceLimit) * 100, 100)}%` }}
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {clinic.doctorName || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {expiry ? (
                        <div className={`text-xs font-bold ${new Date(expiry) < new Date() ? 'text-rose-500' : 'text-slate-600 dark:text-slate-400'}`}>
                          {new Date(expiry).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {recentClinics.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No clinics found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClinicDashboard;
