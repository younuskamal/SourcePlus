import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import {
    Server, Shield, Globe, Check, Zap,
    HeartPulse, Settings, LifeBuoy, CreditCard
} from 'lucide-react';
import { LICENSING_BASE, AUTH_BASE, Endpoint, SectionHeader } from '../components/ApiDocsComponents';

const PosApiDocs: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';

    return (
        <div className="max-w-4xl mx-auto pb-20 space-y-12" dir={isRtl ? 'rtl' : 'ltr'}>

            {/* Header */}
            <div className="text-center space-y-4 py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-primary-500/20 mb-4">
                    <Server size={32} />
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {t('nav.apiDocs')}
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                    Comprehensive guide to integrating your applications with the SourcePlus Licensing System.
                </p>
            </div>

            {/* Base Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400">
                        <Shield size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Auth URL</span>
                    </div>
                    <code className="text-sm font-mono font-bold text-slate-900 dark:text-white break-all">
                        {AUTH_BASE}
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

            {/* SourcePlus POS Licensing Documentation */}

            <section>
                <SectionHeader
                    title="تفعيل الترخيص (Licensing & Activation)"
                    icon={Zap}
                    description="خطوات تفعيل وتشغيل نظام نقاط البيع (POS) خطوة بخطوة."
                />
                <div className="space-y-4">
                    <Endpoint
                        isRtl={isRtl}
                        method="POST"
                        url="/api/pos/validate"
                        title="1. التحضير: التحقق من المفتاح (Prepare: Validate Serial)"
                        description="اختياري: يستخدم للتحقق مما إذا كان مفتاح الترخيص صالحًا قبل محاولة تفعيله. مفيد لواجهات المستخدم لإظهار اسم الخطة."
                        payload={`{
  "serial": "SP-2024-XXXX-YYYY",
  "hardwareId": "Optional-HWID-Check"
}`}
                        response={`{
  "valid": true,
  "status": "active",
  "expireDate": "2024-12-31T00:00:00Z",
  "daysLeft": 200,
  "isExpired": false,
  "plan": {
     "id": "uuid-...",
     "name": "Professional",
     "durationMonths": 12,
     "features": { 
        "pos": true, 
        "inventory": true,
        "reports": true
     },
     "limits": {
        "maxUsers": 5,
        "maxBranches": 2,
        "maxInvoices": -1 
     },
     "deviceLimit": 3
  }
}`}
                    />
                    <Endpoint
                        isRtl={isRtl}
                        method="POST"
                        url="/api/pos/activate"
                        title="2. التفعيل لأول مرة (First-Time Activation)"
                        description="مطلوب: يربط مفتاح الترخيص بجهاز محدد عبر (Hardware ID). يجب القيام بهذه الخطوة عند تثبيت النظام لأول مرة."
                        payload={`{
  "serial": "SP-2024-XXXX-YYYY",
  "hardwareId": "UUID-MAC-DISK-SERIAL",
  "deviceName": "Cashier-01",
  "appVersion": "1.0.0"
}`}
                        response={`{
  "success": true,
  "activationDate": "2024-01-01T10:00:00Z"
}`}
                    />
                    <Endpoint
                        isRtl={isRtl}
                        method="GET"
                        url="/api/pos/check-license?serial=..."
                        title="3. التشغيل اليومي (Daily Startup Check)"
                        description="مطلوب: يجب استدعاء هذا الرابط عند بدء تشغيل التطبيق للتحقق من أن الترخيص لا يزال فعالاً ولم ينتهِ."
                        response={`{
  "valid": true,
  "status": "active",
  "expireDate": "2024-12-31T00:00:00Z",
  "daysLeft": 199,
  "plan": {
    "name": "Professional",
    "deviceLimit": 3,
    "limits": {
       "maxUsers": 5,
       "maxBranches": 2,
       "maxInvoices": -1,  // -1 indicates Unlimited (∞)
       "maxProducts": 1000,
       "maxCustomers": -1
    }
  }
}`}
                    />
                </div>
            </section>

            {/* System Health */}
            <section>
                <SectionHeader
                    title="صحة النظام والتحديثات (Health & Updates)"
                    icon={HeartPulse}
                    description="الحفاظ على حالة التطبيق والتحقق من التحديثات."
                />
                <div className="space-y-4">
                    <Endpoint
                        isRtl={isRtl}
                        method="POST"
                        url="/api/pos/heartbeat"
                        title="4. وقت التشغيل: نبض النظام (Runtime: Heartbeat)"
                        description="مطلوب: يجب إرسال هذا الطلب بشكل دوري (مثلاً كل 60 دقيقة) لتحديث حالة الجهاز في السيرفر وتجنب تعطيل الترخيص."
                        payload={`{
  "serial": "SP-2024-XXXX-YYYY",
  "hardwareId": "UUID-MAC-DISK-SERIAL",
  "appVersion": "1.0.0"
}`}
                        response={`{
  "success": true,
  "timestamp": "2024-01-01T12:00:00Z"
}`}
                    />
                    <Endpoint
                        isRtl={isRtl}
                        method="GET"
                        url="/api/pos/check-update?version=1.0.0"
                        title="التحقق من التحديثات"
                        description="التحقق مما إذا كان هناك إصدار جديد متاح للتطبيق."
                        response={`{
  "shouldUpdate": true,
  "latest": {
    "version": "1.1.0",
    "downloadUrl": "https://cdn.sourceplus.com/v1.1.0.exe",
    "releaseNotes": "Bug fixes and improvements.",
    "forceUpdate": false
  }
}`}
                    />
                </div>
            </section>

            {/* Configuration & Data */}
            <section>
                <SectionHeader
                    title="الإعدادات والبيانات (Configuration)"
                    icon={Settings}
                    description="استرجاع الإعدادات والبيانات عن بعد."
                />
                <div className="space-y-4">
                    <Endpoint
                        isRtl={isRtl}
                        method="GET"
                        url="/api/pos/plans"
                        title="جلب الخطط (Get Plans)"
                        description="استرجاع قائمة الخطط المتاحة في النظام لعرضها للمستخدم إذا لزم الأمر."
                        response={`[
  {
    "id": "uuid...",
    "name": "Professional",
    "durationMonths": 12,
    "features": { "pos": true, "inventory": true, "customers": true, "reports": true },
    "limits": { 
      "maxUsers": 5, 
      "maxBranches": 2,
      "maxInvoices": -1,  // -1 indicates Unlimited (∞)
      "maxProducts": 1000,
      "maxCustomers": -1
    },
    "deviceLimit": 3,
    "prices": [
       { "currency": "USD", "periodPrice": 100, "isPrimary": true },
       { "currency": "IQD", "periodPrice": 150000, "isPrimary": false }
    ]
  }
]`}
                    />
                    <Endpoint
                        isRtl={isRtl}
                        method="GET"
                        url="/api/pos/sync-config"
                        title="مزامنة الإعدادات (Sync Config)"
                        description="استرجاع مفاتيح الإعدادات عن بعد (Remote Config)."
                        response={`{
  "maintenance_mode": false,
  "min_version": "1.0.0"
}`}
                    />
                </div>
            </section>

            {/* Support */}
            <section>
                <SectionHeader
                    title="الدعم الفني (Support)"
                    icon={LifeBuoy}
                    description="إرسال تذاكر الدعم الفني مباشرة من التطبيق."
                />
                <div className="space-y-4">
                    <Endpoint
                        isRtl={isRtl}
                        method="POST"
                        url="/api/pos/support"
                        title="إنشاء تذكرة دعم"
                        description="إرسال طلب دعم جديد / إبلاغ عن مشكلة."
                        payload={`{
  "serial": "SP-2024...",
  "hardwareId": "...",
  "deviceName": "POS-01",
  "systemVersion": "Windows 11",
  "phoneNumber": "0770...",
  "appVersion": "1.0.0",
  "description": "Printer not working"
}`}
                        response={`{
  "ticketId": "uuid...",
  "status": "open"
}`}
                    />
                    <Endpoint
                        isRtl={isRtl}
                        method="GET"
                        url="/api/pos/support?serial=..."
                        title="سجل التذاكر والردود (Ticket History)"
                        description="استرجاع جميع التذاكر السابقة والردود الخاصة بهذا السيريال."
                        response={`[
  {
    "id": "uuid...",
    "description": "Printer Issue",
    "status": "open",
    "createdAt": "2024...",
    "replies": [
       { "message": "Please restart...", "createdAt": "..." }
    ]
  }
]`}
                    />
                </div>
            </section>

            {/* Notifications */}
            <section>
                <SectionHeader
                    title="الإشعارات (Notifications)"
                    icon={CreditCard}
                    description="استقبال الرسائل والتنبيهات من الإدارة."
                />
                <div className="space-y-4">
                    <Endpoint
                        isRtl={isRtl}
                        method="GET"
                        url="/api/pos/notifications?serial=..."
                        title="جلب الإشعارات"
                        description="التحقق من وجود رسائل جديدة (عامة أو موجهة لهذا السيريال بالتحديد)."
                        response={`[
  {
    "id": "uuid...",
    "title": "تحديث هام",
    "body": "يرجى تحديث النظام...",
    "sentAt": "2024-03-20..."
  }
]`}
                    />
                </div>
            </section>

        </div>
    );
};

export default PosApiDocs;
