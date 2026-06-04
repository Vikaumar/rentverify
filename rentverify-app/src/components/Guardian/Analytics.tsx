import React, { useMemo } from 'react';
import { useStore } from '../../context/StoreContext';

interface AnalyticsProps {
  onNavigate: (route: string) => void;
}

// ─── SVG Donut Chart Component ─────────────────────────────────────
const DonutChart: React.FC<{
  segments: { label: string; value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
}> = ({ segments, size = 160, strokeWidth = 28 }) => {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-xs text-outline font-medium">No data</span>
      </div>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.filter(s => s.value > 0).map((seg, i) => {
        const segmentLength = (seg.value / total) * circumference;
        const dashOffset = circumference - cumulativeOffset;
        cumulativeOffset += segmentLength;
        return (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-all duration-700"
            style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
          />
        );
      })}
      <text x="50%" y="46%" textAnchor="middle" className="fill-on-surface text-2xl font-bold" dominantBaseline="central">
        {total}
      </text>
      <text x="50%" y="62%" textAnchor="middle" className="fill-outline text-[10px] font-semibold" dominantBaseline="central">
        Total
      </text>
    </svg>
  );
};

// ─── Horizontal Bar Component ──────────────────────────────────────
const HBar: React.FC<{ label: string; value: number; max: number; color: string; suffix?: string }> = ({
  label, value, max, color, suffix = ''
}) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-[11px]">
        <span className="font-semibold text-on-surface">{label}</span>
        <span className="font-bold text-on-surface-variant">{value}{suffix}</span>
      </div>
      <div className="h-2.5 w-full bg-surface-container rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

