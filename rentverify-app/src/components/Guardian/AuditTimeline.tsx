import React from 'react';
import { useStore } from '../../context/StoreContext';
import { getStatusEmoji } from '../../utils';

interface AuditTimelineProps {
  id: string;
  onBack: () => void;
  onImageClick: (src: string) => void;
}

const EVENT_ICONS: Record<string, string> = {
  link_sent: 'mail',
  details_submitted: 'description',
  selfie_uploaded: 'photo_camera',
  id_uploaded: 'badge',
  submission_complete: 'check_circle',
  guardian_viewed: 'visibility',
  approved: 'check_circle',
  rejected: 'cancel',
  flagged: 'warning',
  sms_sent: 'sms',
  whatsapp_sent: 'chat',
  escalation_sent: 'notification_important',
};

const DOT_COLORS: Record<string, string> = {
  link_sent: 'bg-secondary',
  sms_sent: 'bg-secondary',
  whatsapp_sent: 'bg-secondary',
  details_submitted: 'bg-secondary',
  selfie_uploaded: 'bg-secondary',
  id_uploaded: 'bg-secondary',
  submission_complete: 'bg-secondary',
  guardian_viewed: 'bg-secondary',
  approved: 'bg-[#10b981]',
  rejected: 'bg-error',
  flagged: 'bg-on-tertiary-container',
  escalation_sent: 'bg-error',
};

