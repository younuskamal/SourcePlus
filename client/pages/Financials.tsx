
import React, { useState, useEffect } from 'react';
import { exportToExcel } from '../utils/excelExport';
import { translations, Language } from '../locales';
import { Transaction } from '../types';
import {
    TrendingUp,
    DollarSign,
    Calendar,
    Download,
    FileText,
    Search,
    Wallet,
    ArrowUpRight,
    CreditCard
} from 'lucide-react';
import { api } from '../services/api';

interface FinancialsProps {
    currentLang: Language;
}

const Financials: React.FC<FinancialsProps> = ({ currentLang }) => {
    const t = translations[currentLang];
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<any>({ totalRevenue: 0, dailyRevenue: 0, monthlyRevenue: 0 });
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('ALL');

    useEffect(() => {
        const load = async () => {
            setTransactions(await api.getTransactions());
            setStats(await api.getFinancialStats());
        };
        load();
    }, []);

    const handleExport = () => {
        const data = transactions.map(tx => ({
            "ID": tx.id,
            "Date": new Date(tx.date).toLocaleDateString(),
            "Customer": tx.customerName,
            "Plan": tx.planName,
            "Type": tx.type,
            "Amount": tx.amount,
            "Status": tx.status,
            "Reference": tx.reference || ''
        }));
        exportToExcel(data, `financial_report_${new Date().toISOString().split('T')[0]}`, "Financials");
    };

    const filteredTransactions = transactions.filter(tx => {
        const matchesSearch = tx.customerName.toLowerCase().includes(search.toLowerCase()) ||
            tx.planName.toLowerCase().includes(search.toLowerCase()) ||
            (tx.reference && tx.reference.toLowerCase().includes(search.toLowerCase()));
        const matchesFilter = filterType === 'ALL' || tx.type === filterType;
        return matchesSearch && matchesFilter;
    });

    const netProfit = stats.totalRevenue * 0.85;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <DollarSign className="text-primary-600" size={32} />
                        {t.financials}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Detailed revenue tracking and transaction history.
                    </p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-lg shadow-primary-600/20 transition-all font-bold text-sm"
                >
                    <Download size={18} /> {t.exportCsv}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden group">
                    <div className="absolute right-[-20px] top-[-20px] opacity-10 transform rotate-12 transition-transform group-hover:scale-110">
                        <DollarSign size={140} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-xs font-bold text-indigo-100 uppercase tracking-wider mb-2">{t.totalRevenue}</p>
                        <h3 className="text-3xl font-extrabold">${stats.totalRevenue.toLocaleString()}</h3>
                        <div className="flex items-center gap-1 mt-3 text-indigo-100 text-sm font-medium bg-white/10 w-fit px-2 py-1 rounded-lg backdrop-blur-sm">
                            <TrendingUp size={14} /> +12% growth
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start">
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.monthlyRevenue}</p>
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600"><Calendar size={18} /></div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">${stats.monthlyRevenue.toLocaleString()}</h3>
                        <p className="text-xs text-slate-400 mt-1">Current Month</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start">
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.dailyRevenue}</p>
                            <div className="p-2 bg-sky-50 dark:bg-sky-900/30 rounded-lg text-sky-600"><ArrowUpRight size={18} /></div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">${stats.dailyRevenue.toLocaleString()}</h3>
                        <p className="text-xs text-slate-400 mt-1">{new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start">
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.netProfit}</p>
                            <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-amber-600"><Wallet size={18} /></div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">${netProfit.toLocaleString()}</h3>
                        <p className="text-xs text-slate-400 mt-1">~85% Margin</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <FileText size={16} className="text-slate-400" /> {t.transactions}
                        </h2>
                        <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300 font-bold">{filteredTransactions.length}</span>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search invoices..."
                                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="pl-3 pr-8 py-2 text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer bg-white dark:bg-slate-800"
                        >
                            <option value="ALL">All Types</option>
                            <option value="purchase">Purchase</option>
                            <option value="renewal">Renewal</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-700 tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Reference</th>
                                <th className="px-6 py-4">Customer / Plan</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-right">Invoice</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {filteredTransactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-mono text-xs font-bold text-slate-500">{tx.reference || 'N/A'}</div>
                                        <div className="text-[10px] text-slate-400">{tx.id.substring(0, 8)}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900 dark:text-white">{tx.customerName}</div>
                                        <div className="text-xs text-primary-600 dark:text-primary-400">{tx.planName}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-slate-400" />
                                            {new Date(tx.date).toLocaleDateString()}
                                        </div>
                                        <div className="text-[10px] text-slate-400 pl-6">{new Date(tx.date).toLocaleTimeString()}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${tx.type === 'purchase' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                tx.type === 'renewal' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                    'bg-slate-100 text-slate-600'
                                            }`}>
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="font-mono font-bold text-slate-900 dark:text-white">${tx.amount.toFixed(2)}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-slate-400 hover:text-primary-600 transition-colors p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                                            <FileText size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredTransactions.length === 0 && (
                        <div className="p-8 text-center text-slate-400 text-sm">No transactions found matching your criteria.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Financials;
