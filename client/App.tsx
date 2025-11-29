
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
import Financials from './pages/Financials'; // New
import Login from './pages/Login';
import { Language } from './locales';
import { User } from './types';
import { api } from './services/api';
import { AutoRefreshProvider } from './hooks/useAutoRefresh';

// --- Color Utility Functions ---
const hexToRgb = (hex: string): string | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ?
    `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
    : null;
}

const updateThemeColors = (hex: string) => {
  // Basic logic to generate palette from single color
  // In a real app we might use a library like 'chroma-js' or 'tinycolor2'
  // Here we will use simple CSS variable manipulation assuming the user provides a good middle color (500)

  // We can't easily generate exact Tailwind shades purely with math without HSLA conversion,
  // but for "Branding" we usually just want the primary color to be what the user picked.
  // We will set the 500 shade to the user's color, and then tint/shade the others via opacity overlay or simple math.
  // A robust way without libs: use the provided hex as base, and use CSS `color-mix` or just set the main variables.

  const rgb = hexToRgb(hex);
  if (!rgb) return;

  const root = document.documentElement;
  // We will set all shades to the same base hue, but with varying lightness is hard without HSL.
  // WORKAROUND: We will set the 500 to the brand color.
  // For a truly "Smooth" experience requested by user, we should calculate shades.
  // Let's assume the user picks the "500" value.

  // Simplistic generation:
  root.style.setProperty('--color-primary-500', rgb);

  // We can't easily darken/lighten RGB string "r g b" without parsing.
  // However, tailwind opacity works by `rgb(var(...) / opacity)`. 
  // This doesn't help with making 900 darker than 500 if the base is 500.

  // Better approach: Since we don't have a color lib, we will stick to the 500 value for most things,
  // and for the sake of the demo, we will apply the *same* hue to 600/700 but maybe keep them slightly different if possible?
  // Actually, let's just use the user color for 500, 600, 700 to ensure branding matches.
  // And for 50/100 (backgrounds), we use the same RGB but standard Tailwind opacity handles the transparency which simulates lightness on white bg.

  // Set ALL primary variables to this RGB. Tailwind's opacity modifier will handle the "lighter" look for backgrounds.
  // For darker shades (hover states), this approach makes them just transparent which is wrong.
  // To do this properly in pure JS without libs:

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


function App() {
  const [lang, setLang] = useState<Language>('en');
  const [currentPage, setPage] = useState('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  const requestRefresh = useCallback(() => {
    setRefreshTick((tick) => tick + 1);
  }, []);

  // Initialize System Settings
  useEffect(() => {
    const load = async () => {
      try {
        const me = await api.me();
        setUser(me);
        const settings = await api.getSettings().catch(() => null);
        if (settings && (settings as any).primaryColor) {
          updateThemeColors((settings as any).primaryColor as string);
        }
      } catch {
        // not logged in
      } finally {
        setLoadingUser(false);
      }
    };
    load();
  }, []); // Run once on mount

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

  // Helper to trigger branding update when settings change
  // We can expose this via Context, but for this structure we'll just rely on the Settings page triggering a re-render or callback if needed.
  // Actually, since backend is a singleton, we can just poll or listen. 
  // For now, let's update it whenever the page changes to 'config' or we can add a listener.
  // A simple way: pass a callback to Settings.
  const handleThemeChange = (hex: string) => {
    updateThemeColors(hex);
  }

  if (loadingUser || !user) {
    return <Login onLogin={setUser} currentLang={lang} />;
  }

  const renderPage = () => {
    // Role-based Access Control
    if (user.role === 'developer') {
      // Developer has access to everything EXCEPT:
      // - Team Management (maybe sensitive)
      // - Financials (sensitive)
      if (['team', 'financials'].includes(currentPage)) {
        return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Access Restricted</div>;
      }
    }

    switch (currentPage) {
      case 'dashboard': return <Dashboard currentLang={lang} setPage={setPage} />;
      case 'licenses': return <Licenses currentLang={lang} />;
      case 'plans': return <Plans currentLang={lang} />;
      case 'financials': return <Financials currentLang={lang} />;
      case 'updates': return <Updates currentLang={lang} />;
      case 'notifications': return <Notifications currentLang={lang} />;
      case 'support': return <Support currentLang={lang} />;
      case 'currencies': return <Currencies currentLang={lang} />;
      case 'config': return <Settings currentLang={lang} onThemeChange={handleThemeChange} />;
      case 'team': return <Team currentLang={lang} />;
      case 'api': return <ApiDocs currentLang={lang} />;
      case 'audit-logs': return <AuditLogs currentLang={lang} />;
      default: return <Dashboard currentLang={lang} setPage={setPage} />;
    }
  };

  return (
    <AutoRefreshProvider tick={refreshTick} requestRefresh={requestRefresh}>
      <Layout
        currentLang={lang}
        setLang={setLang}
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

export default App;
