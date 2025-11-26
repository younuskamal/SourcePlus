
import React from 'react';
import { translations, Language } from '../locales';

interface ApiDocsProps {
  currentLang: Language;
}

const CodeBlock: React.FC<{ children: React.ReactNode; variant?: 'default' | 'success' | 'info' }> = ({
  children,
  variant = 'default'
}) => {
  const palette =
    variant === 'success'
      ? 'bg-emerald-950 text-emerald-100 border-emerald-800'
      : variant === 'info'
        ? 'bg-blue-950 text-blue-100 border-blue-800'
        : 'bg-slate-900 text-slate-100 border-slate-800';
  return (
    <pre className={`text-xs p-4 rounded-xl overflow-x-auto border font-mono ${palette}`}>{children}</pre>
  );
};

const Endpoint = ({ method, url, description, payload, response }: any) => (
  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800 mb-8 shadow-sm transition-colors">
    <div className="bg-slate-50 dark:bg-slate-900 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
      <span
        className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide ${
          method === 'GET'
            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
            : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
        }`}
      >
        {method}
      </span>
      <code className="text-sm text-slate-700 dark:text-slate-300 font-mono font-semibold">{url}</code>
    </div>
    <div className="p-6 space-y-6">
      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{description}</p>

      {payload && (
        <div>
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Request Body (JSON)
          </h4>
          <CodeBlock variant="info">{payload}</CodeBlock>
        </div>
      )}

      {response && (
        <div>
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Response (JSON)
          </h4>
          <CodeBlock variant="success">{response}</CodeBlock>
        </div>
      )}
    </div>
  </div>
);

const LICENSING_BASE = 'https://sourceplus.onrender.com/api';
const AUTH_BASE = 'https://sourceplus.onrender.com/auth';

const ApiDocs: React.FC<ApiDocsProps> = ({ currentLang }) => {
  const t = translations[currentLang];

  return (
    <div className="max-w-5xl mx-auto pb-16 space-y-12">
      <header className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm p-8 space-y-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t.apiDocs}</h1>
          <p className="text-slate-500 dark:text-slate-300 text-base">
            Complete guide to connect your POS / desktop application to SourcePlus Licensing Server with secure
            authentication, device activation, updates, and remote support.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              label: 'Licensing Base URL',
              value: LICENSING_BASE,
              note: 'Use for every /license, /subscription, /config endpoint'
            },
            {
              label: 'Auth Base URL',
              value: AUTH_BASE,
              note: 'Login + refresh to retrieve JWT tokens'
            },
            {
              label: 'Default Admin',
              value: 'admin@sourceplus.com / Admin12345',
              note: 'Use once to generate your first token, then create dedicated accounts'
            }
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 px-4 py-5"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                {card.label}
              </p>
              <p className="text-sm font-mono font-bold text-primary-600 dark:text-primary-300 break-all">{card.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{card.note}</p>
            </div>
          ))}
        </div>
      </header>

      <section className="space-y-6">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Integration Checklist / تعليمات الربط</h2>
          <ol className="list-decimal list-inside text-slate-600 dark:text-slate-300 space-y-2 text-sm leading-relaxed">
            <li>
              اضبط التطبيق على <strong>{LICENSING_BASE}</strong> للعمليات و <strong>{AUTH_BASE}</strong> لتسجيل الدخول.
            </li>
            <li>أرسل الطلبات على شكل JSON مع الترويسة: <code>Content-Type: application/json</code>.</li>
            <li>بعد تسجيل الدخول، خزّن توكن الوصول وضمِنه في الترويسة <code>Authorization: Bearer &lt;token&gt;</code>.</li>
            <li>على كل تشغيل، استعمل <code>/license/validate</code> و<code>/subscription/status</code> للتحقق من الحالة.</li>
            <li>راقب حقول <code>forceLogout</code> و<code>forceUpdate</code> لتطبيق القرارات الصادرة من السيرفر فوراً.</li>
            <li>هيّئ مهلة 5 ثوانٍ وإعادة محاولة (retry) عند مشاكل الشبكة لتحسين تجربة المستخدم.</li>
          </ol>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400 mb-2">
                Sample fetch()
              </p>
              <CodeBlock>
{`fetch('${LICENSING_BASE}/license/validate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer <ACCESS_TOKEN>'
  },
  body: JSON.stringify({ serial: 'SP-2024-XXXX-YYYY' })
}).then((res) => res.json());`}
              </CodeBlock>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400 mb-2">
                Sample Axios
              </p>
              <CodeBlock variant="info">
{`import axios from 'axios';

