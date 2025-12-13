import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import {
    Server, Globe, Check, Stethoscope
} from 'lucide-react';
import { LICENSING_BASE, Endpoint, SectionHeader } from '../components/ApiDocsComponents';

const ClinicApiDocs: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';

    return (
        <div className="max-w-4xl mx-auto pb-20 space-y-12" dir={isRtl ? 'rtl' : 'ltr'}>

            {/* Header */}
            <div className="text-center space-y-4 py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-primary-500/20 mb-4">
                    <Server size={32} />
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {t('nav.apiDocs')}
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                    دليل دمج وتسجيل نظام العيادات
                </p>
            </div>

            {/* Base Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-primary-600 dark:text-primary-400">
                        <Globe size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Base URL</span>
                    </div>
                    <code className="text-sm font-mono font-bold text-slate-900 dark:text-white break-all">
                        {LICENSING_BASE}
                    </code>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
                        <Check size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">System Status</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">Active</span>
                    </div>
                </div>
            </div>

            {/* Clinic Specific Documentation */}
            <section>
                <SectionHeader
                    title="تسجيل العيادات (Clinic Registration)"
                    icon={Stethoscope}
                    description="نقاط النهاية (Endpoints) الخاصة بتسجيل عيادة جديدة والتحقق من حالتها."
                />
                <div className="space-y-4">
                    <Endpoint
                        isRtl={isRtl}
                        method="POST"
                        url="/api/clinics/register"
                        title="1. إرسال طلب التسجيل (Registration Request)"
                        description="الخطوة الأولى: يتم استدعاء هذا الرابط مرة واحدة فقط عند تثبيت النظام لأول مرة. يقوم بإرسال بيانات العيادة و HWID الخاص بالسيرفر. ستكون حالة العيادة PENDING بانتظار الموافقة من الإدارة."
                        payload={`{
  "name": "عيادة الأمل الطبية",
  "doctorName": "د. أحمد علي",
  "email": "clinic@example.com",
  "password": "securePassword123",
  "phone": "+9647701234567",
  "address": "بغداد، المنصور",
  "hwid": "HWID-1234-5678-9000",
  "systemVersion": "1.0.0"
}`}
                        response={`{
  "id": "uuid-clinic-id",
  "name": "عيادة الأمل الطبية",
  "status": "PENDING",
  "createdAt": "2024-03-20T10:00:00Z",
  "users": [
    {
      "id": "uuid-user-id",
      "email": "clinic@example.com",
      "role": "clinic_admin",
      "status": "PENDING"
    }
  ]
}`}
                    />
                    <Endpoint
                        isRtl={isRtl}
                        method="GET"
                        url="/api/subscription/status?hwid=HWID-..."
                        title="2. التحقق من التفعيل (Check Activation)"
                        description="الخطوة الثانية: يستخدم هذا الرابط للتحقق دورياً من حالة التفعيل. يجب استدعاؤه عند بدء التشغيل. إذا كانت الحالة 'pending' يفضل عرض شاشة انتظار، وعندما تتحول إلى 'active' يتم الدخول للنظام."
                        response={`{
  "status": "active",
  "license": {
     "serial": "CLINIC-KEY-XXXX",
     "expireDate": "2025-03-20"
  },
  "remainingDays": 365,
  "forceLogout": false
}`}
                    />
                </div>
            </section>

        </div>
    );
};

export default ClinicApiDocs;
