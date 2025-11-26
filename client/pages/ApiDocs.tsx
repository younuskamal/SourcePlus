
import React from 'react';
import { translations, Language } from '../locales';

interface ApiDocsProps {
  currentLang: Language;
}

const Endpoint = ({ method, url, description, payload, response }: any) => (
  <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800 mb-8 shadow-sm transition-colors">
    <div className="bg-slate-50 dark:bg-slate-900 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
      <span className={`
        px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide
        ${method === 'GET' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'}
        ${method === 'POST' ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : ''}
      `}>{method}</span>
      <code className="text-sm text-slate-700 dark:text-slate-300 font-mono font-semibold">{url}</code>
    </div>
    <div className="p-6 space-y-6">
      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{description}</p>
      
      {payload && (
        <div>
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Request Body (JSON)</h4>
          <pre className="bg-slate-900 dark:bg-slate-950 text-blue-100 p-4 rounded-lg text-xs font-mono overflow-x-auto border border-slate-800 dark:border-slate-700">
            {payload}
          </pre>
        </div>
      )}

      {response && (
        <div>
           <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Response (JSON)</h4>
           <pre className="bg-slate-900 dark:bg-slate-950 text-emerald-100 p-4 rounded-lg text-xs font-mono overflow-x-auto border border-slate-800 dark:border-slate-700">
            {response}
          </pre>
        </div>
      )}
    </div>
  </div>
);

const LICENSING_BASE = 'https://sourceplus.onrender.com/api';

const ApiDocs: React.FC<ApiDocsProps> = ({ currentLang }) => {
  const t = translations[currentLang];

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t.apiDocs}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Integration guide for POS clients to connect with SourcePlus Server.</p>
      </div>

      <section className="mb-10">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Integration Checklist / تعليمات الربط</h2>
          <ol className="list-decimal list-inside text-slate-600 dark:text-slate-300 space-y-2 text-sm">
            <li>
              <strong>Base URL:</strong> استخدم <code className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">{LICENSING_BASE}</code> ثم أضف أي مسار من القائمة أدناه (مثال: <code className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">{LICENSING_BASE}/license/validate</code>).
            </li>
            <li>أرسل كل الطلبات بصيغة JSON مع الترويسة <code className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">Content-Type: application/json</code>.</li>
            <li>خزن الرقم التسلسلي (serial) و Hardware ID في تطبيقك، واستعملهما في نداءات التحقق والتفعيل.</li>
            <li>تحقق من حقل <code>forceLogout</code> أو <code>forceUpdate</code> لإجبار المستخدم على الخروج أو التحديث.</li>
            <li>التزم بمهلة (timeout) قصيرة وأعد المحاولة عند فشل الشبكة لضمان تجربة سلسة.</li>
          </ol>

          <div>
            <p className="text-xs uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400 mb-2">Sample Request</p>
            <pre className="bg-slate-900 text-slate-100 text-xs p-4 rounded-xl overflow-x-auto border border-slate-800">
{`fetch('${LICENSING_BASE}/license/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ serial: 'SP-2024-XXXX-YYYY' })
}).then(res => res.json());`}
            </pre>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 flex items-center justify-center text-sm">1</span>
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
  "status": "active", // active, expired, pending
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
          description="Activates the license on the current device. This locks the license to the Hardware ID (HWID)."
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
           description="Call this on every app startup to verify access permission."
           response={`{
   "status": "active",
   "remainingDays": 120,
   "forceLogout": false
}`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 flex items-center justify-center text-sm">2</span>
          Updates & Config
        </h2>
        <Endpoint 
          method="GET"
          url="/api/app/update?version=1.0.0"
          description="Check for new application versions."
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
          description="Fetch remote configuration keys (Feature flags, maintenance mode)."
          response={`{
  "maintenance_mode": false,
  "support_phone": "+9647700000000",
  "features": {
     "beta_reports": true
  }
}`}
        />
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 flex items-center justify-center text-sm">3</span>
          Support
        </h2>
        <Endpoint 
          method="POST"
          url="/api/support/request"
          description="Submit a support ticket directly from the POS."
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
      </section>
    </div>
  );
};

export default ApiDocs;
