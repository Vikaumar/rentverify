import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useNotifications } from '../../context/NotificationContext';
import { calculateNights, formatDateTime } from '../../utils';
import type { Verification } from '../../types';

interface ReviewSubmitProps {
  formData: {
    fullName: string;
    phone: string;
    countryCode: string;
    email: string;
    guestCount: number;
    purpose: string;
    bookingPlatform: string;
    selfieData: string | null;
    idType: string;
    idImageData: string | null;
    checkinDate: string;
    checkinTime: string;
    checkoutDate: string;
    checkoutTime: string;
  };
  onEditStep: (step: 'details' | 'selfie' | 'id' | 'dates') => void;
  onSubmitSuccess: (verification: Verification) => void;
  token?: string | null;
}

export const ReviewSubmit: React.FC<ReviewSubmitProps> = ({
  formData,
  onEditStep,
  onSubmitSuccess,
  token,
}) => {
  const { addVerification, addAuditEvent } = useStore();
  const { success, error, simulateSMS, simulateWhatsApp } = useNotifications();
  const [submitting, setSubmitting] = useState(false);

  const nights = calculateNights(formData.checkinDate, formData.checkoutDate);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (token) {
        // Invite-only token flow: Update the pre-existing record on backend
        const api = await import('../../api/client');
        const record = await api.submitVerificationByToken(token, {
          selfieData: formData.selfieData,
          idImageData: formData.idImageData,
          idType: formData.idType,
        });

        success('Verification submitted successfully!');
        onSubmitSuccess(record);
      } else {
        // Offline / Self-registration flow: Create new verification record
        // 1. Persist Verification
        const record = addVerification({
          guestName: formData.fullName,
          guestPhone: `${formData.countryCode} ${formData.phone}`,
          guestEmail: formData.email || null,
          guestCount: formData.guestCount,
          purpose: formData.purpose,
          bookingPlatform: formData.bookingPlatform || null,
          selfieData: formData.selfieData,
          idType: formData.idType,
          idImageData: formData.idImageData,
          checkinDate: formData.checkinDate,
          checkinTime: formData.checkinTime,
          checkoutDate: formData.checkoutDate,
          checkoutTime: formData.checkoutTime,
        });

        // 2. Generate Audit Timeline Events
        const events = [
          { eventType: 'link_sent' as const, actor: 'system' as const, description: `Verification link sent to ${formData.fullName}` },
          { eventType: 'details_submitted' as const, actor: 'guest' as const, description: 'Guest details submitted' },
          { eventType: 'selfie_uploaded' as const, actor: 'guest' as const, description: 'Selfie photo uploaded' },
          { eventType: 'id_uploaded' as const, actor: 'guest' as const, description: `${formData.idType} photo uploaded` },
          { eventType: 'submission_complete' as const, actor: 'guest' as const, description: 'Verification submission completed' },
        ];

        events.forEach((evt) => {
          addAuditEvent({
            verificationId: record.id,
            eventType: evt.eventType,
            actor: evt.actor,
            description: evt.description,
            metadata: null,
          });
        });

        success('Verification submitted successfully!');
        setTimeout(() => simulateSMS(formData.fullName, 'submission_received'), 800);
        setTimeout(() => simulateWhatsApp(formData.fullName, 'submission_received'), 1600);

        onSubmitSuccess(record);
      }
    } catch (err: any) {
      error(err.message || 'Failed to submit verification. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="customer-form-wrapper fadeIn">
      <h2 className="screen-title">Review Your Details</h2>
      <p className="screen-subtitle">Please verify everything looks correct before submitting.</p>

      <div className="review-card">
        {/* Photos review */}
        <div className="review-section">
          <div className="review-header">
            <h3>Photos</h3>
            <button type="button" className="edit-link" onClick={() => onEditStep('selfie')}>
              Edit
            </button>
          </div>
          <div className="review-photos">
            <div className="review-photo">
              {formData.selfieData ? (
                <img src={formData.selfieData} alt="Selfie preview" className="review-selfie-img" />
              ) : (
                <div className="review-selfie-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-tertiary)' }}>No Selfie</div>
              )}
              <span>Selfie</span>
            </div>

            <div className="review-photo">
              {formData.idImageData ? (
                <img src={formData.idImageData} alt="ID preview" className="review-id-img" />
              ) : (
                <div className="review-id-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-tertiary)' }}>No ID</div>
              )}
              <span>{formData.idType}</span>
            </div>
          </div>
        </div>

        <div className="review-divider" />

        {/* Personal info review */}
        <div className="review-section">
          <div className="review-header">
            <h3>Personal Details</h3>
            <button type="button" className="edit-link" onClick={() => onEditStep('details')}>
              Edit
            </button>
          </div>
          <div className="review-field">
            <span className="review-label">Name</span>
            <span className="review-value">{formData.fullName}</span>
          </div>
          <div className="review-field">
            <span className="review-label">Phone</span>
            <span className="review-value">
              {formData.countryCode} {formData.phone}
            </span>
          </div>
          <div className="review-field">
            <span className="review-label">Email</span>
            <span className="review-value">{formData.email || '—'}</span>
          </div>
          <div className="review-field">
            <span className="review-label">Guests</span>
            <span className="review-value">{formData.guestCount}</span>
          </div>
          <div className="review-field">
            <span className="review-label">Purpose</span>
            <span className="review-value">{formData.purpose}</span>
          </div>
          <div className="review-field">
            <span className="review-label">Platform</span>
            <span className="review-value">{formData.bookingPlatform || '—'}</span>
          </div>
        </div>

        <div className="review-divider" />

        {/* Stay dates review */}
        <div className="review-section">
          <div className="review-header">
            <h3>Stay Dates</h3>
            <button type="button" className="edit-link" onClick={() => onEditStep('dates')}>
              Edit
            </button>
          </div>
          <div className="review-field">
            <span className="review-label">Check-in</span>
            <span className="review-value">
              {formatDateTime(formData.checkinDate, formData.checkinTime)}
            </span>
          </div>
          <div className="review-field">
            <span className="review-label">Check-out</span>
            <span className="review-value">
              {formatDateTime(formData.checkoutDate, formData.checkoutTime)}
            </span>
          </div>
          <div className="review-field">
            <span className="review-label">Duration</span>
            <span className="review-value">
              {nights} night{nights !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="btn btn-primary btn-full btn-submit"
        disabled={submitting}
        onClick={handleSubmit}
      >
        {submitting ? '🔒 Submitting...' : '🔒 Submit for Verification'}
      </button>
    </div>
  );
};
export default ReviewSubmit;
