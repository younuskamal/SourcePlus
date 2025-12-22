import React from 'react';
import { Search, Filter, X, TrendingUp } from 'lucide-react';
import { RegistrationStatus } from '../../types';

interface ClinicFiltersProps {
    search: string;
    setSearch: (value: string) => void;
    statusFilter: RegistrationStatus | 'ALL';
    setStatusFilter: (value: RegistrationStatus | 'ALL') => void;
    totalCount: number;
    filteredCount: number;
    hideStatusFilter?: boolean; // Hide status filter (for Requests page)
}

const ClinicFilters: React.FC<ClinicFiltersProps> = ({
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    totalCount,
    filteredCount,
    hideStatusFilter = false
}) => {
    const hasActiveFilters = search.trim() !== '' || (!hideStatusFilter && statusFilter !== 'ALL');

    return (
        <div className="glass-card p-5 mb-6">
            <div className="flex flex-wrap gap-3 items-center">
                {/* Search Input */}
                <div className="flex-1 min-w-[280px]">
                    <div className="relative group">
                        <Search
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors"
                            size={20}
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search clinics by name, email, phone, or address..."
                            className="glass-input w-full pl-11 pr-4 py-3 bg-white/30 dark:bg-slate-800/20 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-medium"
                        />
                        {/* Clear Search Button */}
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-90"
                            >
                                <X size={16} className="text-slate-500" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Status Filter */}
                {!hideStatusFilter && (
                    <div className="flex items-center gap-2 group">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="glass-input px-6 py-3 bg-white/30 dark:bg-slate-800/20 font-black uppercase text-[10px] tracking-widest text-slate-600 dark:text-slate-300 cursor-pointer focus:outline-none appearance-none bg-right bg-no-repeat pr-12 hover:bg-white/50 dark:hover:bg-slate-800/40 transition-all"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                                backgroundSize: '1rem',
                                backgroundPosition: 'right 1rem center'
                            }}
                        >
                            <option value="ALL">All Status</option>
                            <option value={RegistrationStatus.PENDING}>⏳ Pending</option>
                            <option value={RegistrationStatus.APPROVED}>✅ Approved</option>
                            <option value={RegistrationStatus.SUSPENDED}>🚫 Suspended</option>
                            <option value={RegistrationStatus.REJECTED}>❌ Rejected</option>
                        </select>
                    </div>
                )}

                {/* Clear All Filters Button */}
                {hasActiveFilters && (
                    <button
                        onClick={() => {
                            setSearch('');
                            if (!hideStatusFilter) {
                                setStatusFilter('ALL');
                            }
                        }}
                        className="glass-button px-4 py-3 flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-medium"
                    >
                        <X size={18} />
                        <span className="hidden sm:inline">Clear Filters</span>
                    </button>
                )}
            </div>

            {/* Results Count with Animation */}
            <div className="mt-4 flex items-center gap-2 text-sm">
                <TrendingUp size={16} className="text-primary-500" />
                <span className="text-slate-600 dark:text-slate-300">
                    Showing{' '}
                    <span className="font-bold text-primary-600 dark:text-primary-400 transition-all">
                        {filteredCount}
                    </span>
                    {filteredCount !== totalCount && (
                        <>
                            {' '}of{' '}
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {totalCount}
                            </span>
                        </>
                    )}
                    {' '}clinic{filteredCount !== 1 ? 's' : ''}
                </span>
                {hasActiveFilters && (
                    <span className="ml-2 px-2 py-0.5 glass-badge text-primary-600 dark:text-primary-400">
                        Filtered
                    </span>
                )}
            </div>
        </div>
    );
};

export default ClinicFilters;

