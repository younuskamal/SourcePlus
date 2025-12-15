import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import {
    Server, Globe, Check, Stethoscope, Copy, CheckCheck, Shield, Key, UserCheck
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
                    دليل شامل لتكامل نظام العيادات - كل ما تحتاجه للتسجيل والمصادقة وإدارة الاشتراكات
                </p>
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
  "doctorName": "د. أحمد علي",
  "email": "clinic@example.com",
  "phone": "+9647701234567",
  "address": "بغداد، المنصور",
  "systemVersion": "1.0.0",
  "status": "PENDING",
  "licenseId": null,
  "createdAt": "2025-12-14T10:00:00.000Z",
  "updatedAt": "2025-12-14T10:00:00.000Z",
  "users": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "د. أحمد علي",
      "email": "clinic@example.com",
      "role": "clinic_admin",
      "status": "PENDING",
      "clinicId": "550e8400-e29b-41d4-a716-446655440000",
      "createdAt": "2025-12-14T10:00:00.000Z"
    }
  ]
}`}
                        notes={[
                            "جميع الحقول مطلوبة ما عدا phone و address و systemVersion (اختيارية)",
                            "البريد الإلكتروني يجب أن يكون فريداً",
                            "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
                            "الحالة الابتدائية ستكون PENDING"
                        ]}
                    />
                    <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-xl">
                        <div className="flex-shrink-0 p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <Copy size={18} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 flex items-center justify-between">
                            <span className="text-sm font-mono text-blue-900 dark:text-blue-100">
                                {LICENSING_BASE}/api/clinics/register
                            </span>
                            <CopyButton text={`${LICENSING_BASE}/api/clinics/register`} url="register" />
                        </div>
                    </div>
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
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "د. أحمد علي",
    "email": "clinic@example.com",
    "role": "clinic_admin",
    "clinicId": "550e8400-e29b-41d4-a716-446655440000"
  }
}`}
                        notes={[
                            "Access Token صالح لمدة 15 دقيقة",
                            "Refresh Token صالح لمدة 7 أيام",
                            "إذا كانت حالة المستخدم PENDING أو REJECTED أو SUSPENDED، سيتم رفض الدخول",
                            "حمولة الـ JWT تحتوي الحقول: userId, clinicId, role"
                        ]}
                    />

                    <Endpoint
                        isRtl={isRtl}
                        method="POST"
                        url="/api/auth/refresh"
                        title="تحديث رمز المصادقة"
                        description="تحديث Access Token باستخدام Refresh Token"
                        payload={`{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}`}
                        response={`{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}`}
                    />

                    <Endpoint
                        isRtl={isRtl}
                        method="GET"
                        url="/api/auth/me"
                        title="الحصول على معلومات المستخدم الحالي"
                        description="يسترجع معلومات المستخدم المصادق عليه. يتطلب Authorization Header."
                        headers={`Authorization: Bearer <accessToken>`}
                        response={`{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "name": "د. أحمد علي",
  "email": "clinic@example.com",
  "role": "clinic_admin",
  "clinicId": "550e8400-e29b-41d4-a716-446655440000"
}`}
                    />

                    <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-xl">
                        <div className="flex-shrink-0 p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <Copy size={18} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 flex items-center justify-between">
                            <span className="text-sm font-mono text-blue-900 dark:text-blue-100">
                                {LICENSING_BASE}/api/auth/login
                            </span>
                            <CopyButton text={`${LICENSING_BASE}/api/auth/login`} url="login" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 3: Subscription Status */}
            <section>
                <SectionHeader
                    title="3. حالة الاشتراك والترخيص (Subscription Status)"
                    icon={Key}
                    description="التحقق من حالة تفعيل العيادة ومعلومات الترخيص"
                />
                <div className="space-y-4">
                    <Endpoint
                        isRtl={isRtl}
                        method="GET"
                        url="/api/subscription/status"
                        title="التحقق من حالة التفعيل"
                        description="يستخدم للتحقق من حالة العيادة والترخيص. يمكن إرسال clinicId كـ Query Parameter أو استخدام Token في Headers."
                        headers={`Authorization: Bearer <accessToken>
# أو إرسال clinicId في Query:`}
                        queryParams="?clinicId=550e8400-e29b-41d4-a716-446655440000"
                        response={`{
  "clinicId": "550e8400-e29b-41d4-a716-446655440000",
  "clinicName": "عيادة الأمل الطبية",
  "status": "APPROVED",
  "license": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "serial": "CLINIC-2025-XXXX-YYYY-ZZZZ",
    "status": "active",
    "expireDate": "2026-12-14T00:00:00.000Z",
    "deviceLimit": 3,
    "activationCount": 1,
    "plan": {
      "id": "plan-123",
      "name": "خطة العيادات الأساسية",
      "durationMonths": 12
    }
  },
  "remainingDays": 365,
  "forceLogout": false
}`}
                        notes={[
                            "الحالات الممكنة: PENDING / APPROVED / SUSPENDED / REJECTED",
                            "forceLogout=true يعني يجب إنهاء الجلسات فوراً (يُفعّل تلقائياً عند التعليق أو انتهاء الترخيص)",
                            "يمكن تمرير clinicId أو الاكتفاء بالتوكن المصدق ليتم التعرف على العيادة تلقائياً"
                        ]}
                    />

                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-xl">
                        <div className="flex items-start gap-3">
                            <UserCheck size={20} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                            <div className="space-y-2">
                                <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
                                    حالات الاشتراك الممكنة:
                                </p>
                                <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                                    <li>• <strong>PENDING</strong>: بانتظار موافقة الإدارة</li>
                                    <li>• <strong>APPROVED</strong>: مفعل وجاهز للاستخدام</li>
                                    <li>• <strong>SUSPENDED</strong>: معلق مؤقتاً</li>
                                    <li>• <strong>REJECTED</strong>: مرفوض من الإدارة</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-xl">
                        <div className="flex-shrink-0 p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <Copy size={18} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 flex items-center justify-between">
                            <span className="text-sm font-mono text-blue-900 dark:text-blue-100">
                                {LICENSING_BASE}/api/subscription/status
                            </span>
                            <CopyButton text={`${LICENSING_BASE}/api/subscription/status`} url="subscription" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Reference */}
            <section className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Server size={20} className="text-emerald-500" />
                    مرجع سريع للروابط
                </h3>
                <div className="space-y-2">
                    {[
                        { name: 'تسجيل عيادة', url: '/api/clinics/register', method: 'POST' },
                        { name: 'تسجيل الدخول', url: '/api/auth/login', method: 'POST' },
                        { name: 'تحديث Token', url: '/api/auth/refresh', method: 'POST' },
                        { name: 'معلومات المستخدم', url: '/api/auth/me', method: 'GET' },
                        { name: 'حالة الاشتراك', url: '/api/subscription/status', method: 'GET' },
                    ].map((endpoint, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${endpoint.method === 'GET'
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    }`}>
                                    {endpoint.method}
                                </span>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{endpoint.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <code className="text-xs font-mono text-slate-600 dark:text-slate-400">{endpoint.url}</code>
                                <CopyButton text={`${LICENSING_BASE}${endpoint.url}`} url={endpoint.url} />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

        </div>
    );
};

export default ClinicApiDocs;
