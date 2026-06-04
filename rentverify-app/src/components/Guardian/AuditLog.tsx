import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatDate, getStatusEmoji, calculateNights, formatRelativeTime } from '../../utils';
import type { Verification } from '../../types';

interface AuditLogProps {
  onNavigate: (route: string) => void;
  initialFilter?: string | null;
}

export const AuditLog: React.FC<AuditLogProps> = ({ onNavigate, initialFilter }) => {
  const { getAllAuditableVerifications, refreshData, connectionStatus } = useStore();
  const [filter, setFilter] = useState<'all' | 'approved' | 'rejected' | 'flagged'>(() => {
    if (initialFilter === 'approved' || initialFilter === 'rejected' || initialFilter === 'flagged') {
      return initialFilter;
    }
    return 'all';
  });
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const auditable = getAllAuditableVerifications();

  // Apply all filters with useMemo for performance
  const filtered = useMemo(() => {
    let results = [...auditable];

    // Status filter
    if (filter !== 'all') {
      results = results.filter((v: Verification) => v.status === filter);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      results = results.filter(
        (v: Verification) =>
          v.guestName.toLowerCase().includes(q) ||
          (v.guestPhone && v.guestPhone.includes(q)) ||
          v.refCode.toLowerCase().includes(q) ||
          (v.guestEmail && v.guestEmail.toLowerCase().includes(q))
      );
    }

    // Date range filter
    if (dateFrom) {
      const fromMs = new Date(dateFrom).getTime();
      results = results.filter((v) => {
        const ts = new Date(v.reviewedAt || v.submittedAt).getTime();
        return ts >= fromMs;
      });
    }
    if (dateTo) {
      const toMs = new Date(dateTo + 'T23:59:59').getTime();
      results = results.filter((v) => {
        const ts = new Date(v.reviewedAt || v.submittedAt).getTime();
        return ts <= toMs;
      });
    }

    return results;
  }, [auditable, filter, search, dateFrom, dateTo]);

  // Group by month key
  const grouped = useMemo(() => {
    const groups: Record<string, Verification[]> = {};
    filtered.forEach((v: Verification) => {
      const date = new Date(v.reviewedAt || v.submittedAt || Date.now());
      const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(v);
    });
    return groups;
  }, [filtered]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const clearDateFilter = () => {
    setDateFrom('');
    setDateTo('');
    setShowDateFilter(false);
  };

  const hasActiveFilters = filter !== 'all' || search.trim() || dateFrom || dateTo;

  // Calculate average response duration for audit item
  const formatResponseTime = (submitted: string, reviewed: string) => {
    const diffMs = new Date(reviewed).getTime() - new Date(submitted).getTime();
    if (diffMs < 0) return '—';
    const totalMinutes = Math.floor(diffMs / 60000);
    if (totalMinutes < 1) return '<1m';
    if (totalMinutes < 60) return `${totalMinutes}m`;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours < 24) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
  };

  const filterItems: { id: typeof filter; label: string; symbol: string }[] = [
    { id: 'all', label: 'All', symbol: 'list' },
    { id: 'approved', label: 'Approved', symbol: 'check_circle' },
    { id: 'rejected', label: 'Rejected', symbol: 'cancel' },
    { id: 'flagged', label: 'Flagged', symbol: 'warning' },
  ];

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-100 text-[#10b981]';
      case 'flagged': return 'bg-amber-100 text-on-tertiary-container';
      case 'rejected': return 'bg-error-container/20 text-error';
      default: return 'bg-outline-variant/30 text-on-surface-variant';
    }
  };

  const renderAvatar = (v: Verification) => {
    if (v.selfieData) {
      return (
        <img
          src={v.selfieData}
          alt={v.guestName}
          className="w-full h-full object-cover"
        />
      );
    }
    const initial = v.guestName ? v.guestName.charAt(0).toUpperCase() : '?';
    return (
      <div className="w-full h-full flex items-center justify-center bg-surface-variant text-on-surface-variant font-bold text-base">
        {initial}
      </div>
    );
  };

  return (
    <main className="max-w-xl mx-auto px-container-margin pt-4 pb-28">
      {/* Page Header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-outline-variant -mx-container-margin px-container-margin py-3.5 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-on-surface text-lg font-bold">Verification History</h1>
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-outline-variant/40 px-1.5 text-[10px] font-semibold text-on-surface-variant">
              {filtered.length}
            </span>
          </div>
          {/* Refresh + Status */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className={`block h-1.5 w-1.5 rounded-full ${
                connectionStatus === 'online' ? 'bg-[#10b981]' :
                connectionStatus === 'syncing' ? 'bg-amber-400 animate-pulse' :
                'bg-error'
              }`} />
              <span className="text-[9px] font-semibold text-on-surface-variant uppercase tracking-wider">
                {connectionStatus === 'online' ? 'Cloud' : connectionStatus === 'syncing' ? 'Sync' : 'Local'}
              </span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex size-8 items-center justify-center rounded-full hover:bg-surface-container-high transition-colors"
              title="Refresh from server"
            >
              <span className={`material-symbols-outlined text-secondary text-[20px] ${isRefreshing ? 'animate-spin' : ''}`}>
                refresh
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Sticky filters and search panel */}
      <div className="bg-surface sticky top-[53px] z-30 pt-1 pb-4 flex flex-col gap-3 -mx-container-margin px-container-margin border-b border-outline-variant/30">
        {/* Status Pills + Date Toggle */}
        <div className="flex items-center gap-1.5">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-1">
            {filterItems.map((item) => {
              const isActive = filter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all border ${
                    isActive 
                      ? 'bg-secondary border-secondary text-white shadow-sm' 
                      : 'bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {item.symbol}
                  </span>
                  {item.label}
                </button>
              );
            })}
          </div>
          {/* Date filter toggle button */}
          <button
            onClick={() => setShowDateFilter(!showDateFilter)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all border ${
              (dateFrom || dateTo)
                ? 'bg-secondary border-secondary text-white shadow-sm'
                : 'bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">date_range</span>
            {(dateFrom || dateTo) ? 'Dates ✓' : 'Dates'}
          </button>
        </div>

        {/* Date Range Filter (collapsible) */}
        {showDateFilter && (
          <div className="flex gap-2 items-end bg-surface-container-lowest border border-outline-variant rounded-xl p-3 fadeIn">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-2.5 py-2 bg-surface border border-outline-variant rounded-lg text-xs font-medium outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-2.5 py-2 bg-surface border border-outline-variant rounded-lg text-xs font-medium outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
              />
            </div>
            {(dateFrom || dateTo) && (
              <button
                onClick={clearDateFilter}
                className="flex items-center justify-center size-9 rounded-lg border border-outline-variant hover:bg-error-container/10 text-error transition-colors shrink-0"
                title="Clear date filter"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
        )}

        {/* Search */}
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] pointer-events-none">
            search
          </span>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl text-sm font-medium outline-none transition-colors"
            placeholder="Search name, phone, email, or Ref ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-3 text-outline hover:text-on-surface flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Active filter summary */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-on-surface-variant">
              Showing {filtered.length} of {auditable.length} records
              {dateFrom && ` from ${formatDate(dateFrom)}`}
              {dateTo && ` to ${formatDate(dateTo)}`}
            </span>
            <button
              onClick={() => { setFilter('all'); setSearch(''); clearDateFilter(); }}
              className="text-[10px] font-bold text-secondary hover:underline"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Grouped Month Lists */}
      <div className="space-y-6 pt-4">
        {filtered.length === 0 ? (
          <div className="bg-surface-container-lowest py-12 px-6 rounded-2xl border border-outline-variant shadow-sm text-center flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-[48px] text-outline opacity-40">find_in_page</span>
            <h3 className="text-base font-bold text-on-surface mt-3">No Records Found</h3>
            <p className="text-xs text-on-surface-variant mt-1">
              No matching verification history entries were found.
            </p>
            {hasActiveFilters && (
              <button
                onClick={() => { setFilter('all'); setSearch(''); clearDateFilter(); }}
                className="mt-3 text-xs font-bold text-secondary hover:underline"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          Object.entries(grouped).map(([month, items]) => (
            <div key={month} className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-secondary uppercase tracking-widest pl-1 mt-2">
                {month}
              </h3>
              {items.map((v) => {
                const statusEmoji = getStatusEmoji(v.status);
                const checkinFormatted = formatDate(v.checkinDate);
                const checkoutFormatted = formatDate(v.checkoutDate);
                const nights = calculateNights(v.checkinDate, v.checkoutDate);
                const reviewedDate = v.reviewedAt ? formatRelativeTime(v.reviewedAt) : '—';
                const responseTime = v.reviewedAt && v.submittedAt
                  ? formatResponseTime(v.submittedAt, v.reviewedAt)
                  : '—';

                return (
                  <div
                    key={v.id}
                    className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer fadeIn flex flex-col p-4 gap-3"
                    onClick={() => onNavigate(`audit-detail/${v.id}`)}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeClass(v.status)}`}>
                        <span>{statusEmoji}</span> {v.status}
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-surface-container border border-outline-variant/60 px-2 py-0.5 rounded-md text-on-surface-variant">
                        {v.refCode}
                      </span>
                    </div>

                    {/* Body */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-surface-container-high overflow-hidden shrink-0 border border-outline-variant/40">
                        {renderAvatar(v)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block text-sm font-bold text-on-surface truncate">{v.guestName}</span>
                        {v.guestPhone && (
                          <span className="block text-[11px] text-on-surface-variant font-medium mt-0.5">{v.guestPhone}</span>
                        )}
                        <span className="block text-[11px] text-outline font-semibold mt-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">event_available</span>
                          {checkinFormatted} → {checkoutFormatted} ({nights} Night{nights !== 1 ? 's' : ''})
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-outline text-[20px]">chevron_right</span>
                    </div>

                    {/* Guardian note */}
                    {v.guardianNote && (
                      <div className="text-[11px] font-medium italic text-on-surface bg-surface-container-low/50 border-l-2 border-secondary/50 p-2 rounded-r-lg flex items-start gap-1">
                        <span className="material-symbols-outlined text-[14px] text-secondary shrink-0 mt-0.5">sticky_note_2</span>
                        <span>"{v.guardianNote}"</span>
                      </div>
                    )}

                    {/* Footer stats metadata */}
                    <div className="flex items-center justify-between border-t border-outline-variant/40 pt-2.5 text-[9px] font-bold text-outline uppercase tracking-wider">
                      <span>By: {v.reviewedBy || '—'}</span>
                      <span>Action: {reviewedDate}</span>
                      <span>Speed: {responseTime}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </main>
  );
};

export default AuditLog;
