import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { RegistrationStatus } from '../../types';

interface ClinicFiltersProps {
    search: string;
    setSearch: (value: string) => void;
    statusFilter: RegistrationStatus | 'ALL';
    setStatusFilter: (value: RegistrationStatus | 'ALL') => void;
    totalCount: number;
    filteredCount: number;
}

const ClinicFilters: React.FC<ClinicFiltersProps> = ({
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    totalCount,
    filteredCount
}) => {
    return (
        <div className="mb-6 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap gap-3">
                {/* Search */}
                <div className="flex-1 min-w-[300px]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, email, phone, or address..."
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all"
                        />
                    </div>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                    <Filter size={20} className="text-slate-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all cursor-pointer"
                    >
                        <option value="ALL">All Status</option>
                        <option value={RegistrationStatus.PENDING}>Pending</option>
                        <option value={RegistrationStatus.APPROVED}>Approved</option>
                        <option value={RegistrationStatus.SUSPENDED}>Suspended</option>
                        <option value={RegistrationStatus.REJECTED}>Rejected</option>
                    </select>
                </div>

                {/* Clear Filters */}
                {(search || statusFilter !== 'ALL') && (
                    <button
                        onClick={() => {
                            setSearch('');
                            setStatusFilter('ALL');
                        }}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all flex items-center gap-2"
                    >
                        <X size={16} />
                        <span>Clear</span>
                    </button>
                )}
            </div>

            {/* Results Count */}
            <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Showing <span className="font-semibold text-purple-600 dark:text-purple-400">{filteredCount}</span> of {totalCount} clinics
            </div>
        </div>
    );
};

export default ClinicFilters;