const ICON_COLORS: Record<string, string> = {
  link_sent: 'text-secondary',
  sms_sent: 'text-secondary',
  whatsapp_sent: 'text-secondary',
  details_submitted: 'text-secondary',
  selfie_uploaded: 'text-secondary',
  id_uploaded: 'text-secondary',
  submission_complete: 'text-secondary',
  guardian_viewed: 'text-secondary',
  approved: 'text-[#10b981]',
  rejected: 'text-error',
  flagged: 'text-on-tertiary-container',
  escalation_sent: 'text-error',
};

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ id, onBack, onImageClick }) => {
  const { getVerificationById, getAuditEventsByVerificationId } = useStore();

  const v = getVerificationById(id);
  const events = getAuditEventsByVerificationId(id);

  if (!v) return null;

  const statusLabel = v.status.charAt(0).toUpperCase() + v.status.slice(1);
  const statusEmoji = getStatusEmoji(v.status);

  const getBadgeClasses = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-secondary-container/20 text-secondary';
      case 'approved': return 'bg-emerald-100 text-[#10b981]';
      case 'flagged': return 'bg-amber-100 text-on-tertiary-container';
      case 'rejected': return 'bg-error-container/20 text-error';
      default: return 'bg-outline-variant/30 text-on-surface-variant';
    }
  };

  // Format full time string for timeline
  const formatTimestamp = (isoString: string) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

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

  // Retention formula: Checkout + 90 days
  let retentionStr = '—';
  if (v.checkoutDate) {
    const checkout = new Date(v.checkoutDate);
    checkout.setDate(checkout.getDate() + 90);
    retentionStr = checkout.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  const responseTime = v.reviewedAt && v.submittedAt
    ? formatResponseTime(v.submittedAt, v.reviewedAt)
    : '—';

  return (
    <main className="max-w-xl mx-auto px-container-margin pt-4 pb-28">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-outline-variant -mx-container-margin px-container-margin py-3 mb-6">
        <div className="flex items-center justify-between">
          <button 
            className="flex items-center gap-1.5 text-secondary hover:underline font-bold text-sm"
            onClick={onBack}
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            Back
          </button>
          <span className="text-xs font-mono font-bold bg-surface-container border border-outline-variant px-2.5 py-1 rounded-full text-on-surface-variant">
            {v.refCode}
          </span>
        </div>
      </header>

      <div className="space-y-6">
        {/* 1. Timeline Header Title */}
        <section className="bg-surface-container-lowest border border-outline-variant p-4 rounded-2xl shadow-sm text-center">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3.5 ${getBadgeClasses(v.status)}`}>
            <span>{statusEmoji}</span> {statusLabel}
          </span>
          <h2 className="text-on-surface font-bold text-lg leading-tight">{v.guestName}</h2>
          {v.guestPhone && (
            <p className="text-on-surface-variant text-xs font-medium mt-1">{v.guestPhone}</p>
          )}
        </section>

        {/* 2. Timeline steps */}
        <section className="bg-surface-container-lowest border border-outline-variant p-5 rounded-2xl shadow-sm">
          <h3 className="text-sm font-bold text-on-surface mb-6 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[20px]">route</span>
            Audit Activity Log
          </h3>

          <div className="relative border-l-2 border-outline-variant/60 ml-3 pl-5 space-y-6 pb-2">
            {events.length === 0 ? (
              <div className="relative">
                <div className="absolute -left-[26px] top-1.5 w-2.5 h-2.5 rounded-full bg-outline-variant" />
                <p className="text-xs font-semibold text-on-surface-variant">No events recorded for this audit.</p>
              </div>
            ) : (
              events.map((evt) => {
                const dotColor = DOT_COLORS[evt.eventType] || 'bg-secondary';
                const iconName = EVENT_ICONS[evt.eventType] || 'info';
                const iconColor = ICON_COLORS[evt.eventType] || 'text-secondary';
                const timeStr = formatTimestamp(evt.timestamp);

                return (
                  <div key={evt.id} className="relative fadeIn">
                    {/* Circle timeline bullet */}
                    <div className={`absolute -left-[26px] top-1 w-2.5 h-2.5 rounded-full ${dotColor} border border-surface shadow-sm`} />
                    
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-bold text-outline uppercase tracking-wider">{timeStr}</span>
                      
                      <div className="flex items-start gap-1.5">
                        <span className={`material-symbols-outlined text-[16px] shrink-0 mt-0.5 ${iconColor}`}>
                          {iconName}
                        </span>
                        <p className="text-xs font-semibold text-on-surface leading-tight">
                          {evt.description}
                        </p>
                      </div>

                      {evt.metadata?.reason && (
                        <p className="text-[10px] font-medium text-error bg-error-container/10 border border-error/20 p-2 rounded-lg mt-1 ml-5">
                          Reason: {evt.metadata.reason}
                        </p>
                      )}
                      
                      {evt.metadata?.note && (
                        <p className="text-[10px] font-medium text-on-tertiary-container bg-tertiary-fixed-dim/20 border border-tertiary-fixed-dim/30 p-2 rounded-lg mt-1 ml-5 italic">
                          Note: "{evt.metadata.note}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* 3. Photos attachments */}
        {(v.selfieData || v.idImageData) && (
          <section className="bg-surface-container-lowest border border-outline-variant p-4 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-[20px]">attachment</span>
              Uploaded Attachments
            </h3>
            
            <div className="flex gap-4 justify-center">
              {v.selfieData && (
                <div 
                  className="w-24 h-24 rounded-full overflow-hidden border border-outline-variant cursor-pointer relative group shrink-0"
                  onClick={() => onImageClick(v.selfieData!)}
                >
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    src={v.selfieData}
                    alt="Selfie attachment"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-[20px]">zoom_in</span>
                  </div>
                </div>
              )}
              {v.idImageData && (
                <div 
                  className="w-32 h-24 rounded-xl overflow-hidden border border-outline-variant cursor-pointer relative group shrink-0 bg-surface-container"
                  onClick={() => onImageClick(v.idImageData!)}
                >
                  <img
                    className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform"
                    src={v.idImageData}
                    alt="ID attachment"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-[20px]">zoom_in</span>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 4. Metadata details */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-surface-container/30 border-b border-outline-variant/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">Record Metadata</h3>
          </div>
          <div className="divide-y divide-outline-variant/60 px-4">
            <div className="flex justify-between items-center py-3 text-sm">
              <span className="text-on-surface-variant font-medium">Submitted</span>
              <span className="font-semibold text-on-surface text-right">{formatTimestamp(v.submittedAt)}</span>
            </div>
            <div className="flex justify-between items-center py-3 text-sm">
              <span className="text-on-surface-variant font-medium">Reviewed At</span>
              <span className="font-semibold text-on-surface text-right">
                {v.reviewedAt ? formatTimestamp(v.reviewedAt) : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 text-sm">
              <span className="text-on-surface-variant font-medium">Response Time</span>
              <span className="font-semibold text-on-surface text-right">{responseTime}</span>
            </div>
            <div className="flex justify-between items-center py-3 text-sm">
              <span className="text-on-surface-variant font-medium">ID Document Type</span>
              <span className="font-semibold text-on-surface text-right">{v.idType || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-3 text-sm">
              <span className="text-on-surface-variant font-medium">Total Guests</span>
              <span className="font-semibold text-on-surface text-right">👤 {v.guestCount}</span>
            </div>
            <div className="flex justify-between items-center py-3 text-sm">
              <span className="text-on-surface-variant font-medium">Visit Purpose</span>
              <span className="font-semibold text-on-surface text-right">{v.purpose || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-3 text-sm">
              <span className="text-on-surface-variant font-medium text-xs">Retention Date (90 Days)</span>
              <span className="font-semibold text-on-surface text-right text-xs">{retentionStr}</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AuditTimeline;
