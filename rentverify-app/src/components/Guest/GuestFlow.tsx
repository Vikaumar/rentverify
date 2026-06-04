import React, { useState } from 'react';
import WelcomeStep from './WelcomeStep';
import DetailsStep from './DetailsStep';
import PhotoUpload from './PhotoUpload';
import StayDates from './StayDates';
import ReviewSubmit from './ReviewSubmit';
import ConfirmationStep from './ConfirmationStep';
import type { Verification } from '../../types';

import { useNotifications } from '../../context/NotificationContext';

interface GuestFlowProps {
  onReturnToDashboard: () => void;
  token?: string | null;
}

export const GuestFlow: React.FC<GuestFlowProps> = ({ onReturnToDashboard, token }) => {
  const { error, info } = useNotifications();
  const [step, setStep] = useState<'welcome' | 'details' | 'selfie' | 'id' | 'dates' | 'review' | 'confirmation'>('welcome');
  const [createdRecord, setCreatedRecord] = useState<Verification | null>(null);
  const [isPrefilled, setIsPrefilled] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    countryCode: '+91',
    email: '',
    guestCount: 1,
    purpose: 'Tourism',
    bookingPlatform: 'Airbnb',
    selfieData: null as string | null,
    idType: 'Aadhaar',
    idImageData: null as string | null,
    checkinDate: '',
    checkinTime: '14:00',
    checkoutDate: '',
    checkoutTime: '11:00',
  });

  // Pull guest invitation details on mount if token is provided
  React.useEffect(() => {
    if (token) {
      import('../../api/client').then(async (api) => {
        try {
          const record = await api.fetchVerificationByToken(token);
          setFormData({
            fullName: record.guestName,
            phone: record.guestPhone.replace(/^\+\d+\s*/, ''), // Strip country code if present
            countryCode: record.guestPhone.match(/^\+\d+/)?.[0] || '+91',
            email: record.guestEmail || '',
            guestCount: record.guestCount || 1,
            purpose: record.purpose || 'Tourism',
            bookingPlatform: record.bookingPlatform || 'Airbnb',
            selfieData: record.selfieData || null,
            idType: record.idType || 'Aadhaar',
            idImageData: record.idImageData || null,
            checkinDate: record.checkinDate,
            checkinTime: record.checkinTime || '14:00',
            checkoutDate: record.checkoutDate,
            checkoutTime: record.checkoutTime || '11:00',
          });
          setIsPrefilled(true);
          info(`Reservation loaded for ${record.guestName}!`);
        } catch (err: any) {
          console.error('[GuestFlow] Token lookup failed:', err);
          error(err.message || 'Invitation link is invalid or expired.');
        }
      });
    }
  }, [token, error, info]);

  const handleDetailsNext = (detailsData: {
    fullName: string;
    phone: string;
    countryCode: string;
    email: string;
    guestCount: number;
    purpose: string;
    bookingPlatform: string;
  }) => {
    setFormData((prev) => ({ ...prev, ...detailsData }));
    setStep('selfie');
  };

  const handleSelfieNext = (selfieDataURL: string) => {
    setFormData((prev) => ({ ...prev, selfieData: selfieDataURL }));
    setStep('id');
  };

  const handleIdNext = (idDataURL: string) => {
    setFormData((prev) => ({ ...prev, idImageData: idDataURL }));
    // If details are pre-filled, skip the dates page
    setStep(isPrefilled ? 'review' : 'dates');
  };

  const handleDatesNext = (datesData: { checkinDate: string; checkinTime: string; checkoutDate: string; checkoutTime: string }) => {
    setFormData((prev) => ({ ...prev, ...datesData }));
    setStep('review');
  };

  const handleSubmitSuccess = (record: Verification) => {
    setCreatedRecord(record);
    setStep('confirmation');
  };

  const handleEditJump = (jumpStep: 'details' | 'selfie' | 'id' | 'dates') => {
    setStep(jumpStep);
  };

  return (
    <section className="screen screen-customer">
      {step === 'welcome' && (
        <WelcomeStep 
          onNext={() => setStep(isPrefilled ? 'selfie' : 'details')} 
          guestName={isPrefilled ? formData.fullName : undefined}
          bookingPlatform={isPrefilled ? formData.bookingPlatform : undefined}
        />
      )}
      {step === 'details' && (
        <DetailsStep
          initialData={formData}
          onNext={handleDetailsNext}
          onBack={() => setStep('welcome')}
        />
      )}
      {step === 'selfie' && (
        <PhotoUpload
          type="selfie"
          initialImage={formData.selfieData}
          onNext={handleSelfieNext}
          onBack={() => setStep(isPrefilled ? 'welcome' : 'details')}
        />
      )}
      {step === 'id' && (
        <PhotoUpload
          type="id"
          initialImage={formData.idImageData}
          idType={formData.idType}
          onIdTypeChange={(val) => setFormData((prev) => ({ ...prev, idType: val }))}
          onNext={handleIdNext}
          onBack={() => setStep('selfie')}
        />
      )}
      {step === 'dates' && (
        <StayDates
          initialData={formData}
          onNext={handleDatesNext}
          onBack={() => setStep('id')}
        />
      )}
      {step === 'review' && (
        <ReviewSubmit
          formData={formData}
          onEditStep={handleEditJump}
          onSubmitSuccess={handleSubmitSuccess}
          token={token}
        />
      )}
      {step === 'confirmation' && (
        <ConfirmationStep
          record={createdRecord}
          onReturnToDashboard={onReturnToDashboard}
          isGuest={isPrefilled}
        />
      )}
    </section>
  );
};
export default GuestFlow;
