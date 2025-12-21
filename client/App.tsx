import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Licenses from './pages/Licenses';
import Plans from './pages/Plans';
import Currencies from './pages/Currencies';
import Updates from './pages/Updates';
import Support from './pages/Support';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import ApiDocs from './pages/ApiDocs';
import Team from './pages/Team';
import AuditLogs from './pages/AuditLogs';
import Financials from './pages/Financials';
import Login from './pages/Login';
import Clinics from './pages/Clinics';
import ClinicMessages from './pages/ClinicMessages';
import ClinicDashboard from './pages/ClinicDashboard';
import SupportMessages from './pages/SupportMessages';
import { useTranslation } from './hooks/useTranslation';
import { User } from './types';
import { api } from './services/api';
import { AutoRefreshProvider } from './hooks/useAutoRefresh';
import { SystemProvider, useSystem } from './context/SystemContext';

// --- Color Utility Functions ---
const hexToRgb = (hex: string): string | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ?
    `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
    : null;
}

const updateThemeColors = (hex: string) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return;

  const root = document.documentElement;
  const [r, g, b] = rgb.split(' ').map(Number);

  const darken = (amount: number) => {
    return `${Math.max(0, r - amount)} ${Math.max(0, g - amount)} ${Math.max(0, b - amount)}`;
  };
  const lighten = (amount: number) => {
    return `${Math.min(255, r + amount)} ${Math.min(255, g + amount)} ${Math.min(255, b + amount)}`;
  };

  root.style.setProperty('--color-primary-50', lighten(200));
  root.style.setProperty('--color-primary-100', lighten(180));
  root.style.setProperty('--color-primary-200', lighten(150));
  root.style.setProperty('--color-primary-300', lighten(100));
  root.style.setProperty('--color-primary-400', lighten(50));
  root.style.setProperty('--color-primary-500', rgb); // Base
  root.style.setProperty('--color-primary-600', darken(30));
  root.style.setProperty('--color-primary-700', darken(60));
  root.style.setProperty('--color-primary-800', darken(90));
  root.style.setProperty('--color-primary-900', darken(120));
  root.style.setProperty('--color-primary-950', darken(140));
};


function AppContent() {
  const { i18n } = useTranslation();
  const [currentPage, setPage] = useState('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);
  const { product } = useSystem();

  const requestRefresh = useCallback(() => {
    setRefreshTick((tick) => tick + 1);
  }, []);

  // Sync System Color
  useEffect(() => {
    if (product === 'POS') {
      updateThemeColors('#3b82f6'); // Blue
    } else {
      updateThemeColors('#10b981'); // Emerald
    }
  }, [product]);

  // Initialize System Settings
  useEffect(() => {
    const load = async () => {
      try {
        const me = await api.me();
        setUser(me);
        const settings = await api.getSettings().catch(() => null);
        // Only if not overridden by system context default? 
        // Actually SystemContext takes precedence for the "Theme" logic here as per requirement.
        // But if user set a BRANDING color in settings?
        // Prompt says "When changing system, theme color must change".
        // So I'll stick to the effect above.
      } catch {
        // not logged in
      } finally {
        setLoadingUser(false);
      }
    };
    load();
  }, []);

  // Apply Dark Mode Class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setRefreshTick((tick) => tick + 1);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Sync default page with current system (POS vs CLINIC)
  useEffect(() => {
    if (product === 'CLINIC' && currentPage === 'dashboard') {
      setPage('clinic-dashboard');
    }
    if (product === 'POS' && currentPage === 'clinic-dashboard') {
      setPage('dashboard');
    }
  }, [product, currentPage]);

  useEffect(() => {
    const handleFocus = () => setRefreshTick((tick) => tick + 1);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        handleFocus();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center transition-colors">
        <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 animate-bounce shadow-lg shadow-sky-500/20">
          <LoaderIcon />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight animate-pulse">
          SOURCE<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-500">PLUS</span>
        </h1>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const renderPage = () => {
    if (user.role === 'developer') {
      if (['team', 'financials'].includes(currentPage)) {
        return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Access Restricted</div>;
      }
    }

    if (['clinic-dashboard', 'clinics', 'manage-clinics', 'clinic-messages', 'support-messages'].includes(currentPage) && user.role !== 'admin') {
      return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Access Restricted</div>;
    }

    switch (currentPage) {
      case 'dashboard': return <Dashboard currentLang={i18n.language} setPage={setPage} />;
      case 'clinic-dashboard': return <ClinicDashboard setPage={setPage} />;
      case 'licenses': return <Licenses currentLang={i18n.language} />;
      case 'plans': return <Plans currentLang={i18n.language} />;
      case 'financials': return <Financials currentLang={i18n.language} />;
      case 'updates': return <Updates currentLang={i18n.language} />;
      case 'notifications': return <Notifications currentLang={i18n.language} />;
      case 'updates': return <Updates currentLang={i18n.language} />;
      case 'notifications': return <Notifications currentLang={i18n.language} />;
      case 'support': return <Support currentLang={i18n.language} />;
      case 'currencies': return <Currencies currentLang={i18n.language} />;
      case 'config': return <Settings currentLang={i18n.language} onThemeChange={updateThemeColors} />;
      case 'team': return <Team currentLang={i18n.language} />;
      case 'api': return <ApiDocs currentLang={i18n.language} />;
      case 'audit-logs': return <AuditLogs currentLang={i18n.language} />;
      case 'clinics': return <Clinics viewMode="requests" />;
      case 'manage-clinics': return <Clinics viewMode="manage" />;
      case 'clinic-messages': return <ClinicMessages />;
      case 'support-messages': return <SupportMessages />;
      default: return product === 'CLINIC'
        ? <ClinicDashboard setPage={setPage} />
        : <Dashboard currentLang={i18n.language} setPage={setPage} />;
    }
  };
  return (
    <AutoRefreshProvider tick={refreshTick} requestRefresh={requestRefresh}>
      <Layout
        currentPage={currentPage}
        setPage={setPage}
        user={user}
        onLogout={() => {
          api.logout();
          setUser(null);
        }}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      >
        {renderPage()}
      </Layout>
    </AutoRefreshProvider>
  );
}

const LoaderIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-white"
  >
    <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
    <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
    <line x1="6" x2="6.01" y1="6" y2="6" />
    <line x1="6" x2="6.01" y1="18" y2="18" />
  </svg>
);

function App() {
  return (
    <SystemProvider>
      <AppContent />
    </SystemProvider>
  );
}

export default App;