const api = axios.create({
  baseURL: '${LICENSING_BASE}',
  headers: { Authorization: 'Bearer <ACCESS_TOKEN>' }
});

const license = await api.post('/license/activate', {
  serial: 'SP-2024-XXXX-YYYY',
  hardwareId: hwid,
  deviceName: 'POS-01',
  appVersion: '1.2.0'
});`}
              </CodeBlock>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Authentication Flow</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          1) أرسل البريد الإلكتروني/الرمز السري إلى <code>{AUTH_BASE}/login</code> لتحصل على توكني الوصول والتحديث. 2) احفظ
          التوكنات محلياً. 3) استعمل <code>/auth/refresh</code> عندما تحصل على 401 بدون تسجيل خروج المستخدم. 4) قم بتسجيل
          الخروج بإزالة التوكنات من التخزين المحلي.
        </p>
        <CodeBlock variant="success">
{`POST ${AUTH_BASE}/login
{
  "email": "admin@sourceplus.com",
  "password": "Admin12345"
}

Response:
{
  "accessToken": "<JWT>",
  "refreshToken": "<JWT>",
  "user": { "id": "...", "role": "admin", ... }
}`}
        </CodeBlock>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 flex items-center justify-center text-sm">
            1
          </span>
          Licensing & Activation
        </h2>

        <Endpoint
          method="POST"
          url="/api/license/validate"
          description="Check if a serial number exists and is valid. Does not bind the device."
          payload={`{
  "serial": "SP-2024-XXXX-YYYY"
}`}
          response={`{
  "valid": true,
  "status": "active",
  "plan": {
     "name": "Standard Plan",
     "features": ["Offline Mode", "Reports"]
  },
  "expireDate": "2024-12-31T00:00:00Z"
}`}
        />

        <Endpoint
          method="POST"
          url="/api/license/activate"
          description="Activates the license on the current device. Locks the serial to the provided HWID."
          payload={`{
  "serial": "SP-2024-XXXX-YYYY",
  "hardwareId": "UUID-MAC-DISK-SERIAL",
  "deviceName": "Cashier-01",
  "appVersion": "1.0.0"
}`}
          response={`{
  "success": true,
  "activationDate": "2024-01-01T10:00:00Z",
  "message": "Device activated successfully."
}`}
        />

        <Endpoint
          method="GET"
          url="/api/subscription/status"
          description="Call this on every app startup to verify access permission and detect maintenance actions."
          response={`{
  "status": "active",
  "remainingDays": 120,
  "forceLogout": false
}`}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 flex items-center justify-center text-sm">
            2
          </span>
          Updates & Remote Config
        </h2>
        <Endpoint
          method="GET"
          url="/api/app/update?version=1.0.0"
          description="Check for new application versions and whether an update should be enforced."
          response={`{
  "hasUpdate": true,
  "version": "1.1.0",
  "downloadUrl": "https://cdn.sourceplus.com/v1.1.0.exe",
  "releaseNotes": "Fixed receipt printing bug.",
  "forceUpdate": false
}`}
        />

        <Endpoint
          method="GET"
          url="/api/config/sync"
          description="Fetch remote configuration keys (Maintenance mode, support channels, feature flags)."
          response={`{
  "maintenance_mode": false,
  "support_phone": "+9647700000000",
  "features": {
     "beta_reports": true
  }
}`}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 flex items-center justify-center text-sm">
            3
          </span>
          Support & Diagnostics
        </h2>
        <Endpoint
          method="POST"
          url="/api/support/request"
          description="Submit a support ticket directly from the POS. Attach HWID, device name, and description."
          payload={`{
  "serial": "SP-...",
  "hardwareId": "...",
  "appVersion": "1.2.0",
  "description": "Printer not working"
}`}
          response={`{
  "ticketId": "T-10293",
  "status": "received"
}`}
        />

        <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Troubleshooting / ملاحظات مهمة</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>إذا حصلت على 401، جرّب استدعاء <code>/auth/refresh</code> بنفس توكن التحديث قبل إعادة تسجيل الدخول.</li>
            <li>استخدم <code>/health</code> (بدون توكن) للتأكد من جاهزية السيرفر قبل إظهار رسالة للمستخدم.</li>
            <li>سجّل الأخطاء في تطبيقك مع رقم التذكرة أو السيريال لتسهيل تتبع البلاغات من لوحة التحكم.</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default ApiDocs;
