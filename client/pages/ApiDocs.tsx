import React, { useState } from 'react';
import { translations, Language } from '../locales';
import {
  Server, Shield, Globe, Terminal, Copy, Check,
  ChevronRight, ChevronDown, Code2, Database, Zap,
  CreditCard, Layout, Activity
} from 'lucide-react';

interface ApiDocsProps {
  currentLang: Language;
}

const LICENSING_BASE = 'https://sourceplus.onrender.com/api';
const AUTH_BASE = 'https://sourceplus.onrender.com/auth';

const CodeBlock: React.FC<{ children: string; language?: string }> = ({ children, language = 'json' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase">{language}</span>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
          title="Copy code"
        >
          {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed text-slate-700 dark:text-slate-300">
        <code>{children}</code>
      </pre>
    </div>
  );
};

const Endpoint: React.FC<{
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  title: string;
  description: string;
  payload?: string;
  response?: string;
  isRtl: boolean;
}> = ({ method, url, title, description, payload, response, isRtl }) => {
  const [expanded, setExpanded] = useState(false);

  const methodColors = {
    GET: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border-sky-200 dark:border-sky-800',
    POST: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    PUT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    DELETE: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    PATCH: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-violet-200 dark:border-violet-800',
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm transition-all duration-200 hover:shadow-md">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-4 overflow-hidden">
          <span className={`flex-shrink-0 px-2.5 py-1 rounded-md text-[10px] font-bold border ${methodColors[method]}`}>
            {method}
          </span>
          <code className="text-sm font-mono font-bold text-slate-700 dark:text-slate-200 truncate">
            {url}
          </code>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">{title}</span>
          {expanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className={isRtl ? "rotate-180 text-slate-400" : "text-slate-400"} />}
        </div>
      </button>

      {expanded && (
        <div className="p-6 border-t border-slate-100 dark:border-slate-700 space-y-6 animate-in slide-in-from-top-2 duration-200">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {description}
          </p>

          {payload && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Terminal size={12} /> Request Body
              </h4>
              <CodeBlock>{payload}</CodeBlock>
            </div>
          )}

          {response && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Code2 size={12} /> Response
              </h4>
              <CodeBlock>{response}</CodeBlock>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SectionHeader: React.FC<{ title: string; icon: any; description: string }> = ({ title, icon: Icon, description }) => (
  <div className="mb-6">
    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
      <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
        <Icon size={20} />
      </div>
      {title}
    </h2>
    <p className="text-sm text-slate-500 dark:text-slate-400 ml-11">
      {description}
    </p>
  </div>
);

const ApiDocs: React.FC<ApiDocsProps> = ({ currentLang }) => {
  const t = translations[currentLang];
  const isRtl = currentLang === 'ar';

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-12" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Header */}
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 text-white shadow-lg shadow-primary-500/20 mb-4">
          <Server size={32} />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t.apiDocs}
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Comprehensive guide to integrating your applications with the SourcePlus Licensing System.
        </p>
      </div>

      {/* Quick Info Cards */}
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
            <span className="text-xs font-bold uppercase tracking-wider">Status</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">Operational</span>
          </div>
        </div>
      </div>

      {/* Authentication Section */}
      <section>
        <SectionHeader
          title="Authentication"
          icon={Shield}
          description="Manage user sessions and obtain access tokens."
        />
        <div className="space-y-4">
          <Endpoint
            isRtl={isRtl}
            method="POST"
            url="/login"
            title="User Login"
            description="Authenticate a user to receive access and refresh tokens."
            payload={`{
  "email": "admin@sourceplus.com",
  "password": "your_password"
}`}
            response={`{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "cl...",
    "email": "admin@sourceplus.com",
    "role": "admin"
  }
}`}
          />
          <Endpoint
            isRtl={isRtl}
            method="POST"
            url="/refresh"
            title="Refresh Token"
            description="Obtain a new access token using a valid refresh token."
            payload={`{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}`}
            response={`{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}`}
          />
        </div>
      </section>

      {/* Plans Section */}
      <section>
        <SectionHeader
          title="Subscription Plans"
          icon={CreditCard}
          description="Retrieve available subscription plans for your application."
        />
        <div className="space-y-4">
          <Endpoint
            isRtl={isRtl}
            method="GET"
            url="/api/plans"
            title="List Active Plans"
            description="Fetch a list of all active subscription plans to display in your application's pricing page."
            response={`{
  "plans": [
    {
      "id": "cl...",
      "name": "Professional Plan",
      "price_monthly": 35000,
      "price_yearly": 350000,
      "currency": "IQD",
      "features": {
        "pos": true,
        "inventory": true
      },
      "limits": {
        "maxUsers": 5
      },
      "is_active": true
    }
  ]
}`}
          />
        </div>
      </section>

      {/* Licensing Section */}
      <section>
        <SectionHeader
          title="Licensing & Activation"
          icon={Zap}
          description="Validate serial keys and activate devices."
        />
        <div className="space-y-4">
          <Endpoint
            isRtl={isRtl}
            method="POST"
            url="/api/license/validate"
            title="Validate Serial"
            description="Check if a serial key is valid and available. Does not bind the device."
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
            isRtl={isRtl}
            method="POST"
            url="/api/license/activate"
            title="Activate Device"
            description="Bind a serial key to a specific device (Hardware ID)."
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
            isRtl={isRtl}
            method="GET"
            url="/api/subscription/status"
            title="Check Status"
            description="Verify the current subscription status. Call this on app startup."
            response={`{
  "status": "active",
  "remainingDays": 120,
  "forceLogout": false
}`}
          />
        </div>
      </section>

      {/* System Section */}
      <section>
        <SectionHeader
          title="System & Config"
          icon={Database}
          description="Remote configuration and updates."
        />
        <div className="space-y-4">
          <Endpoint
            isRtl={isRtl}
            method="GET"
            url="/api/app/update"
            title="Check for Updates"
            description="Check if a new version of the application is available."
            response={`{
  "hasUpdate": true,
  "version": "1.1.0",
  "downloadUrl": "https://cdn.sourceplus.com/v1.1.0.exe",
  "releaseNotes": "Fixed receipt printing bug.",
  "forceUpdate": false
}`}
          />
          <Endpoint
            isRtl={isRtl}
            method="GET"
            url="/api/config/sync"
            title="Sync Configuration"
            description="Fetch remote configuration settings (feature flags, support info)."
            response={`{
  "maintenance_mode": false,
  "support_phone": "+9647700000000",
  "features": {
     "beta_reports": true
  }
}`}
          />
        </div>
      </section>

    </div>
  );
};

export default ApiDocs;
