import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatDate, formatRelativeTime } from '../../utils';
import type { Verification } from '../../types';

interface PendingListProps {
  onNavigate: (route: string) => void;
  onApprove: (v: Verification) => void;
  onReject: (v: Verification) => void;
  onFlag: (v: Verification) => void;
}

type SortOption = 'newest' | 'oldest' | 'urgency';

export const PendingList: React.FC<PendingListProps> = ({
  onNavigate,
  onApprove,
  onReject,
  onFlag,
}) => {
  const { getPendingVerifications, refreshData, connectionStatus } = useStore();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const pending = getPendingVerifications();

  // Filter and sort
  const filteredPending = useMemo(() => {
    let results = [...pending];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      results = results.filter(
        (v) =>
          v.guestName.toLowerCase().includes(q) ||
          v.guestPhone.toLowerCase().includes(q) ||
          v.refCode.toLowerCase().includes(q) ||
          (v.guestEmail && v.guestEmail.toLowerCase().includes(q))
      );
    }

    // Sort
    results.sort((a, b) => {
      const aTime = new Date(a.submittedAt).getTime();
      const bTime = new Date(b.submittedAt).getTime();
      
      switch (sortBy) {
        case 'oldest':
          return aTime - bTime;
        case 'urgency': {
          // Older submissions first (more urgent)
          const aAge = Date.now() - aTime;
          const bAge = Date.now() - bTime;
          return bAge - aAge;
        }
        case 'newest':
        default:
          return bTime - aTime;
      }
    });

    return results;
  }, [pending, search, sortBy]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const sortOptions: { id: SortOption; label: string; icon: string }[] = [
    { id: 'newest', label: 'Newest', icon: 'arrow_downward' },
    { id: 'oldest', label: 'Oldest', icon: 'arrow_upward' },
    { id: 'urgency', label: 'Urgent', icon: 'priority_high' },
  ];

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
      <div className="w-full h-full flex items-center justify-center bg-surface-variant text-on-surface-variant font-bold text-lg">
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
            <h1 className="text-on-surface text-lg font-bold">Pending Requests</h1>
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-secondary px-1.5 text-xs font-semibold text-white shadow-sm">
              {pending.length}
            </span>
          </div>
          {/* Refresh + Connection Status */}
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

      {/* Search + Sort Controls */}
      <div className="bg-surface sticky top-[53px] z-30 pt-1 pb-3 flex flex-col gap-2.5 -mx-container-margin px-container-margin border-b border-outline-variant/30">
        {/* Search Bar */}
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] pointer-events-none">
            search
          </span>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl text-sm font-medium outline-none transition-colors"
            placeholder="Search by name, phone, or Ref ID..."
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

        {/* Sort Pills */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {sortOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSortBy(opt.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold shrink-0 transition-all border ${
                sortBy === opt.id
                  ? 'bg-secondary border-secondary text-white shadow-sm'
                  : 'bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
          {search && (
            <span className="flex items-center px-2 py-1 rounded-full text-[10px] font-semibold bg-surface-container border border-outline-variant text-on-surface-variant">
              {filteredPending.length} result{filteredPending.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Pending list items */}
      <div className="space-y-4 pt-4">
        {filteredPending.length === 0 ? (
          <div className="bg-surface-container-lowest py-12 px-6 rounded-2xl border border-outline-variant shadow-sm text-center flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-[48px] text-outline opacity-40">
              {search ? 'search_off' : 'done_all'}
            </span>
            <h3 className="text-base font-bold text-on-surface mt-3">
              {search ? 'No Matches Found' : 'All Caught Up!'}
            </h3>
            <p className="text-xs text-on-surface-variant mt-1 max-w-[240px]">
              {search
                ? `No pending verifications match "${search}".`
                : 'No guest identity verifications are currently waiting for your review.'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="mt-3 text-xs font-bold text-secondary hover:underline"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          filteredPending.map((v) => {
            const submittedAgo = formatRelativeTime(v.submittedAt);
            const isUrgent = Date.now() - new Date(v.submittedAt).getTime() > 24 * 60 * 60 * 1000;
            const borderClass = isUrgent ? 'border-error/40 bg-error-container/5' : 'border-outline-variant';

            return (
              <div 
                key={v.id} 
                className={`bg-surface-container-lowest rounded-2xl border ${borderClass} shadow-sm overflow-hidden flex flex-col fadeIn`}
              >
                {/* Main Card clickable area */}
                <div
                  className="p-4 flex items-center gap-4 cursor-pointer hover:bg-surface-container-low transition-colors duration-200"
                  onClick={() => onNavigate(`detail/${v.id}`)}
                >
                  <div className="w-14 h-14 rounded-lg bg-surface-container-high overflow-hidden shrink-0">
                    {renderAvatar(v)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="text-on-surface font-bold text-sm truncate">{v.guestName}</h4>
                      {isUrgent ? (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-error-container/20 text-error uppercase tracking-wider">
                          <span className="material-symbols-outlined text-[10px]">warning</span> Urgent
                        </span>
                      ) : (!v.selfieData && !v.idImageData) ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                          <span className="material-symbols-outlined text-[10px]">mail</span> Invited
                        </span>
                      ) : null}
                    </div>
                    <p className="text-on-surface-variant text-xs truncate mt-0.5">
                      📅 {formatDate(v.checkinDate)} · 👤 {v.guestCount} Guest{v.guestCount !== 1 ? 's' : ''}
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-outline">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      <span className="text-[10px] font-medium text-on-surface-variant">
                        {(!v.selfieData && !v.idImageData) ? 'Awaiting Guest Uploads' : `Submitted ${submittedAgo}`} · via {v.bookingPlatform || 'Direct'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action footer */}
                <div className="flex items-center justify-around border-t border-outline-variant/60 py-2 bg-surface-container-lowest px-2">
                  <button
                    className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-colors ${
                      (!v.selfieData && !v.idImageData)
                        ? 'text-outline opacity-40 cursor-not-allowed'
                        : 'text-[#10b981] hover:bg-[#10b981]/10'
                    }`}
                    onClick={() => { if (v.selfieData || v.idImageData) onApprove(v); }}
                    disabled={!v.selfieData && !v.idImageData}
                    title={(!v.selfieData && !v.idImageData) ? 'Cannot approve before guest submits details' : 'Approve'}
                    aria-label="Approve"
                  >
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    Approve
                  </button>
                  <div className="h-4 w-[1px] bg-outline-variant" />
                  
                  <button
                    className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-colors ${
                      (!v.selfieData && !v.idImageData)
                        ? 'text-outline opacity-40 cursor-not-allowed'
                        : 'text-error hover:bg-error-container/10'
                    }`}
                    onClick={() => { if (v.selfieData || v.idImageData) onReject(v); }}
                    disabled={!v.selfieData && !v.idImageData}
                    title={(!v.selfieData && !v.idImageData) ? 'Cannot reject before guest submits details' : 'Reject'}
                    aria-label="Reject"
                  >
                    <span className="material-symbols-outlined text-[18px]">cancel</span>
                    Reject
                  </button>
                  <div className="h-4 w-[1px] bg-outline-variant" />

                  <button
                    className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-colors ${
                      (!v.selfieData && !v.idImageData)
                        ? 'text-outline opacity-40 cursor-not-allowed'
                        : 'text-on-tertiary-container hover:bg-tertiary-fixed-dim/20'
                    }`}
                    onClick={() => { if (v.selfieData || v.idImageData) onFlag(v); }}
                    disabled={!v.selfieData && !v.idImageData}
                    title={(!v.selfieData && !v.idImageData) ? 'Cannot flag before guest submits details' : 'Flag'}
                    aria-label="Flag as Suspicious"
                  >
                    <span className="material-symbols-outlined text-[18px]">warning</span>
                    Flag
                  </button>
                  <div className="h-4 w-[1px] bg-outline-variant" />

                  <button
                    className="flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
                    onClick={() => onNavigate(`detail/${v.id}`)}
                    title="View Details"
                    aria-label="View Details"
                  >
                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                    Details
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
};

export default PendingList;
