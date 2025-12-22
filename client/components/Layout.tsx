
import React, { useState } from 'react';
import {
  LayoutDashboard,
  Key,
  CreditCard,
  LifeBuoy,
  Coins,
  LogOut,
  Menu,
  X,
  Code2,
  Settings,
  Users,
  Bell,
  Moon,
  Sun,
  ClipboardList,
  Monitor,
  PieChart,
  ServerCog,
  Stethoscope,
  MessageSquare
} from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { User } from '../types';
import SystemSwitcher from './SystemSwitcher';
import { useSystem } from '../context/SystemContext';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  setPage: (page: string) => void;
  user: User;
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (isDark: boolean) => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  currentPage,
  setPage,
  user,
  onLogout,
  darkMode,
  setDarkMode
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const { product } = useSystem();
  const isRtl = i18n.language === 'ar';

  const posMenuItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, allowedRoles: ['admin', 'developer'] },
    { id: 'licenses', label: t('nav.licenses'), icon: Key, allowedRoles: ['admin', 'developer'] },
    { id: 'plans', label: t('nav.plans'), icon: CreditCard, allowedRoles: ['admin'] },
    { id: 'financials', label: t('nav.financials'), icon: PieChart, allowedRoles: ['admin'] },
    { id: 'updates', label: t('nav.updates'), icon: Monitor, allowedRoles: ['admin', 'developer'] },
    { id: 'notifications', label: t('nav.notifications'), icon: Bell, allowedRoles: ['admin', 'developer'] },
    { id: 'support', label: t('nav.support'), icon: LifeBuoy, allowedRoles: ['admin', 'developer'] },
    { id: 'currencies', label: t('nav.currencies'), icon: Coins, allowedRoles: ['admin'] },
    { id: 'api', label: t('nav.apiDocs'), icon: Code2, allowedRoles: ['admin', 'developer'] },
  ];


  const clinicMenuItems = [
    { id: 'clinic-dashboard', label: 'Clinic Dashboard', icon: LayoutDashboard, allowedRoles: ['admin'] },
    { id: 'clinics', label: t('nav.clinics'), icon: Stethoscope, allowedRoles: ['admin', 'developer'] },
    { id: 'manage-clinics', label: t('nav.manageClinics'), icon: LayoutDashboard, allowedRoles: ['admin'] },
    { id: 'support-messages', label: t('nav.supportMessages'), icon: MessageSquare, allowedRoles: ['admin'] },
    { id: 'api', label: t('nav.apiDocs'), icon: Code2, allowedRoles: ['admin', 'developer'] },
  ];


  const mainMenuItems = product === 'POS' ? posMenuItems : clinicMenuItems;

  const systemMenuItems = [
    { id: 'team', label: t('nav.team'), icon: Users, allowedRoles: ['admin'] },
    { id: 'config', label: t('nav.settings'), icon: Settings, allowedRoles: ['admin', 'developer'] },
    { id: 'audit-logs', label: t('nav.auditLogs'), icon: ClipboardList, allowedRoles: ['admin'] },
  ];

  const filteredMainMenu = mainMenuItems.filter(item => item.allowedRoles.includes(user.role));
  const filteredSystemMenu = systemMenuItems.filter(item => item.allowedRoles.includes(user.role));

  return (
    <div className={`h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 flex ${isRtl ? 'rtl' : 'ltr'} transition-colors duration-300`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 ${isRtl ? 'right-0' : 'left-0'} z-30 w-full sm:w-72 lg:w-64 bg-slate-900 dark:bg-slate-950 text-white transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : (isRtl ? 'translate-x-full' : '-translate-x-full')}
        lg:translate-x-0 lg:static lg:block border-r border-slate-800 dark:border-slate-800 shadow-xl
        flex flex-col h-full
      `}>
        <div className="h-20 flex items-center px-6 border-b border-slate-800/50 bg-slate-950/20 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-white shadow-lg">
              <Stethoscope size={18} />
            </div>
            <h1 className="text-xl font-black tracking-tight text-white uppercase">
              Smart<span className="text-primary-500">Clinic</span>
            </h1>
          </div>
        </div>

        {/* Navigation Area */}
        <nav className="flex-1 p-3 space-y-6 overflow-y-auto custom-scrollbar">



          <div className="space-y-0.5">
            {filteredMainMenu.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setPage(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${currentPage === item.id
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/50'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <item.icon size={18} className={`transition-transform duration-200 ${currentPage === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* System Tools Section at Bottom */}
        <div className="bg-slate-950/50 p-3 border-t border-slate-800 shrink-0">
          {filteredSystemMenu.length > 0 && (
            <div className="mb-4">
              <div className="px-3 mb-2 flex items-center gap-2">
                <ServerCog size={12} className="text-slate-500" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('common.actions')}</span>
              </div>
              <div className="space-y-0.5">
                {filteredSystemMenu.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setPage(item.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${currentPage === item.id
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                  >
                    <item.icon size={18} className={`transition-transform duration-200 ${currentPage === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2 border-t border-slate-800/50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center text-sm font-bold shadow-md">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-slate-400 truncate uppercase">{user.role}</p>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 text-rose-400 hover:bg-rose-950/30 rounded-md transition-colors"
              title={t('nav.logout')}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header */}
        <header className="h-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm z-10 transition-colors shrink-0">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Header Logo - Visible on all screens */}
            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-primary-500 shadow-sm group-hover:border-primary-500/50 transition-all">
                <Stethoscope size={22} strokeWidth={2} />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase">
                Smart<span className="text-primary-500 font-extrabold">Clinic</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <SystemSwitcher />

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'ar' : 'en')}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-black text-slate-900 dark:text-white transition-all shadow-sm"
            >
              {i18n.language.toUpperCase()}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 transition-colors">
          <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6 animate-in fade-in duration-300">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
