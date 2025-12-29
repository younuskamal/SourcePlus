
import React, { useState } from 'react';
import {
    LayoutDashboard,
    LogOut,
    Menu,
    X,
    Code2,
    Moon,
    Sun,
    Stethoscope,
    MessageSquare
} from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { User } from '../types';
import SystemSwitcher from './SystemSwitcher';

interface LayoutProps {
    children: React.ReactNode;
    currentPage: string;
    setPage: (page: string) => void;
    user: User;
    onLogout: () => void;
    darkMode: boolean;
    setDarkMode: (isDark: boolean) => void;
}

const ClinicLayout: React.FC<LayoutProps> = ({
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
    const isRtl = i18n.language === 'ar';

    const clinicMenuItems = [
        { id: 'clinic-dashboard', label: 'Dashboard', icon: LayoutDashboard, allowedRoles: ['admin'] },
        { id: 'clinics', label: t('nav.clinics'), icon: Stethoscope, allowedRoles: ['admin', 'developer'] },
        { id: 'manage-clinics', label: t('nav.manageClinics'), icon: LayoutDashboard, allowedRoles: ['admin'] },
        { id: 'support-messages', label: t('nav.supportMessages'), icon: MessageSquare, allowedRoles: ['admin'] },
        { id: 'api', label: t('nav.apiDocs'), icon: Code2, allowedRoles: ['admin', 'developer'] },
    ];

    const filteredMainMenu = clinicMenuItems.filter(item => item.allowedRoles.includes(user.role));

    return (
        <div className={`h-screen overflow-hidden bg-white dark:bg-slate-900 flex ${isRtl ? 'rtl' : 'ltr'} transition-colors`} dir={isRtl ? 'rtl' : 'ltr'}>
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Simplified */}
            <aside className={`
        fixed inset-y-0 ${isRtl ? 'right-0' : 'left-0'} z-30 w-full sm:w-64 bg-slate-900 text-white transform transition-transform duration-200
        ${isSidebarOpen ? 'translate-x-0' : (isRtl ? 'translate-x-full' : '-translate-x-full')}
        lg:translate-x-0 lg:static lg:block border-r border-slate-800
        flex flex-col h-full
      `}>
                <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-900">
                    <div className="flex items-center gap-2">
                        <Stethoscope size={20} className="text-emerald-500" />
                        <h1 className="text-lg font-bold text-white">
                            Clinic<span className="text-emerald-500">System</span>
                        </h1>
                    </div>
                </div>

                {/* Navigation Area */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {filteredMainMenu.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setPage(item.id);
                                setIsSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${currentPage === item.id
                                ? 'bg-emerald-600 text-white'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <item.icon size={18} />
                            <span className="text-sm">{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* User Footer */}
                <div className="bg-slate-900 p-4 border-t border-slate-800 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-bold text-white">
                            {user.name.charAt(0)}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-bold text-white truncate">{user.name}</p>
                            <p className="text-[10px] text-slate-400 truncate uppercase">{user.role}</p>
                        </div>
                        <button
                            onClick={onLogout}
                            className="p-1.5 text-slate-400 hover:text-white transition-colors"
                            title={t('nav.logout')}
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 h-full bg-slate-50 dark:bg-slate-900">
                {/* Header - Simple */}
                <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 sm:px-6 shadow-sm z-10">
                    <button
                        className="lg:hidden p-2 text-slate-600 dark:text-slate-300"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>

                    <div className="flex items-center gap-4 ml-auto">
                        <SystemSwitcher />

                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
                        >
                            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        <button
                            onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'ar' : 'en')}
                            className="px-2 py-1 text-xs font-bold border border-slate-300 dark:border-slate-600 rounded bg-transparent text-slate-700 dark:text-slate-300"
                        >
                            {i18n.language.toUpperCase()}
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-slate-900 dark:text-white">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default ClinicLayout;
