import React from 'react';
import { Search, X } from 'lucide-react';
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] p-4 mb-10 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-center">
                {/* Search Input */}
                <div className="relative flex-1 group w-full">
                    <Search
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors"
                        size={18}
                    />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by clinic name, email, or digital ID..."
                        className="w-full pl-11 pr-12 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 rounded-2xl transition-all font-medium"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                        >
                            <X size={14} className="text-slate-500" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Status Filter */}
                    {!hideStatusFilter && (
                        <div className="relative flex-1 md:flex-none">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="w-full md:w-48 pl-5 pr-10 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl font-bold text-xs uppercase tracking-widest text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/20 appearance-none bg-no-repeat"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                                    backgroundSize: '1rem',
                                    backgroundPosition: 'right 1.25rem center'
                                }}
                            >
                                <option value="ALL">All States</option>
                                <option value={RegistrationStatus.PENDING}>Pending</option>
                                <option value={RegistrationStatus.APPROVED}>Approved</option>
                                <option value={RegistrationStatus.SUSPENDED}>Suspended</option>
                                <option value={RegistrationStatus.REJECTED}>Rejected</option>
                            </select>
                        </div>
                    )}

                    {/* Clear Button */}
                    {hasActiveFilters && (
                        <button
                            onClick={() => {
                                setSearch('');
                                if (!hideStatusFilter) setStatusFilter('ALL');
                            }}
                            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 hover:bg-rose-100 transition-all font-bold text-xs uppercase tracking-widest border border-rose-100 dark:border-rose-900/30"
                        >
                            <X size={16} />
                            <span>Reset</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Subtle Footer Info */}
            <div className="mt-4 px-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                        {filteredCount} Active Records Segmented
                    </span>
                </div>
                {filteredCount !== totalCount && (
                    <span className="text-[11px] font-medium text-slate-500">
                        Filtering from {totalCount} total nodes
                    </span>
                )}
            </div>
        </div>
    );
};

export default ClinicFilters;
