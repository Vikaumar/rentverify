import React, { useState, useEffect } from 'react';
import { calculateNights } from '../../utils';

interface DatesData {
  checkinDate: string;
  checkinTime: string;
  checkoutDate: string;
  checkoutTime: string;
}

interface StayDatesProps {
  initialData: DatesData;
  onNext: (data: DatesData) => void;
  onBack: () => void;
}

export const StayDates: React.FC<StayDatesProps> = ({ initialData, onNext, onBack }) => {
  const [formData, setFormData] = useState<DatesData>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof DatesData, string>>>({});
  const [nights, setNights] = useState<number>(0);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (formData.checkinDate && formData.checkoutDate) {
      setNights(calculateNights(formData.checkinDate, formData.checkoutDate));
    } else {
      setNights(0);
    }
  }, [formData.checkinDate, formData.checkoutDate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const field = id.replace('input-', '') as keyof DatesData;

    setFormData((prev) => {
      const nextData = { ...prev, [field]: value };

      // Auto-set checkout min and default value if checkin changes
      if (field === 'checkinDate') {
        if (!prev.checkoutDate || prev.checkoutDate <= value) {
          const nextDay = new Date(value);
          nextDay.setDate(nextDay.getDate() + 1);
          nextData.checkoutDate = nextDay.toISOString().split('T')[0];
        }
      }

      return nextData;
    });

    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Partial<Record<keyof DatesData, string>> = {};

    if (!formData.checkinDate) {
      newErrors.checkinDate = 'Check-in date is required';
    }
    if (!formData.checkoutDate) {
      newErrors.checkoutDate = 'Check-out date is required';
    }
    if (formData.checkinDate && formData.checkoutDate && formData.checkoutDate <= formData.checkinDate) {
      newErrors.checkoutDate = 'Check-out must be after check-in';
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
          <div className="progress-step completed"><span>✓</span></div>
          <div className="progress-line completed" />
          <div className="progress-step completed"><span>✓</span></div>
          <div className="progress-line completed" />
          <div className="progress-step completed"><span>✓</span></div>
          <div className="progress-line completed" />
          <div className="progress-step active"><span>4</span></div>
        </div>
        <p className="progress-label">Step 4 of 4 — Stay Dates</p>
      </div>

      <form onSubmit={handleSubmit} className="form" noValidate>
        <div className="dates-grid">
          <div className="form-field">
            <label htmlFor="input-checkinDate">Check-in Date *</label>
            <input
              type="date"
              id="input-checkinDate"
              min={todayStr}
              value={formData.checkinDate}
              onChange={handleInputChange}
              required
            />
            {errors.checkinDate && <span className="field-error">{errors.checkinDate}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="input-checkinTime">Check-in Time</label>
            <input
              type="time"
              id="input-checkinTime"
              value={formData.checkinTime}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-field">
            <label htmlFor="input-checkoutDate">Check-out Date *</label>
            <input
              type="date"
              id="input-checkoutDate"
              min={formData.checkinDate || todayStr}
              value={formData.checkoutDate}
              onChange={handleInputChange}
              required
            />
            {errors.checkoutDate && <span className="field-error">{errors.checkoutDate}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="input-checkoutTime">Check-out Time</label>
            <input
              type="time"
              id="input-checkoutTime"
              value={formData.checkoutTime}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {nights > 0 && (
          <div className="stay-summary">
            <span className="stay-icon">🌙</span>
            <span className="stay-duration">
              {nights} night{nights !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            ← Back
          </button>
          <button type="submit" className="btn btn-primary">
            Review Details →
          </button>
        </div>
      </form>
    </div>
  );
};
export default StayDates;
