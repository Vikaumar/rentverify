import React, { useState } from 'react';
import { useStore } from './context/StoreContext';
import { useNotifications } from './context/NotificationContext';
import type { Verification } from './types';
import { formatDate } from './utils';

// Layout
import BottomNav from './components/Layout/BottomNav';
import ToastContainer from './components/Layout/ToastContainer';

// Common
import { Modal } from './components/Common/Modal';
import { BottomSheet } from './components/Common/BottomSheet';
import { ImageViewer } from './components/Common/ImageViewer';
import { Button } from './components/Common/Button';

// Guest View
import GuestFlow from './components/Guest/GuestFlow';

// Guardian Views
import Login from './components/Guardian/Login';
import Dashboard from './components/Guardian/Dashboard';
import PendingList from './components/Guardian/PendingList';
import GuestDetails from './components/Guardian/GuestDetails';
import AuditLog from './components/Guardian/AuditLog';
import AuditTimeline from './components/Guardian/AuditTimeline';
import InviteGuest from './components/Guardian/InviteGuest';
import Analytics from './components/Guardian/Analytics';
import Profile from './components/Guardian/Profile';

export const App: React.FC = () => {
  const { updateVerification, addAuditEvent, token } = useStore();
  const { success, error, warning, simulateSMS, simulateWhatsApp, simulateEscalation } = useNotifications();

  // Route state: dashboard, pending, audit, customer, detail, audit-detail
  const [route, setRoute] = useState<string>('dashboard');
  const [activeGuestId, setActiveGuestId] = useState<string | null>(null);

  // Modals & sheets state
  const [activeRecord, setActiveRecord] = useState<Verification | null>(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isFlagOpen, setIsFlagOpen] = useState(false);

  // Input states for Reject/Flag sheets
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectNote, setRejectNote] = useState<string>('');
  const [flagReason, setFlagReason] = useState<string>('');
  const [flagNote, setFlagNote] = useState<string>('');

  // Image lightbox viewer state
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // ---------- Navigation handler ----------
  const handleRouteChange = (newRoute: string) => {
    // Parse nested parameters (e.g. detail/123, audit-detail/123)
    const parts = newRoute.split('/');
    const mainRoute = parts[0];
    const param = parts[1] || null;

    setRoute(mainRoute);
    if (param) {
      setActiveGuestId(param);
    } else {
      setActiveGuestId(null);
    }
  };

  // ---------- Image viewer triggers ----------
  const triggerImageViewer = (src: string) => {
    setLightboxSrc(src);
    setIsLightboxOpen(true);
  };

  // ---------- Decision modal triggers ----------
  const triggerApprove = (v: Verification) => {
    setActiveRecord(v);
    setIsApproveOpen(true);
  };

  const triggerReject = (v: Verification) => {
    setActiveRecord(v);
    setRejectReason('');
    setRejectNote('');
    setIsRejectOpen(true);
  };

  const triggerFlag = (v: Verification) => {
    setActiveRecord(v);
    setFlagReason('');
    setFlagNote('');
    setIsFlagOpen(true);
  };

  // ---------- Approve confirm dispatcher ----------
  const confirmApprove = (guardianNoteText = '', directVerification?: Verification | null) => {
    const record = directVerification || activeRecord;
    if (!record) return;
    const vId = record.id;
    const guestName = record.guestName;
    const now = new Date().toISOString();

    updateVerification(vId, {
      status: 'approved',
      reviewedAt: now,
      reviewedBy: 'Ramesh',
      guardianNote: guardianNoteText.trim() || null,
    });

    addAuditEvent({
      verificationId: vId,
      eventType: 'approved',
      actor: 'guardian',
      description: 'Approved by Guardian Ramesh',
      metadata: guardianNoteText.trim() ? { note: guardianNoteText.trim() } : null,
    });

    addAuditEvent({
      verificationId: vId,
      eventType: 'sms_sent',
      actor: 'system',
      description: 'Approval SMS sent to guest',
      metadata: null,
    });

    addAuditEvent({
      verificationId: vId,
      eventType: 'whatsapp_sent',
      actor: 'system',
      description: 'Approval WhatsApp sent to guest',
      metadata: null,
    });

    setIsApproveOpen(false);
    setActiveRecord(null);
    success(`${guestName} has been approved!`);

    setTimeout(() => simulateSMS(guestName, 'approved'), 800);
    setTimeout(() => simulateWhatsApp(guestName, 'approved'), 1600);

    setRoute('pending');
  };

  // ---------- Reject confirm dispatcher ----------
  const confirmReject = () => {
    if (!activeRecord || !rejectReason) return;
    const vId = activeRecord.id;
    const guestName = activeRecord.guestName;
    const now = new Date().toISOString();

    updateVerification(vId, {
      status: 'rejected',
      reviewedAt: now,
      reviewedBy: 'Ramesh',
      rejectionReason: rejectReason,
      guardianNote: rejectNote.trim() || null,
    });

    addAuditEvent({
      verificationId: vId,
      eventType: 'rejected',
      actor: 'guardian',
      description: `Rejected by Guardian Ramesh. Reason: ${rejectReason}`,
      metadata: { reason: rejectReason, note: rejectNote.trim() || null },
    });

    addAuditEvent({
      verificationId: vId,
      eventType: 'sms_sent',
      actor: 'system',
      description: 'Rejection SMS sent to guest',
      metadata: null,
    });

    addAuditEvent({
      verificationId: vId,
      eventType: 'whatsapp_sent',
      actor: 'system',
      description: 'Rejection WhatsApp sent to guest',
      metadata: null,
    });

    setIsRejectOpen(false);
    setActiveRecord(null);
    error(`${guestName} has been rejected.`);

    setTimeout(() => simulateSMS(guestName, 'rejected'), 800);
    setTimeout(() => simulateWhatsApp(guestName, 'rejected'), 1600);

    setRoute('pending');
  };

  // ---------- Flag confirm dispatcher ----------
  const confirmFlag = () => {
    if (!activeRecord || !flagReason || !flagNote.trim()) return;
    const vId = activeRecord.id;
    const guestName = activeRecord.guestName;
    const now = new Date().toISOString();

    updateVerification(vId, {
      status: 'flagged',
      reviewedAt: now,
      reviewedBy: 'Ramesh',
      flagReason: flagReason,
      guardianNote: flagNote.trim() || null,
    });

    addAuditEvent({
      verificationId: vId,
      eventType: 'flagged',
      actor: 'guardian',
      description: `Flagged by Guardian Ramesh. Reason: ${flagReason}`,
      metadata: { reason: flagReason, note: flagNote.trim() || null },
    });

    addAuditEvent({
      verificationId: vId,
      eventType: 'escalation_sent',
      actor: 'system',
      description: 'Escalation alert sent to property owner',
      metadata: null,
    });

    addAuditEvent({
      verificationId: vId,
      eventType: 'sms_sent',
      actor: 'system',
      description: 'Flag notification SMS sent to guest',
      metadata: null,
    });

    setIsFlagOpen(false);
    setActiveRecord(null);
    warning(`${guestName} has been flagged as suspicious.`);

    setTimeout(() => simulateEscalation(), 800);
    setTimeout(() => simulateSMS(guestName, 'flagged'), 1600);

    setRoute('pending');
  };

  // ---------- Find active record dynamically ----------
  const allVerifications = useStore().verifications;
  const currentVerification = activeGuestId
    ? allVerifications.find((v) => v.id === activeGuestId)
    : null;

  // Detect URL token for guest portal checks
  const searchParams = new URLSearchParams(window.location.search);
  const guestToken = searchParams.get('token');

  return (
    <main id="app">
      {/* Toast Alert floating notification panel */}
      <ToastContainer />

      {guestToken ? (
        <GuestFlow
          token={guestToken}
          onReturnToDashboard={() => {
            window.history.replaceState({}, document.title, window.location.pathname);
            setRoute('dashboard');
          }}
        />
      ) : !token ? (
        <Login />
      ) : (
        <>
          {/* Primary Routing display */}
          {route === 'dashboard' && (
            <Dashboard onNavigate={handleRouteChange} />
          )}

          {route === 'pending' && (
            <PendingList
              onNavigate={handleRouteChange}
              onApprove={triggerApprove}
              onReject={triggerReject}
              onFlag={triggerFlag}
            />
          )}

          {route === 'detail' && currentVerification && (
            <GuestDetails
              id={activeGuestId!}
              verification={currentVerification}
              onBack={() => setRoute('pending')}
              onImageClick={triggerImageViewer}
              onApprove={(noteText) => confirmApprove(noteText, currentVerification)}
              onReject={() => triggerReject(currentVerification)}
              onFlag={() => triggerFlag(currentVerification)}
              onResetToPending={() => {
                updateVerification(currentVerification.id, {
                  status: 'pending',
                  reviewedAt: null,
                  reviewedBy: null,
                  rejectionReason: null,
                  flagReason: null,
                  guardianNote: null,
                });
                addAuditEvent({
                  verificationId: currentVerification.id,
                  eventType: 'details_submitted',
                  actor: 'guardian',
                  description: 'Verification reopened and reset to Pending',
                  metadata: null,
                });
                success(`${currentVerification.guestName} has been reset to pending.`);
                setRoute('pending');
              }}
            />
          )}

          {route === 'audit' && (
            <AuditLog onNavigate={handleRouteChange} initialFilter={activeGuestId} />
          )}

          {route === 'audit-detail' && activeGuestId && (
            <AuditTimeline
              id={activeGuestId}
              onBack={() => setRoute('audit')}
              onImageClick={triggerImageViewer}
            />
          )}

          {route === 'invite' && (
            <InviteGuest onNavigate={handleRouteChange} />
          )}

          {route === 'analytics' && (
            <Analytics onNavigate={handleRouteChange} />
          )}

          {route === 'profile' && (
            <Profile onNavigate={handleRouteChange} />
          )}

          {route === 'customer' && (
            <GuestFlow onReturnToDashboard={() => setRoute('dashboard')} />
          )}

          {/* Responsive Bottom Navigator (visible only on Guardian Views) */}
          {route !== 'customer' && (
            <BottomNav currentRoute={route} onRouteChange={handleRouteChange} />
          )}

          {/* ===================== OVERLAY MODALS & DIALOGS ===================== */}

          {/* 1. Approve modal */}
          <Modal isOpen={isApproveOpen} onClose={() => setIsApproveOpen(false)}>
            <div className="modal-content">
              <div className="modal-icon">✅</div>
              <h3 className="modal-title">Approve Guest?</h3>
              <p className="modal-description">
                {activeRecord
                  ? `Approve ${activeRecord.guestName} for check-in on ${formatDate(activeRecord.checkinDate)}?`
                  : 'Approve this guest for check-in?'}
              </p>
              <div className="modal-actions">
                <Button variant="ghost" onClick={() => setIsApproveOpen(false)}>
                  Cancel
                </Button>
                <Button variant="approve" onClick={() => confirmApprove()}>
                  Approve
                </Button>
              </div>
            </div>
          </Modal>

          {/* 2. Reject Slide-up sheet */}
          <BottomSheet isOpen={isRejectOpen} onClose={() => setIsRejectOpen(false)}>
            <div className="bottom-sheet-content">
              <h3 className="sheet-title">Why are you rejecting this guest?</h3>
              <div className="reason-options">
                {[
                  "ID photo is unclear / unreadable",
                  "Face doesn't match ID",
                  "Suspicious or fraudulent ID",
                  "Incomplete information",
                  "Other",
                ].map((reason) => (
                  <label key={reason} className="reason-option">
                    <input
                      type="radio"
                      name="reject-reason"
                      value={reason}
                      checked={rejectReason === reason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                    <span className="reason-radio" />
                    <span className="reason-text">{reason}</span>
                  </label>
                ))}
              </div>
              <div className="form-field">
                <textarea
                  className="modal-textarea"
                  placeholder="Add a note (optional)..."
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="modal-actions">
                <Button variant="ghost" onClick={() => setIsRejectOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="reject"
                  onClick={confirmReject}
                  disabled={!rejectReason}
                >
                  Confirm Rejection
                </Button>
              </div>
            </div>
          </BottomSheet>

          {/* 3. Flag Slide-up sheet */}
          <BottomSheet isOpen={isFlagOpen} onClose={() => setIsFlagOpen(false)}>
            <div className="bottom-sheet-content">
              <h3 className="sheet-title">Why is this suspicious?</h3>
              <div className="reason-options">
                {[
                  "ID appears tampered / edited",
                  "Face partially matches but unsure",
                  "Details seem inconsistent",
                  "Previous bad experience",
                  "Other",
                ].map((reason) => (
                  <label key={reason} className="reason-option">
                    <input
                      type="radio"
                      name="flag-reason"
                      value={reason}
                      checked={flagReason === reason}
                      onChange={(e) => setFlagReason(e.target.value)}
                    />
                    <span className="reason-radio" />
                    <span className="reason-text">{reason}</span>
                  </label>
                ))}
              </div>
              <div className="form-field">
                <textarea
                  className="modal-textarea"
                  placeholder="Describe your concern (required)..."
                  value={flagNote}
                  onChange={(e) => setFlagNote(e.target.value)}
                  rows={2}
                  required
                />
              </div>
              <div className="modal-actions">
                <Button variant="ghost" onClick={() => setIsFlagOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="flag"
                  onClick={confirmFlag}
                  disabled={!flagReason || !flagNote.trim()}
                >
                  Confirm Flag
                </Button>
              </div>
            </div>
          </BottomSheet>

          {/* 4. Fullscreen image viewer lightbox */}
          <ImageViewer
            src={lightboxSrc}
            isOpen={isLightboxOpen}
            onClose={() => setIsLightboxOpen(false)}
          />
        </>
      )}
    </main>
  );
};
export default App;
