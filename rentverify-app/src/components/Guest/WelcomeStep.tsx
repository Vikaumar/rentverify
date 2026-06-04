import React, { useState } from 'react';

interface WelcomeStepProps {
  onNext: () => void;
  guestName?: string;
  bookingPlatform?: string | null;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext, guestName, bookingPlatform }) => {
  const [consentChecked, setConsentChecked] = useState(false);

  return (
    <div className="customer-welcome-wrapper fadeIn">
      <div className="welcome-hero text-center mb-8">
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-secondary shadow-lg mx-auto mb-6 bg-surface-container flex items-center justify-center animate-pulse">
          <img src="/crazy_app_icon.png" alt="RentVerify Brand Logo" className="w-full h-full object-cover" />
        </div>
        <h1 className="welcome-title">
          {guestName ? `Welcome, ${guestName}` : 'Welcome to Sunrise Villa'}
        </h1>
        <p className="welcome-subtitle">
          {guestName 
            ? `Stay Verification (${bookingPlatform || 'Reservation'})` 
            : 'Guest Identity Verification'}
        </p>
      </div>

      <div className="welcome-body">
        <p className="welcome-description">
          For your safety and ours, we verify all guests before arrival. This quick process takes about <strong>2 minutes</strong>.
        </p>

        <div className="welcome-steps-preview">
          <div className="preview-step">
            <span className="step-num">1</span>
            <span>Your Details</span>
          </div>
          <div className="preview-step">
            <span className="step-num">2</span>
            <span>Take a Selfie</span>
          </div>
          <div className="preview-step">
            <span className="step-num">3</span>
            <span>Upload ID</span>
          </div>
          <div className="preview-step">
            <span className="step-num">4</span>
            <span>Stay Dates</span>
          </div>
        </div>

        <label className="consent-checkbox">
          <input
            type="checkbox"
            checked={consentChecked}
            onChange={(e) => setConsentChecked(e.target.checked)}
          />
          <span className="checkmark" />
          <span className="consent-text">
            I agree that my identity information will be securely stored for verification purposes and deleted after 90 days.
          </span>
        </label>

        <button
          className="btn btn-primary btn-full"
          disabled={!consentChecked}
          onClick={onNext}
        >
          Begin Verification →
        </button>

        <p className="welcome-footer">
          🔒 Your data is encrypted and secure. <a href="#/privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};
export default WelcomeStep;
