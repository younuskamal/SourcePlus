import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import {
  Lock,
  Mail,
  ArrowRight,
  Server,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Code2,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<
    'checking' | 'online' | 'offline'
  >('checking');
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    // Check for saved email preference (purely for UI convenience, not auth)
    const savedEmail = localStorage.getItem('sourceplus_email_pref');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    } else {
      setEmail('admin@sourceplus.com'); // Default fallback
    }

    let cancelled = false;
    const pingServer = async () => {
      try {
        const started = performance.now();
        await api.ping();
        if (cancelled) return;
        setLatency(Math.round(performance.now() - started));
        setServerStatus('online');
      } catch {
        if (!cancelled) setServerStatus('offline');
      }
    };
    pingServer();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError('');

      // Save email preference if remember me is checked
      if (rememberMe) {
        localStorage.setItem('sourceplus_email_pref', email);
      } else {
        localStorage.removeItem('sourceplus_email_pref');
      }

      // Pass rememberMe to API to decide storage (local vs session)
      const user = await api.login(email, password, rememberMe);
      onLogin(user as unknown as User);
    } catch (err: any) {
      setError(err?.message || t('login.invalidCredentials'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors relative overflow-hidden" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-sky-500/10 blur-3xl animate-pulse" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-md w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden relative z-10 animate-in zoom-in-95 duration-500">

        {/* Header */}
        <div className="bg-slate-900/5 dark:bg-slate-950/30 p-8 text-center border-b border-slate-100 dark:border-slate-700/50">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg shadow-sky-500/20 transform hover:scale-105 transition-transform duration-300">
              <Server size={40} strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              SOURCE<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-500">PLUS</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">{t('messages.description')}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="text-center mb-2">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t('login.title')}</h2>
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-xl text-sm flex items-center gap-3 border border-rose-100 dark:border-rose-900/50 animate-in slide-in-from-top-2">
              <AlertCircle size={18} className="flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('login.email')}</label>
              <div className="relative group">
                <div className={`absolute inset-y-0 ${i18n.language === 'ar' ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                  <Mail className="text-slate-400 group-focus-within:text-sky-500 transition-colors" size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  className={`w-full py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all ${i18n.language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('login.password')}</label>
              <div className="relative group">
                <div className={`absolute inset-y-0 ${i18n.language === 'ar' ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                  <Lock className="text-slate-400 group-focus-within:text-sky-500 transition-colors" size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all ${i18n.language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${rememberMe ? 'bg-sky-500 border-sky-500' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`}>
                {rememberMe && <CheckCircle2 size={14} className="text-white" />}
              </div>
              <input
                type="checkbox"
                className="hidden"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors select-none">
                {t('login.rememberMe')}
              </span>
            </label>
            <a href="#" className="text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors">
              {t('login.forgotPassword')}
            </a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-600/20 hover:shadow-sky-600/30 active:scale-[0.98] disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>{t('common.loading')}</span>
              </>
            ) : (
              <>
                <span>{t('login.button')}</span>
                {i18n.language === 'ar' ? <ArrowRight size={20} className="rotate-180" /> : <ArrowRight size={20} />}
              </>
            )}
          </button>

          {/* Server Status & Info */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              {serverStatus === 'online' && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
              {serverStatus === 'checking' && <Loader2 className="text-sky-500 animate-spin" size={12} />}
              {serverStatus === 'offline' && <div className="w-2 h-2 rounded-full bg-rose-500" />}

              <span className="font-medium">
                {serverStatus === 'online' ? 'System Operational' : serverStatus === 'checking' ? 'Connecting...' : 'System Offline'}
              </span>
              {latency !== null && serverStatus === 'online' && (
                <span className="ml-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono">
                  {latency}ms
                </span>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex items-center gap-1" title="Admin Access">
                <ShieldCheck size={12} /> Admin
              </div>
              <div className="flex items-center gap-1" title="Developer Access">
                <Code2 size={12} /> Dev
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-center w-full text-xs text-slate-400 dark:text-slate-500">
        &copy; {new Date().getFullYear()} SourcePlus Licensing System. All rights reserved.
      </div>
    </div>
  );
};

export default Login;
