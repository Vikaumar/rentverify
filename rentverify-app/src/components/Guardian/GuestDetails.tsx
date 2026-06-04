import React, { useState } from 'react';
import type { Verification } from '../../types';
import { formatDateTime, formatRelativeTime, getStatusEmoji } from '../../utils';

interface GuestDetailsProps {
  id: string;
  verification: Verification;
  onBack: () => void;
  onImageClick: (src: string) => void;
  onApprove: (note: string) => void;
  onReject: () => void;
  onFlag: () => void;
  onResetToPending?: () => void;
}

export const GuestDetails: React.FC<GuestDetailsProps> = ({
  verification: v,
  onBack,
  onImageClick,
  onApprove,
  onReject,
  onFlag,
  onResetToPending,
}) => {
  const [note, setNote] = useState('');

  const nights = v.checkinDate && v.checkoutDate
    ? Math.round(
        (new Date(v.checkoutDate).getTime() - new Date(v.checkinDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  const statusLabel = v.status.charAt(0).toUpperCase() + v.status.slice(1);
  const statusEmoji = getStatusEmoji(v.status);

  // Status Color mapping for MD3 Theme badges
  const getBadgeClasses = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-secondary-container/20 text-secondary';
      case 'approved': return 'bg-emerald-100 text-[#10b981]';
      case 'flagged': return 'bg-amber-100 text-on-tertiary-container';
      case 'rejected': return 'bg-error-container/20 text-error';
      default: return 'bg-outline-variant/30 text-on-surface-variant';
    }
  };

  return (
    <main className="max-w-xl mx-auto px-container-margin pt-4 pb-28">
      {/* Sticky Sub Header */}
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

      <div className="space-y-5">
        {/* 1. Comparison section */}
        <section className="bg-surface-container-lowest border border-outline-variant p-4 rounded-2xl shadow-sm">
          <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[20px]">face_check</span>
            Does this person match their ID?
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Guest Selfie</label>
              {v.selfieData ? (
                <div 
                  className="aspect-square w-full rounded-xl overflow-hidden border border-outline-variant cursor-pointer group relative shadow-inner"
                  onClick={() => onImageClick(v.selfieData!)}
                >
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src={v.selfieData}
                    alt="Selfie"
                  />
                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                    <span className="material-symbols-outlined text-[24px]">zoom_in</span>
                  </div>
                </div>
              ) : (
                <div className="aspect-square w-full rounded-xl border-2 border-dashed border-outline-variant bg-surface flex items-center justify-center text-xs text-outline font-semibold">
                  No selfie uploaded
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{v.idType || 'Government ID'}</label>
              {v.idImageData ? (
                <div 
                  className="aspect-square w-full rounded-xl overflow-hidden border border-outline-variant cursor-pointer group relative shadow-inner bg-surface-container"
                  onClick={() => onImageClick(v.idImageData!)}
                >
                  <img
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    src={v.idImageData}
                    alt="ID card"
                  />
                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                    <span className="material-symbols-outlined text-[24px]">zoom_in</span>
                  </div>
                </div>
              ) : (
                <div className="aspect-square w-full rounded-xl border-2 border-dashed border-outline-variant bg-surface flex items-center justify-center text-xs text-outline font-semibold">
                  No ID uploaded
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 2. Personal info card */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-surface-container/30 border-b border-outline-variant/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">Guest Profile</h3>
          </div>
          <div className="divide-y divide-outline-variant/60 px-4">
            <div className="flex justify-between items-center py-3 text-sm">
              <span className="text-on-surface-variant font-medium">Guest Name</span>
              <span className="font-semibold text-on-surface text-right">{v.guestName}</span>
            </div>
            <div className="flex justify-between items-center py-3 text-sm">
              <span className="text-on-surface-variant font-medium">Phone</span>
              <span className="font-semibold text-on-surface text-right">{v.guestPhone || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-3 text-sm">
              <span className="text-on-surface-variant font-medium">Email</span>
              <span className="font-semibold text-on-surface text-right text-xs truncate max-w-[200px]">{v.guestEmail || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-3 text-sm">
              <span className="text-on-surface-variant font-medium">Total Guests</span>
              <span className="font-semibold text-on-surface text-right">👤 {v.guestCount}</span>
            </div>
            <div className="flex justify-between items-center py-3 text-sm">
              <span className="text-on-surface-variant font-medium">Purpose</span>
              <span className="font-semibold text-on-surface text-right">{v.purpose}</span>
            </div>
            <div className="flex justify-between items-center py-3 text-sm">
              <span className="text-on-surface-variant font-medium">Booking Platform</span>
              <span className="font-semibold text-on-surface text-right">{v.bookingPlatform || '—'}</span>
            </div>
          </div>
        </section>

        {/* 3. Stay info card */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-surface-container/30 border-b border-outline-variant/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">Stay Details</h3>
          </div>
          <div className="divide-y divide-outline-variant/60 px-4">
            <div className="flex justify-between items-center py-3 text-sm">
              <span className="text-on-surface-variant font-medium">Check-in</span>
              <span className="font-semibold text-on-surface text-right">
                {formatDateTime(v.checkinDate, v.checkinTime)}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 text-sm">
              <span className="text-on-surface-variant font-medium">Check-out</span>
              <span className="font-semibold text-on-surface text-right">
                {formatDateTime(v.checkoutDate, v.checkoutTime)}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 text-sm">
              <span className="text-on-surface-variant font-medium">Stay Duration</span>
              <span className="font-semibold text-on-surface text-right">
                {nights} night{nights !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </section>

        {/* 4. Submission details card */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-surface-container/30 border-b border-outline-variant/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">Verification Status</h3>
          </div>
          <div className="divide-y divide-outline-variant/60 px-4">
            <div className="flex justify-between items-center py-3 text-sm">
              <span className="text-on-surface-variant font-medium">Submitted</span>
              <span className="font-semibold text-on-surface text-right">{formatRelativeTime(v.submittedAt)}</span>
            </div>
            <div className="flex justify-between items-center py-3 text-sm">
              <span className="text-on-surface-variant font-medium">Status</span>
              <span className="text-right">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getBadgeClasses(v.status)}`}>
                  <span>{statusEmoji}</span> {statusLabel}
                </span>
              </span>
            </div>
            {v.reviewedAt && (
              <div className="flex justify-between items-center py-3 text-sm">
                <span className="text-on-surface-variant font-medium">Reviewed At</span>
                <span className="font-semibold text-on-surface text-right">{formatRelativeTime(v.reviewedAt)}</span>
              </div>
            )}
            {v.reviewedBy && (
              <div className="flex justify-between items-center py-3 text-sm">
                <span className="text-on-surface-variant font-medium">Reviewed By</span>
                <span className="font-semibold text-on-surface text-right">{v.reviewedBy}</span>
              </div>
            )}
          </div>
        </section>

        {/* 5. Rejection/Flag/Note displays */}
        {v.status !== 'pending' ? (
          <div className="space-y-4">
            {v.rejectionReason && (
              <section className="bg-error-container/10 border border-error/30 p-4 rounded-2xl shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-error mb-1">Rejection Reason</h3>
                <p className="text-sm font-semibold text-on-surface">{v.rejectionReason}</p>
              </section>
            )}
            {v.flagReason && (
              <section className="bg-tertiary-fixed-dim/20 border border-tertiary-fixed-dim/40 p-4 rounded-2xl shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-on-tertiary-container mb-1">Flag Reason</h3>
                <p className="text-sm font-semibold text-on-surface">{v.flagReason}</p>
              </section>
            )}
            {v.guardianNote && (
              <section className="bg-surface-container-lowest border border-outline-variant p-4 rounded-2xl shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Guardian Note</h3>
                <p className="text-sm font-medium text-on-surface italic">"{v.guardianNote}"</p>
              </section>
            )}
            {onResetToPending && (
              <button
                onClick={onResetToPending}
                className="w-full py-3.5 border border-outline text-on-surface rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-surface-container transition-all active:scale-[0.98] mt-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">history</span>
                <span>Reopen & Reset to Pending</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5 pt-2">
            {/* Guardian Decision Panel */}
            <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-surface-container/30 border-b border-outline-variant/60 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">Guardian Decision</h3>
              </div>
              <div className="p-4 space-y-4">
                {/* Guardian decision notes */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="detail-guardian-note" className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Review Note (Optional)
                  </label>
                  <textarea
                    id="detail-guardian-note"
                    className="w-full p-3 bg-surface-container border border-outline-variant focus:border-secondary focus:ring-2 focus:ring-secondary/20 rounded-xl text-sm font-medium outline-none transition-all resize-none"
                    placeholder="Add your audit notes, observations, or conditions..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Primary Approve Button */}
                <button 
                  onClick={() => onApprove(note)}
                  className="group w-full relative overflow-hidden py-4 bg-gradient-to-r from-[#10b981] to-[#059669] text-white rounded-2xl font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-[#10b981]/20 active:scale-[0.98] hover:shadow-xl hover:shadow-[#10b981]/30 transition-all duration-200"
                >
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300" />
                  <span className="material-symbols-outlined text-[22px] relative z-10" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  <span className="text-sm relative z-10">Approve Guest</span>
                  <span className="material-symbols-outlined text-[16px] relative z-10 opacity-60 group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                </button>
                
                {/* Secondary Actions Row */}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={onReject}
                    className="group relative overflow-hidden py-3.5 bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md shadow-[#ef4444]/15 active:scale-[0.98] hover:shadow-lg hover:shadow-[#ef4444]/25 transition-all duration-200"
                  >
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300" />
                    <span className="material-symbols-outlined text-[18px] relative z-10" style={{ fontVariationSettings: "'FILL' 1" }}>block</span>
                    <span className="text-xs relative z-10">Reject</span>
                  </button>
                  <button 
                    onClick={onFlag}
                    className="group relative overflow-hidden py-3.5 bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md shadow-[#f59e0b]/15 active:scale-[0.98] hover:shadow-lg hover:shadow-[#f59e0b]/25 transition-all duration-200"
                  >
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300" />
                    <span className="material-symbols-outlined text-[18px] relative z-10" style={{ fontVariationSettings: "'FILL' 1" }}>flag</span>
                    <span className="text-xs relative z-10">Flag</span>
                  </button>
                </div>

                {/* Helper text */}
                <p className="text-[10px] text-center text-outline leading-tight">
                  Approve sends confirmation SMS & Email to the guest. Reject or Flag will open a details form.
                </p>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
};

export default GuestDetails;
