import React, { useState } from 'react';
import { clamp } from '../../utils';

interface DetailsData {
  fullName: string;
  phone: string;
  countryCode: string;
  email: string;
  guestCount: number;
  purpose: string;
  bookingPlatform: string;
}

interface DetailsStepProps {
  initialData: DetailsData;
  onNext: (data: DetailsData) => void;
  onBack: () => void;
}

export const DetailsStep: React.FC<DetailsStepProps> = ({ initialData, onNext, onBack }) => {
  const [formData, setFormData] = useState<DetailsData>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof DetailsData, string>>>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    const field = id.replace('input-', '') as keyof DetailsData;
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleGuestsChange = (change: number) => {
    setFormData((prev) => {
      const nextCount = clamp(prev.guestCount + change, 1, 10);
      return { ...prev, guestCount: nextCount };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Partial<Record<keyof DetailsData, string>> = {};

    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Please enter your full name (at least 2 characters)';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.purpose) {
      newErrors.purpose = 'Please select a purpose of stay';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onNext(formData);
  };

  return (
    <div className="customer-form-wrapper fadeIn">
      <div className="progress-bar">
        <div className="progress-steps">
          <div className="progress-step active"><span>1</span></div>
          <div className="progress-line active" />
          <div className="progress-step"><span>2</span></div>
          <div className="progress-line" />
          <div className="progress-step"><span>3</span></div>
          <div className="progress-line" />
          <div className="progress-step"><span>4</span></div>
        </div>
        <p className="progress-label">Step 1 of 4 — Your Details</p>
      </div>

      <form onSubmit={handleSubmit} className="form" noValidate>
        <div className="form-field">
          <label htmlFor="input-fullName">Full Name *</label>
          <input
            type="text"
            id="input-fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            placeholder="Enter your full name"
            required
            autoComplete="name"
          />
          {errors.fullName && <span className="field-error">{errors.fullName}</span>}
        </div>

        <div className="form-field">
          <label htmlFor="input-phone">Phone Number *</label>
          <div className="phone-input-group">
            <select
              id="input-countryCode"
              className="country-code-select"
              value={formData.countryCode}
              onChange={handleInputChange}
            >
              <option value="+91">🇮🇳 +91</option>
              <option value="+1">🇺🇸 +1</option>
              <option value="+44">🇬🇧 +44</option>
              <option value="+61">🇦🇺 +61</option>
              <option value="+971">🇦🇪 +971</option>
            </select>
            <input
              type="tel"
              id="input-phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="98765 43210"
              required
              autoComplete="tel"
            />
          </div>
          {errors.phone && <span className="field-error">{errors.phone}</span>}
        </div>

        <div className="form-field">
          <label htmlFor="input-email">Email Address</label>
          <input
            type="email"
            id="input-email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div className="form-field">
          <label htmlFor="input-guests">Number of Guests *</label>
          <div className="stepper">
            <button
              type="button"
              className="stepper-btn"
              onClick={() => handleGuestsChange(-1)}
            >
              −
            </button>
            <input
              type="number"
              id="input-guests"
              value={formData.guestCount}
              readOnly
            />
            <button
              type="button"
              className="stepper-btn"
              onClick={() => handleGuestsChange(1)}
            >
              +
            </button>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="input-purpose">Purpose of Stay *</label>
          <select
            id="input-purpose"
            value={formData.purpose}
            onChange={handleInputChange}
            required
          >
            <option value="" disabled>Select purpose</option>
            <option value="Tourism">Tourism</option>
            <option value="Business">Business</option>
            <option value="Family Visit">Family Visit</option>
            <option value="Event">Event</option>
            <option value="Other">Other</option>
          </select>
          {errors.purpose && <span className="field-error">{errors.purpose}</span>}
        </div>

        <div className="form-field">
          <label htmlFor="input-bookingPlatform">Booking Platform</label>
          <select
            id="input-bookingPlatform"
            value={formData.bookingPlatform}
            onChange={handleInputChange}
          >
            <option value="">Select platform (optional)</option>
            <option value="Airbnb">Airbnb</option>
            <option value="Booking.com">Booking.com</option>
            <option value="MakeMyTrip">MakeMyTrip</option>
            <option value="Direct">Direct Booking</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            ← Back
          </button>
          <button type="submit" className="btn btn-primary">
            Continue →
          </button>
        </div>
      </form>
    </div>
  );
};
export default DetailsStep;
