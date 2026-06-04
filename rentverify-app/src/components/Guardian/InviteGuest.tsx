import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useNotifications } from '../../context/NotificationContext';
import { Button } from '../Common/Button';
import type { Verification } from '../../types';

interface InviteGuestProps {
  onNavigate: (route: string) => void;
}

export const InviteGuest: React.FC<InviteGuestProps> = ({ onNavigate: _onNavigate }) => {
  const { addVerification } = useStore();
  const { success, error } = useNotifications();

  // Form states
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [purpose, setPurpose] = useState('Tourism');
  const [bookingPlatform, setBookingPlatform] = useState('Airbnb');
  const [checkinDate, setCheckinDate] = useState('');
  const [checkinTime, setCheckinTime] = useState('14:00');
  const [checkoutDate, setCheckoutDate] = useState('');
  const [checkoutTime, setCheckoutTime] = useState('11:00');

  // Interactive UI states
  const [isLoading, setIsLoading] = useState(false);
  const [inviteResult, setInviteResult] = useState<Verification | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!guestName.trim() || !guestPhone.trim() || !checkinDate || !checkoutDate) {
      error('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);

    try {
      // Create new verification entry using context store helper
      // This will handle local caching, optimistic updates, and dispatching notifications
      const newVerification = addVerification({
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        guestEmail: guestEmail.trim() || null,
        guestCount: Number(guestCount),
        purpose,
        bookingPlatform,
        checkinDate,
        checkinTime,
        checkoutDate,
        checkoutTime,
        selfieData: null,
        idType: 'Aadhaar',
        idImageData: null,
      });

      if (newVerification) {
        setInviteResult(newVerification);
        success(`Invitation generated for ${guestName.trim()}!`);
      } else {
        error('Failed to create invitation.');
      }
    } catch (err: any) {
      error(err.message || 'Error occurred while creating invitation.');
    } finally {
      setIsLoading(false);
    }
  };

  const getInviteLink = (token: string) => {
    return `${window.location.protocol}//${window.location.host}/?token=${token}`;
  };

  const handleCopyLink = () => {
    if (!inviteResult) return;
    const link = getInviteLink(inviteResult.linkToken);
    
    navigator.clipboard.writeText(link)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
      })
      .catch(() => {
        error('Failed to copy link.');
      });
  };

  const handleWhatsAppShare = () => {
    if (!inviteResult) return;
    const link = getInviteLink(inviteResult.linkToken);
    const cleanPhone = inviteResult.guestPhone.replace(/\D/g, '');
    const message = `Hello ${inviteResult.guestName}! Please complete your secure digital check-in verification for your upcoming stay from ${inviteResult.checkinDate} to ${inviteResult.checkoutDate} using this secure link: ${link}`;
    
    const waUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const handleReset = () => {
    setInviteResult(null);
    setGuestName('');
    setGuestPhone('');
    setGuestEmail('');
    setGuestCount(1);
    setPurpose('Tourism');
    setBookingPlatform('Airbnb');
    setCheckinDate('');
    setCheckoutDate('');
  };

  return (
    <main className="max-w-xl mx-auto px-container-margin pt-4 pb-28">
      {/* Page Header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-outline-variant -mx-container-margin px-container-margin py-3.5 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[24px]">add_circle</span>
            <h1 className="text-on-surface text-lg font-bold">Invite New Guest</h1>
          </div>
        </div>
      </header>

      {!inviteResult ? (
        <form onSubmit={handleSubmit} className="space-y-5 bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl shadow-sm animate-fade-in">
          <h2 className="text-sm font-semibold text-outline tracking-wider uppercase mb-1">Stay Reservation & Guest Details</h2>

          {/* Guest Name */}
          <div className="form-field flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface-variant">Guest Full Name *</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl text-sm font-medium outline-none transition-colors"
              placeholder="e.g. Priya Sharma"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
            />
          </div>

          {/* Contact Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-field flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface-variant">Phone Number (Real Alerts) *</label>
              <input
                type="tel"
                required
                className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl text-sm font-medium outline-none transition-colors"
                placeholder="e.g. +91 98765 43210"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
              />
            </div>
            <div className="form-field flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface-variant">Email Address (Optional)</label>
              <input
                type="email"
                className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl text-sm font-medium outline-none transition-colors"
                placeholder="e.g. priya@email.com"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Platform & Purpose Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-field flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface-variant">Booking Platform</label>
              <select
                className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl text-sm font-medium outline-none transition-colors appearance-none"
                value={bookingPlatform}
                onChange={(e) => setBookingPlatform(e.target.value)}
              >
                {['Airbnb', 'Booking.com', 'Agoda', 'Expedia', 'MakeMyTrip', 'Direct', 'Other'].map((plt) => (
                  <option key={plt} value={plt}>{plt}</option>
                ))}
              </select>
            </div>
            <div className="form-field flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface-variant">Purpose of Stay</label>
              <select
                className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl text-sm font-medium outline-none transition-colors appearance-none"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              >
                {['Tourism', 'Business', 'Family Visit', 'Medical', 'Student', 'Other'].map((pur) => (
                  <option key={pur} value={pur}>{pur}</option>
                ))}
              </select>
            </div>
            <div className="form-field flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface-variant">Guest Count</label>
              <input
                type="number"
                min={1}
                max={20}
                required
                className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl text-sm font-medium outline-none transition-colors"
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
              />
            </div>
          </div>

          <hr className="border-outline-variant/60 my-2" />
          <h2 className="text-sm font-semibold text-outline tracking-wider uppercase mb-1">Check-in & Check-out Schedules</h2>

          {/* Dates & Times Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Checkin Date */}
            <div className="form-field flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface-variant">Check-in Date *</label>
              <input
                type="date"
                required
                className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl text-sm font-medium outline-none transition-colors"
                value={checkinDate}
                onChange={(e) => setCheckinDate(e.target.value)}
              />
            </div>
            {/* Checkin Time */}
            <div className="form-field flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface-variant">Check-in Time</label>
              <input
                type="time"
                className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl text-sm font-medium outline-none transition-colors"
                value={checkinTime}
                onChange={(e) => setCheckinTime(e.target.value)}
              />
            </div>

            {/* Checkout Date */}
            <div className="form-field flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface-variant">Check-out Date *</label>
              <input
                type="date"
                required
                className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl text-sm font-medium outline-none transition-colors"
                value={checkoutDate}
                onChange={(e) => setCheckoutDate(e.target.value)}
              />
            </div>
            {/* Checkout Time */}
            <div className="form-field flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface-variant">Check-out Time</label>
              <input
                type="time"
                className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl text-sm font-medium outline-none transition-colors"
                value={checkoutTime}
                onChange={(e) => setCheckoutTime(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-3">
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="w-full py-3.5 flex items-center justify-center gap-2 rounded-xl text-sm font-bold shadow-md"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Generating Invite...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  Create Invitation Link
                </>
              )}
            </Button>
          </div>
        </form>
      ) : (
        /* Invite Success Card */
        <div className="bg-surface-container-lowest border border-[#10b981]/30 p-6 rounded-2xl shadow-lg animate-scale-up flex flex-col text-center items-center justify-center gap-4">
          <div className="size-16 rounded-full bg-[#10b981]/15 text-[#10b981] flex items-center justify-center">
            <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
          </div>

          <div>
            <h2 className="text-lg font-bold text-on-surface">Invitation Generated!</h2>
            <p className="text-xs text-on-surface-variant mt-1 max-w-sm">
              We've created a unique secure URL for **{inviteResult.guestName}**. Real SMS, WhatsApp, and Emails have been queued via our background gateways.
            </p>
          </div>

          {/* Details Summary Card */}
          <div className="w-full bg-surface-container p-4 rounded-xl border border-outline-variant text-left text-xs space-y-2 mt-2">
            <div className="flex justify-between">
              <span className="text-on-surface-variant font-medium">Guest Phone:</span>
              <span className="text-on-surface font-bold">{inviteResult.guestPhone}</span>
            </div>
            {inviteResult.guestEmail && (
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-medium">Guest Email:</span>
                <span className="text-on-surface font-bold">{inviteResult.guestEmail}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-on-surface-variant font-medium">Check-in:</span>
              <span className="text-on-surface font-bold">{inviteResult.checkinDate} @ {inviteResult.checkinTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant font-medium">Booking ID:</span>
              <span className="text-on-surface font-bold font-mono text-[10px]">{inviteResult.refCode}</span>
            </div>
          </div>

          {/* Secure URL copy segment */}
          <div className="w-full mt-2">
            <label className="block text-left text-[11px] font-bold text-outline uppercase mb-1">Personal Secure Link</label>
            <div className="relative flex items-center bg-surface-container rounded-xl border border-outline-variant p-1">
              <input
                type="text"
                readOnly
                value={getInviteLink(inviteResult.linkToken)}
                className="w-full bg-transparent pl-3 pr-20 py-2 text-xs font-semibold text-on-surface outline-none truncate"
              />
              <button
                onClick={handleCopyLink}
                className={`absolute right-1 px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1 ${
                  isCopied
                    ? 'bg-[#10b981] text-white'
                    : 'bg-secondary text-white hover:bg-secondary/90'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {isCopied ? 'done' : 'content_copy'}
                </span>
                {isCopied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Share Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-4 border-t border-outline-variant/60 mt-2">
            <button
              onClick={handleWhatsAppShare}
              className="py-3 flex items-center justify-center gap-2 rounded-xl text-xs font-bold bg-[#25d366] text-white hover:bg-[#25d366]/90 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">chat</span>
              WhatsApp Reminder
            </button>
            <button
              onClick={handleReset}
              className="py-3 flex items-center justify-center gap-2 rounded-xl text-xs font-bold bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">replay</span>
              Invite Another Guest
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default InviteGuest;
