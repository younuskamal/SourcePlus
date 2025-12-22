import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import {
    Server, Globe, Check, Stethoscope, Copy, CheckCheck, Shield, Key, UserCheck,
    Settings, BarChart3, MessageSquare, HardDrive, Users, Zap, Lock
} from 'lucide-react';
import { LICENSING_BASE, Endpoint, SectionHeader } from '../components/ApiDocsComponents';

const ClinicApiDocs: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

    const copyToClipboard = (text: string, url: string) => {
        navigator.clipboard.writeText(text);
        setCopiedUrl(url);
        setTimeout(() => setCopiedUrl(null), 2000);
    };

    const CopyButton: React.FC<{ text: string; url: string }> = ({ text, url }) => (
        <button
            onClick={() => copyToClipboard(text, url)}
            className="ml-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Copy URL"
        >
            {copiedUrl === url ? (
                <CheckCheck size={16} className="text-emerald-500" />
            ) : (
                <Copy size={16} className="text-slate-400" />
            )}
        </button>
    );

    return (
        <div className="max-w-5xl mx-auto pb-20 space-y-12" dir={isRtl ? 'rtl' : 'ltr'}>

            {/* Header */}
            <div className="text-center space-y-4 py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-primary-500/20 mb-4">
                    <Stethoscope size={32} />
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Clinic System API Documentation
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                    دليل شامل لتكامل نظام العيادات - التسجيل، المصادقة، التحكم، والدعم الفني
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-bold">
                    <Check size={16} />
                    API Version 4.0 - Production Ready
                </div>
            </div>

            {/* Base Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-primary-600 dark:text-primary-400">
                        <Globe size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Base URL</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <code className="text-sm font-mono font-bold text-slate-900 dark:text-white break-all">
                            {LICENSING_BASE}
                        </code>
                        <CopyButton text={LICENSING_BASE} url="base" />
                    </div>
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
                        <span className="text-sm font-bold text-slate-900 dark:text-white">Active & Operational</span>
                    </div>
                </div>
            </div>

            {/* Section 1: Registration */}
            <section>
                <SectionHeader
                    title="1. تسجيل العيادة (Clinic Registration)"
                    icon={Stethoscope}
                    description="تسجيل عيادة جديدة في النظام وإنشاء حساب المدير"
                />
                <div className="space-y-4">
                    <Endpoint
                        isRtl={isRtl}
                        method="POST"
                        url="/api/clinics/register"
                        title="تسجيل عيادة جديدة"
                        description="يرسل طلب تسجيل عيادة جديدة مع بيانات المدير. سيتم إنشاء العيادة بحالة PENDING بانتظار الموافقة من الإدارة."
                        payload={`{
  "name": "عيادة الأمل الطبية",
  "doctorName": "د. أحمد علي",
  "email": "clinic@example.com",
  "password": "securePassword123",
  "phone": "+9647701234567",
  "address": "بغداد، المنصور",
  "systemVersion": "1.0.0"
}`}
                        response={`{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "عيادة الأمل الطبية",
  "status": "PENDING",
  "createdAt": "2025-12-21T12:00:00.000Z"
}`}
                        notes={[
                            "جميع الحقول مطلوبة ما عدا phone و address و systemVersion (اختيارية)",
                            "البريد الإلكتروني يجب أن يكون فريداً",
                            "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
                            "الحالة الابتدائية ستكون PENDING"
                        ]}
                    />
                </div>
            </section>

            {/* Section 2: Authentication */}
            <section>
                <SectionHeader
                    title="2. المصادقة وتسجيل الدخول (Authentication)"
                    icon={Shield}
                    description="تسجيل الدخول والحصول على رموز المصادقة"
                />
                <div className="space-y-4">
                    <Endpoint
                        isRtl={isRtl}
                        method="POST"
                        url="/api/auth/login"
                        title="تسجيل دخول مدير العيادة"
                        description="يستخدم للمصادقة وتسجيل دخول مدير العيادة. يجب أن تكون حالة المستخدم APPROVED للسماح بالدخول."
                        payload={`{
  "email": "clinic@example.com",
  "password": "securePassword123"
}`}
                        response={`{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "name": "د. أحمد علي",
    "email": "clinic@example.com",
    "role": "clinic_admin",
    "clinicId": "clinic-uuid"
  }
}`}
                        notes={[
                            "Access Token صالح لمدة 15 دقيقة",
                            "Refresh Token صالح لمدة 7 أيام",
                            "إذا كانت حالة المستخدم PENDING أو REJECTED أو SUSPENDED، سيتم رفض الدخول"
                        ]}
                    />
                </div>
            </section>

            {/* Section 3: Clinic Controls API */}
            <section>
                <SectionHeader
                    title="3. إعدادات وحدود العيادة (Clinic Controls)"
                    icon={Settings}
                    description="إدارة حدود التخزين والمستخدمين والميزات"
                />
                <div className="space-y-4">
                    <Endpoint
                        isRtl={isRtl}
                        method="GET"
                        url="/api/clinics/:id/controls"
                        title="الحصول على إعدادات العيادة"
                        description="جلب إعدادات وحدود العيادة (endpoint عام - لا يحتاج authentication)"
                        response={`{
  "storageLimitMB": 2048,
  "usersLimit": 5,
  "features": {
    "patients": true,
    "appointments": true,
    "orthodontics": true,
    "xray": false,
    "ai": true
  },
  "locked": false,
  "lockReason": null
}`}
                        notes={[
                            "هذا الـ endpoint عام - يمكن استدعاؤه بدون authentication",
                            "إذا لم توجد إعدادات، يتم إنشاؤها تلقائياً بالقيم الافتراضية",
                            "القيم الافتراضية: 1024MB storage, 3 users, أساسيات فقط مفعلة",
                            "استخدمه عند بداية تشغيل النظام لجلب القيود"
                        ]}
                    />

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-xl">
                        <div className="flex items-start gap-3">
                            <HardDrive size={20} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                            <div className="space-y-2">
                                <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
                                    الميزات المتاحة (Features):
                                </p>
                                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                                    <li>• <strong>patients</strong>: إدارة المرضى</li>
                                    <li>• <strong>appointments</strong>: المواعيد</li>
                                    <li>• <strong>orthodontics</strong>: تقويم الأسنان</li>
                                    <li>• <strong>xray</strong>: الأشعة السينية</li>
                                    <li>• <strong>ai</strong>: ميزات الذكاء الاصطناعي</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 4: Usage Statistics */}
            <section>
                <SectionHeader
                    title="4. إحصائيات الاستخدام (Usage Statistics)"
                    icon={BarChart3}
                    description="متابعة استخدام الموارد الحالي"
                />
                <div className="space-y-4">
                    <Endpoint
                        isRtl={isRtl}
                        method="GET"
                        url="/api/clinics/:id/usage"
                        title="الحصول على إحصائيات الاستخدام"
                        description="جلب البيانات الحقيقية لاستخدام العيادة (requires admin authentication)"
                        headers="Authorization: Bearer <admin_token>"
                        response={`{
  "storageUsedMB": 245,
  "storageLimitMB": 1024,
  "usersUsed": 2,
  "usersLimit": 3,
  "patientsUsed": 320,
  "patientsLimit": 500,
  "filesCount": 1540,
  "locked": false,
  "lockReason": null,
  "lastSyncAt": "2025-12-21T12:00:00Z"
}`}
                        notes={[
                            "usersUsed: عدد المستخدمين النشطين (status ≠ SUSPENDED)",
                            "patientsUsed: قد تكون null إذا لم ترسل العيادة أرقام المرضى بعد (لا يتم التنبؤ بالقيم)",
                            "storageUsedMB: المساحة المستخدمة فعلياً من ملفات العيادة",
                            "lastSyncAt: آخر وقت أرسلت فيه العيادة البيانات. إذا كان null فهذا يعني أنه لم يتم التبليغ بعد.",
                            "قارن usersUsed مع usersLimit، و patientsUsed مع patientsLimit لفرض الحدود"
                        ]}
                    />

                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-xl">
                        <div className="flex items-start gap-3">
                            <Users size={20} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                            <div className="space-y-2">
                                <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
                                    مثال لحساب النسبة المئوية:
                                </p>
                                <code className="block text-xs bg-amber-100 dark:bg-amber-900/30 p-2 rounded text-amber-900 dark:text-amber-100">
                                    const percentage = (usage.usersUsed / controls.usersLimit) * 100;<br />
                                    if (percentage &gt;= 100) alert("وصلت للحد الأقصى!");
                                </code>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 5: Support Conversations */}
            <section>
                <SectionHeader
                    title="5. نظام الدعم والمحادثات (Support System)"
                    icon={MessageSquare}
                    description="إرسال رسائل الدعم والمحادثة مع فريق الدعم"
                />
                <div className="space-y-4">
                    <Endpoint
                        isRtl={isRtl}
                        method="POST"
                        url="/api/support/messages"
                        title="إنشاء محادثة دعم جديدة"
                        description="إرسال طلب دعم جديد مع إمكانية تحديد الأولوية (endpoint عام - لا يحتاج authentication)"
                        payload={`{
  "clinicId": "clinic-uuid",
  "clinicName": "عيادة الأمل الطبية",
  "accountCode": "CLINIC-001",
  "subject": "مشكلة في تفعيل ميزة الأشعة",
  "message": "نحاول تفعيل ميزة X-Ray لكن النظام يعطي خطأ...",
  "priority": "HIGH"
}`}
                        response={`{
  "id": "msg-uuid",
  "subject": "مشكلة في تفعيل ميزة الأشعة",
  "status": "NEW",
  "priority": "HIGH",
  "createdAt": "2025-12-21T12:00:00Z"
}`}
                        notes={[
                            "priority: LOW / NORMAL / HIGH / URGENT (اختياري - افتراضي NORMAL)",
                            "subject: عنوان الرسالة (مطلوب - 3-200 حرف)",
                            "message: محتوى الرسالة (مطلوب - 10-5000 حرف)",
                            "سيتم الرد عليك من فريق الدعم في نفس المحادثة"
                        ]}
                    />

                    <Endpoint
                        isRtl={isRtl}
                        method="POST"
                        url="/api/support/messages/:id/replies"
                        title="إضافة رد على محادثة دعم"
                        description="الرد على رسالة دعم موجودة (endpoint عام)"
                        payload={`{
  "content": "شكراً للرد السريع. جربنا الحل المقترح..."
}`}
                        response={`{
  "id": "reply-uuid",
  "messageId": "msg-uuid",
  "senderName": "عيادة الأمل الطبية",
  "content": "شكراً للرد السريع...",
  "isFromAdmin": false,
  "createdAt": "2025-12-21T12:05:00Z"
}`}
                        notes={[
                            "يمكنك إضافة ردود غير محدودة على نفس المحادثة",
                            "إذا كانت المحادثة مغلقة (CLOSED)، سيتم فتحها تلقائياً",
                            "سيتم إشعار فريق الدعم بالرد الجديد"
                        ]}
                    />

                    <Endpoint
                        isRtl={isRtl}
                        method="GET"
                        url="/api/support/messages/:id/conversation"
                        title="عرض المحادثة الكاملة"
                        description="جلب جميع الرسائل والردود في محادثة معينة (endpoint عام)"
                        response={`{
  "id": "msg-uuid",
  "subject": "مشكلة في تفعيل ميزة الأشعة",
  "message": "نحاول تفعيل...",
  "status": "READ",
  "priority": "HIGH",
  "createdAt": "2025-12-21T12:00:00Z",
  "replies": [
    {
      "id": "reply-1",
      "senderName": "فريق الدعم",
      "content": "شكراً للتواصل. دعني أساعدك...",
      "isFromAdmin": true,
      "createdAt": "2025-12-21T12:02:00Z"
    },
    {
      "id": "reply-2",
      "senderName": "عيادة الأمل الطبية",
      "content": "شكراً للرد السريع...",
      "isFromAdmin": false,
      "createdAt": "2025-12-21T12:05:00Z"
    }
  ]
}`}
                        notes={[
                            "يمكنك استخدام polling كل 30 ثانية للتحقق من ردود جديدة",
                            "الردود مرتبة حسب التاريخ (من الأقدم للأحدث)",
                            "isFromAdmin: true يعني رد من فريق الدعم"
                        ]}
                    />

                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-900/30 rounded-xl">
                        <div className="flex items-start gap-3">
                            <MessageSquare size={20} className="text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                            <div className="space-y-2">
                                <p className="text-sm font-bold text-purple-900 dark:text-purple-100">
                                    مستويات الأولوية (Priority):
                                </p>
                                <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                                    <li>• <strong>URGENT</strong>: النظام معطل / مشكلة خطيرة (رد خلال ساعة)</li>
                                    <li>• <strong>HIGH</strong>: ميزة لا تعمل (رد خلال 4 ساعات)</li>
                                    <li>• <strong>NORMAL</strong>: أسئلة عامة (رد خلال 24 ساعة)</li>
                                    <li>• <strong>LOW</strong>: طلبات ميزات / اقتراحات (رد خلال 72 ساعة)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Reference */}
            <section className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Server size={20} className="text-emerald-500" />
                    مرجع سريع للـ Endpoints
                </h3>
                <div className="space-y-2">
                    {[
                        { name: 'تسجيل عيادة', url: '/api/clinics/register', method: 'POST', auth: '❌' },
                        { name: 'تسجيل دخول', url: '/api/auth/login', method: 'POST', auth: '❌' },
                        { name: 'معلومات المستخدم', url: '/api/auth/me', method: 'GET', auth: '✅' },
                        { name: 'إعدادات العيادة', url: '/api/clinics/:id/controls', method: 'GET', auth: '❌' },
                        { name: 'إحصائيات الاستخدام', url: '/api/clinics/:id/usage', method: 'GET', auth: '✅ Admin' },
                        { name: 'إنشاء محادثة دعم', url: '/api/support/messages', method: 'POST', auth: '❌' },
                        { name: 'إضافة رد', url: '/api/support/messages/:id/replies', method: 'POST', auth: '❌' },
                        { name: 'عرض محادثة', url: '/api/support/messages/:id/conversation', method: 'GET', auth: '❌' },
                    ].map((endpoint, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3 flex-1">
                                <span className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${endpoint.method === 'GET'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    }`}>
                                    {endpoint.method}
                                </span>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{endpoint.name}</span>
                                <span className="text-xs text-slate-500">{endpoint.auth}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <code className="text-xs font-mono text-slate-600 dark:text-slate-400 hidden md:block">{endpoint.url}</code>
                                <CopyButton text={`${LICENSING_BASE}${endpoint.url}`} url={endpoint.url} />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Best Practices */}
            <section className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Zap size={20} className="text-emerald-500" />
                    أفضل الممارسات (Best Practices)
                </h3>
                <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                    <div className="flex gap-2">
                        <Check className="text-emerald-600 flex-shrink-0 mt-0.5" size={16} />
                        <p><strong>استدعِ /controls</strong> عند بداية تشغيل النظام لجلب القيود والميزات</p>
                    </div>
                    <div className="flex gap-2">
                        <Check className="text-emerald-600 flex-shrink-0 mt-0.5" size={16} />
                        <p><strong>قارن الاستخدام مع الحدود</strong> قبل السماح بإضافة مستخدمين أو بيانات جديدة</p>
                    </div>
                    <div className="flex gap-2">
                        <Check className="text-emerald-600 flex-shrink-0 mt-0.5" size={16} />
                        <p><strong>استخدم Priority الصحيح</strong> عند إرسال رسائل الدعم لضمان الرد السريع</p>
                    </div>
                    <div className="flex gap-2">
                        <Check className="text-emerald-600 flex-shrink-0 mt-0.5" size={16} />
                        <p><strong>احفظ الـ tokens بشكل آمن</strong> واستخدم refresh token عند انتهاء access token</p>
                    </div>
                    <div className="flex gap-2">
                        <Lock className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
                        <p><strong>افحص locked status</strong> من controls - إذا كان true، أوقف جميع العمليات وأظهر رسالة lockReason</p>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default ClinicApiDocs;
