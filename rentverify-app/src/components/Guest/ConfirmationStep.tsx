import React, { useState } from 'react';
import type { Verification } from '../../types';

interface ConfirmationStepProps {
  record: Verification | null;
  onReturnToDashboard: () => void;
  isGuest?: boolean;
}

export const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
  record,
  onReturnToDashboard,
  isGuest = false,
}) => {
  const [isLocked, setIsLocked] = useState(false);

  if (isLocked) {
    return (
      <div className="confirmation-wrapper text-center py-12 px-6 fadeIn animate-scale-up">
        <div className="w-20 h-20 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-[44px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            lock
          </span>
        </div>
        <h2 className="text-xl font-bold text-on-surface">Portal Secured</h2>
        <p className="text-xs text-on-surface-variant mt-3 max-w-sm mx-auto leading-relaxed">
          Thank you! Your identity details have been successfully encrypted and locked in our verified vault for review.
        </p>
        <div className="mt-8 py-3 px-4 bg-surface-container rounded-xl inline-flex items-center gap-2 border border-outline-variant/40">
          <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Safe to Close Tab</span>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-wrapper fadeIn">
      <div className="confirmation-animation">
        <div className="checkmark-circle">
          <svg className="checkmark-svg" viewBox="0 0 52 52">
            <circle className="checkmark-circle-bg" cx="26" cy="26" r="25" fill="none" />
            <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>
      </div>

      <h2 className="confirmation-title">Verification Submitted!</h2>
      <p className="confirmation-subtitle">
        Your details have been sent for review. You'll receive a confirmation via SMS/WhatsApp within 24 hours.
      </p>

      {record && (
        <div className="ref-id-card">
          <span className="ref-label">Your Reference ID</span>
          <span className="ref-code">{record.refCode}</span>
        </div>
      )}

      <p className="confirmation-contact mb-6">Questions? Contact the property guardian.</p>

      {isGuest ? (
        <div className="animate-fade-in mt-6 bg-surface-container/60 border border-outline-variant p-5 rounded-2xl text-center shadow-sm">
          <div className="flex justify-center mb-2">
            <span className="material-symbols-outlined text-[28px] text-secondary">hotel</span>
          </div>
          <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">Check-in Registered</h3>
          <p className="text-[11px] text-on-surface-variant mt-1.5 leading-normal max-w-xs mx-auto">
            Your stay pre-registration is finalized. We hope you enjoy your upcoming visit!
          </p>
          <button
            type="button"
            className="btn btn-primary btn-full mt-4 py-3 text-xs font-bold rounded-xl shadow-sm"
            onClick={() => setIsLocked(true)}
          >
            Close Check-in Portal
          </button>
        </div>
      ) : (
        <button type="button" className="btn btn-ghost btn-full" onClick={onReturnToDashboard}>
          ← Back to Dashboard
        </button>
      )}
    </div>
  );
};

export default ConfirmationStep;