// ─── Mini Stat Card ────────────────────────────────────────────────
const StatCard: React.FC<{ icon: string; label: string; value: string | number; color: string; subtext?: string }> = ({
  icon, label, value, color, subtext
}) => (
  <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm flex flex-col gap-2">
    <div className="flex items-center gap-2">
      <div className="size-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
        <span className="material-symbols-outlined text-[18px]" style={{ color, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{label}</span>
    </div>
    <p className="text-2xl font-bold text-on-surface">{value}</p>
    {subtext && <p className="text-[10px] text-outline font-medium -mt-1">{subtext}</p>}
  </div>
);

// ─── Main Analytics Component ──────────────────────────────────────
export const Analytics: React.FC<AnalyticsProps> = ({ onNavigate }) => {
  const { verifications, connectionStatus } = useStore();

  const analytics = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    // Status counts
    const approved = verifications.filter(v => v.status === 'approved');
    const rejected = verifications.filter(v => v.status === 'rejected');
    const flagged = verifications.filter(v => v.status === 'flagged');
    const pending = verifications.filter(v => v.status === 'pending');

    // Today's counts
    const approvedToday = approved.filter(v => v.reviewedAt && new Date(v.reviewedAt).getTime() >= todayStart).length;

    // This month
    const thisMonthVerified = verifications.filter(v => {
      const sub = new Date(v.submittedAt).getTime();
      return sub >= monthStart;
    });

    // Response times (approved/rejected/flagged only)
    const reviewed = verifications.filter(v => v.reviewedAt && v.submittedAt);
    const responseTimes = reviewed.map(v => {
      return (new Date(v.reviewedAt!).getTime() - new Date(v.submittedAt).getTime()) / 60000; // minutes
    });
    const avgResponseMin = responseTimes.length > 0 ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0;
    const fastestMin = responseTimes.length > 0 ? Math.round(Math.min(...responseTimes)) : 0;
    const slowestMin = responseTimes.length > 0 ? Math.round(Math.max(...responseTimes)) : 0;

    // Platform breakdown
    const platformCounts: Record<string, number> = {};
    verifications.forEach(v => {
      const key = v.bookingPlatform || 'Unknown';
      platformCounts[key] = (platformCounts[key] || 0) + 1;
    });

    // Purpose breakdown
    const purposeCounts: Record<string, number> = {};
    verifications.forEach(v => {
      const key = v.purpose || 'Other';
      purposeCounts[key] = (purposeCounts[key] || 0) + 1;
    });

    // Total guests
    const totalGuests = verifications.reduce((s, v) => s + (v.guestCount || 1), 0);

    // Weekly activity (last 7 days)
    const weeklyData: { label: string; submitted: number; reviewed: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i).getTime();
      const dayEnd = dayStart + 86_400_000;
      const dayLabel = new Date(dayStart).toLocaleDateString('en-US', { weekday: 'short' });
      const submitted = verifications.filter(v => {
        const t = new Date(v.submittedAt).getTime();
        return t >= dayStart && t < dayEnd;
      }).length;
      const reviewedDay = verifications.filter(v => {
        if (!v.reviewedAt) return false;
        const t = new Date(v.reviewedAt).getTime();
        return t >= dayStart && t < dayEnd;
      }).length;
      weeklyData.push({ label: dayLabel, submitted, reviewed: reviewedDay });
    }

    // ID type breakdown
    const idTypeCounts: Record<string, number> = {};
    verifications.forEach(v => {
      const key = v.idType || 'Unknown';
      idTypeCounts[key] = (idTypeCounts[key] || 0) + 1;
    });

    return {
      total: verifications.length,
      approved: approved.length,
      rejected: rejected.length,
      flagged: flagged.length,
      pending: pending.length,
      approvedToday,
      thisMonth: thisMonthVerified.length,
      avgResponseMin,
      fastestMin,
      slowestMin,
      platformCounts,
      purposeCounts,
      idTypeCounts,
      totalGuests,
      weeklyData,
    };
  }, [verifications]);

  const platformColors: Record<string, string> = {
    'Airbnb': '#FF5A5F', 'Booking.com': '#003580', 'Agoda': '#5391ff',
    'Expedia': '#FDCC06', 'MakeMyTrip': '#0770E3', 'Direct': '#10b981',
    'OYO': '#EE2A24', 'Other': '#636e72',
  };
  const purposeColors: Record<string, string> = {
    'Tourism': '#6C63FF', 'Business': '#0984E3', 'Family Visit': '#E17055',
    'Medical': '#00b894', 'Student': '#fdcb6e', 'Other': '#636e72',
  };

  const formatMinutes = (mins: number): string => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h < 24) return m > 0 ? `${h}h ${m}m` : `${h}h`;
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h`;
  };

  const maxPlatform = Math.max(...Object.values(analytics.platformCounts), 1);
  const maxPurpose = Math.max(...Object.values(analytics.purposeCounts), 1);
  const maxWeekly = Math.max(...analytics.weeklyData.map(d => Math.max(d.submitted, d.reviewed)), 1);

  return (
    <main className="max-w-xl mx-auto px-container-margin pt-4 pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-outline-variant -mx-container-margin px-container-margin py-3.5 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex size-8 items-center justify-center rounded-full hover:bg-surface-container transition-colors -ml-1 text-on-surface"
              aria-label="Go back"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <span className="material-symbols-outlined text-secondary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
            <h1 className="text-on-surface text-lg font-bold">Analytics</h1>
          </div>
          <div className="flex items-center gap-1">
            <span className={`block h-1.5 w-1.5 rounded-full ${
              connectionStatus === 'online' ? 'bg-[#10b981]' :
              connectionStatus === 'syncing' ? 'bg-amber-400 animate-pulse' : 'bg-error'
            }`} />
            <span className="text-[9px] font-semibold text-on-surface-variant uppercase tracking-wider">
              {connectionStatus === 'online' ? 'Live' : connectionStatus === 'syncing' ? 'Sync' : 'Local'}
            </span>
          </div>
        </div>
      </header>

      <div className="space-y-6">
        {/* ─── Top Stats Grid ──────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon="groups" label="Total Guests" value={analytics.totalGuests} color="#6C63FF" subtext={`Across ${analytics.total} verifications`} />
          <StatCard icon="today" label="Approved Today" value={analytics.approvedToday} color="#10b981" subtext={`${analytics.approved} total approved`} />
          <StatCard icon="schedule" label="Avg Response" value={formatMinutes(analytics.avgResponseMin)} color="#0984E3" subtext={`Fastest: ${formatMinutes(analytics.fastestMin)}`} />
          <StatCard icon="calendar_month" label="This Month" value={analytics.thisMonth} color="#E17055" subtext={`${analytics.rejected} rejected`} />
        </div>

        {/* ─── Status Donut Chart ──────────────────────────── */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-4 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[18px]">donut_small</span>
            Verification Status Breakdown
          </h3>
          <div className="flex items-center justify-center gap-6">
            <DonutChart
              segments={[
                { label: 'Approved', value: analytics.approved, color: '#10b981' },
                { label: 'Pending', value: analytics.pending, color: '#6C63FF' },
                { label: 'Rejected', value: analytics.rejected, color: '#ef4444' },
                { label: 'Flagged', value: analytics.flagged, color: '#f59e0b' },
              ]}
            />
            <div className="flex flex-col gap-2.5">
              {[
                { label: 'Approved', value: analytics.approved, color: '#10b981' },
                { label: 'Pending', value: analytics.pending, color: '#6C63FF' },
                { label: 'Rejected', value: analytics.rejected, color: '#ef4444' },
                { label: 'Flagged', value: analytics.flagged, color: '#f59e0b' },
              ].map(seg => (
                <div key={seg.label} className="flex items-center gap-2">
                  <span className="block h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                  <span className="text-xs font-semibold text-on-surface-variant">{seg.label}</span>
                  <span className="text-xs font-bold text-on-surface ml-auto">{seg.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Weekly Activity Bar Chart ───────────────────── */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-4 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[18px]">bar_chart</span>
            Last 7 Days Activity
          </h3>
          <div className="flex items-end gap-2 h-32 px-1">
            {analytics.weeklyData.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center gap-0.5" style={{ height: '100px' }}>
                  <div className="w-full flex items-end justify-center gap-0.5 h-full">
                    {/* Submitted bar */}
                    <div
                      className="w-[40%] rounded-t-md transition-all duration-500"
                      style={{
                        height: `${Math.max((day.submitted / maxWeekly) * 100, day.submitted > 0 ? 8 : 0)}%`,
                        backgroundColor: '#6C63FF',
                        minHeight: day.submitted > 0 ? '6px' : '0px',
                      }}
                    />
                    {/* Reviewed bar */}
                    <div
                      className="w-[40%] rounded-t-md transition-all duration-500"
                      style={{
                        height: `${Math.max((day.reviewed / maxWeekly) * 100, day.reviewed > 0 ? 8 : 0)}%`,
                        backgroundColor: '#10b981',
                        minHeight: day.reviewed > 0 ? '6px' : '0px',
                      }}
                    />
                  </div>
                </div>
                <span className="text-[9px] font-bold text-outline">{day.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-5 pt-3 border-t border-outline-variant/40 mt-3">
            <div className="flex items-center gap-1.5">
              <span className="block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: '#6C63FF' }} />
              <span className="text-[10px] font-semibold text-on-surface-variant">Submitted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: '#10b981' }} />
              <span className="text-[10px] font-semibold text-on-surface-variant">Reviewed</span>
            </div>
          </div>
        </section>

        {/* ─── Platform Breakdown ──────────────────────────── */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-4 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[18px]">travel_explore</span>
            Booking Platform Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.platformCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([platform, count]) => (
                <HBar
                  key={platform}
                  label={platform}
                  value={count}
                  max={maxPlatform}
                  color={platformColors[platform] || '#636e72'}
                />
              ))}
          </div>
        </section>

        {/* ─── Purpose Breakdown ───────────────────────────── */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-4 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[18px]">category</span>
            Purpose of Stay
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.purposeCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([purpose, count]) => (
                <HBar
                  key={purpose}
                  label={purpose}
                  value={count}
                  max={maxPurpose}
                  color={purposeColors[purpose] || '#636e72'}
                />
              ))}
          </div>
        </section>

        {/* ─── ID Type Breakdown ───────────────────────────── */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-4 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[18px]">badge</span>
            ID Document Types
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(analytics.idTypeCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([idType, count]) => (
                <div key={idType} className="flex items-center gap-2 bg-surface-container rounded-xl p-3 border border-outline-variant/40">
                  <span className="material-symbols-outlined text-[16px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-on-surface truncate">{idType}</p>
                    <p className="text-[10px] text-outline font-medium">{count} submission{count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* ─── Response Time Stats ─────────────────────────── */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-4 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[18px]">speed</span>
            Response Time Performance
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center bg-surface-container rounded-xl p-3 border border-outline-variant/40">
              <p className="text-lg font-bold text-[#10b981]">{formatMinutes(analytics.fastestMin)}</p>
              <p className="text-[9px] font-bold text-outline uppercase tracking-wider mt-1">Fastest</p>
            </div>
            <div className="text-center bg-surface-container rounded-xl p-3 border border-secondary/30">
              <p className="text-lg font-bold text-secondary">{formatMinutes(analytics.avgResponseMin)}</p>
              <p className="text-[9px] font-bold text-outline uppercase tracking-wider mt-1">Average</p>
            </div>
            <div className="text-center bg-surface-container rounded-xl p-3 border border-outline-variant/40">
              <p className="text-lg font-bold text-[#f59e0b]">{formatMinutes(analytics.slowestMin)}</p>
              <p className="text-[9px] font-bold text-outline uppercase tracking-wider mt-1">Slowest</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Analytics;
