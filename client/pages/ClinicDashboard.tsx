import React, { useEffect, useState } from 'react';
import { Stethoscope, ShieldCheck, Ban, Clock, CheckCircle2, AlertTriangle, Bell, Mail, MapPin, Phone, LayoutDashboard } from 'lucide-react';
import { api } from '../services/api';
import { Clinic, RegistrationStatus } from '../types';

interface Props {
  setPage: (page: string) => void;
}

const StatCard = ({ label, value, icon: Icon, className }: { label: string; value: string | number; icon: any; className?: string }) => (
  <div className={`p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm flex items-center gap-3 ${className || ''}`}>
    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-primary-600 dark:text-primary-300">
      <Icon size={18} />
    </div>
    <div>
      <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">{label}</p>
      <p className="text-xl font-extrabold text-slate-900 dark:text-white">{value}</p>
    </div>
  </div>
);

const ClinicDashboard: React.FC<Props> = ({ setPage }) => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.getClinics();
        setClinics(data);
      } catch (e) {
        console.error('Failed to load clinics', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statusCounts = clinics.reduce<Record<RegistrationStatus, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {
    [RegistrationStatus.APPROVED]: 0,
    [RegistrationStatus.PENDING]: 0,
    [RegistrationStatus.SUSPENDED]: 0,
    [RegistrationStatus.REJECTED]: 0
  });

  const pending = clinics.filter(c => c.status === RegistrationStatus.PENDING).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const approved = clinics.filter(c => c.status === RegistrationStatus.APPROVED).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Stethoscope className="text-emerald-500" /> Clinic Control
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">لوحة خاصة بالعيادات فقط (حسابات الإدارة).</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage('clinics')}
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold shadow-sm"
          >
            طلبات التسجيل
          </button>
          <button
            onClick={() => setPage('manage-clinics')}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-sm"
          >
            إدارة العيادات
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="إجمالي العيادات" value={clinics.length} icon={LayoutDashboard} />
        <StatCard label="قيد الانتظار" value={statusCounts[RegistrationStatus.PENDING] || 0} icon={Clock} className="bg-amber-50/50 dark:bg-amber-900/10" />
        <StatCard label="مفعلة" value={statusCounts[RegistrationStatus.APPROVED] || 0} icon={ShieldCheck} className="bg-emerald-50/50 dark:bg-emerald-900/10" />
        <StatCard label="معلقة / مرفوضة" value={(statusCounts[RegistrationStatus.SUSPENDED] || 0) + (statusCounts[RegistrationStatus.REJECTED] || 0)} icon={Ban} className="bg-rose-50/50 dark:bg-rose-900/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">طلبات جديدة</h3>
            </div>
            <span className="text-xs text-slate-500">{pending.length} pending</span>
          </div>
          {loading ? (
            <div className="p-6 text-center text-slate-400">جار التحميل...</div>
          ) : pending.length === 0 ? (
            <div className="p-6 text-center text-slate-400">لا توجد طلبات حالياً</div>
          ) : (
            <div className="space-y-3">
              {pending.slice(0, 5).map(c => (
                <div key={c.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{c.name}</p>
                      <p className="text-xs text-slate-500">{c.email}</p>
                    </div>
                    <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">PENDING</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-2 flex flex-wrap gap-3">
                    {c.phone && <span className="flex items-center gap-1"><Phone size={12} /> {c.phone}</span>}
                    {c.address && <span className="flex items-center gap-1"><MapPin size={12} /> {c.address}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 text-right">
            <button onClick={() => setPage('clinics')} className="text-sm text-primary-600 hover:underline">عرض كل الطلبات</button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">أحدث العيادات المفعلة</h3>
            </div>
            <span className="text-xs text-slate-500">{approved.length} shown</span>
          </div>
          {approved.length === 0 ? (
            <div className="p-6 text-center text-slate-400">لا توجد عيادات مفعلة بعد</div>
          ) : (
            <div className="space-y-3">
              {approved.map(c => (
                <div key={c.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{c.name}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-500" /> ACTIVE</p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <div className="font-mono text-emerald-600 dark:text-emerald-300">{c.id.slice(0, 8)}...</div>
                      {c.license?.plan?.name && <div>{c.license.plan.name}</div>}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 flex flex-wrap gap-2">
                    <span className="flex items-center gap-1"><Mail size={12} /> {c.email}</span>
                    {c.license?.expireDate && <span className="flex items-center gap-1"><AlertTriangle size={12} /> انتهاء: {new Date(c.license.expireDate).toLocaleDateString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 text-right">
            <button onClick={() => setPage('manage-clinics')} className="text-sm text-primary-600 hover:underline">إدارة العيادات</button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-sky-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">تنبيهات سريعة</h3>
          </div>
          <span className="text-xs text-slate-500">تذكير</span>
        </div>
        <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-2 list-disc list-inside">
          <li>قُم بمراجعة الطلبات الجديدة والموافقة عليها سريعاً لتفعيل العيادات.</li>
          <li>استخدم زر Force Logout من إدارة العيادات عند التعليق أو انتهاء الاشتراك.</li>
          <li>تأكد من ربط كل عيادة بخطة (license) فعالة عند الموافقة.</li>
        </ul>
      </div>
    </div>
  );
};

export default ClinicDashboard;
