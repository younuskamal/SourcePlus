
import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { translations, Language } from '../locales';
import {
  Lock,
  Mail,
  ArrowRight,
  Server,
  AlertCircle,
  Loader2,
  CheckCircle2,
  WifiOff
} from 'lucide-react';
import { api } from '../services/api';

interface LoginProps {
  onLogin: (user: User) => void;
  currentLang: Language;
}

const Login: React.FC<LoginProps> = ({ onLogin, currentLang }) => {
  const t = translations[currentLang];
  const [email, setEmail] = useState('admin@sourceplus.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<
    'checking' | 'online' | 'offline'
  >('checking');
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
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
      const user = await api.login(email, password);
      onLogin(user as unknown as User);
    } catch (err: any) {
      setError(err?.message || t.loginError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors" dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="bg-slate-900 dark:bg-slate-950 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute right-[-20px] top-[-20px] w-32 h-32 rounded-full bg-sky-500 blur-3xl"></div>
            <div className="absolute left-[-20px] bottom-[-20px] w-32 h-32 rounded-full bg-indigo-500 blur-3xl"></div>
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 text-sky-400 border border-white/10 shadow-lg">
              <Server size={32} strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">SOURCE<span className="text-sky-400">PLUS</span></h1>
            <p className="text-slate-400 text-sm mt-2">{t.description}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white text-center">{t.loginTitle}</h2>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2 border border-rose-100 dark:border-rose-900">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t.email}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t.password}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              {serverStatus === 'online' && (
                <CheckCircle2 className="text-emerald-500" size={14} />
              )}
              {serverStatus === 'checking' && (
                <Loader2 className="text-sky-500 animate-spin" size={14} />
              )}
              {serverStatus === 'offline' && (
                <WifiOff className="text-rose-500" size={14} />
              )}
              <span>
                {serverStatus === 'online'
                  ? 'Server connected'
                  : serverStatus === 'checking'
                  ? 'Checking server...'
                  : 'Server offline'}
              </span>
            </div>
            {latency !== null && serverStatus === 'online' && (
              <span>{latency} ms</span>
            )}
          </div>

          <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-900/40 text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <p className="font-semibold mb-1">Default Admin</p>
            <p>admin@sourceplus.com / Admin12345</p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-400 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-sky-600/20 active:scale-[0.98] disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>{t.loginButton}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
