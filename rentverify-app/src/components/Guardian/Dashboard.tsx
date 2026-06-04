import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useNotifications } from '../../context/NotificationContext';
import { formatRelativeTime } from '../../utils';
import { Modal } from '../Common/Modal';
import type { Verification } from '../../types';

// Helper to format last-synced timestamp
function formatSyncTime(isoString: string | null): string {
  if (!isoString) return 'Never';
  const diff = Date.now() - new Date(isoString).getTime();
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function cleanPhoneForUrl(phoneStr: string): string {
  return phoneStr.replace(/[^0-9]/g, '');
}


interface DashboardProps {
  onNavigate: (route: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, getPendingVerifications, getUpcomingArrivals, connectionStatus, lastSyncedAt, exportAllData, refreshData, logout, isBiometricsRegistered, registerBiometrics } = useStore();
  const { success, error } = useNotifications();
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const pending = getPendingVerifications();
  const arrivals = getUpcomingArrivals();

  // Calculate total counts across all time (not just today)
  const { verifications } = useStore();
  const totalApproved = verifications.filter(v => v.status === 'approved').length;
  const totalRejected = verifications.filter(v => v.status === 'rejected').length;
  const totalFlagged = verifications.filter(v => v.status === 'flagged').length;
  const totalPending = verifications.filter(v => v.status === 'pending').length;

  // Support Modal State
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [chatStep, setChatStep] = useState<'directory' | 'chat'>('directory');
  const [chatResponse, setChatResponse] = useState<string | null>(null);

  // Custom high-key studio portrait specified in the updated design
  const officerAvatarUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuD_mxd2hKaK4VvUDRS51r4z3ZNiQ2C1eRzIK_W2adwv88lVe5yUNzynVvPVQkOvk4mHpn1koVRQuTTm_BmIBlQoVN4n6CbNYs0jE5eFcmzBxp6zamshohtAbFjqCNrM9nbCdLn1Ek1NyPQUtmNmSN5U3rD9joRoJQCFaYNWbfQsL7cGFFfro7Oc5K45fHXtvW7FIqmUbaQMdJp603D4xeuze7Ij32OOO_vYCBGlexzGGi6FyyyYSXvArDtePWcItKuWM5hr1MjGfnbs";

  // Calculate dynamic progress bar percentages
  const totalVerifications = totalApproved + totalPending + totalFlagged + totalRejected;
  const verifiedPercent = totalVerifications > 0 ? Math.round((totalApproved / totalVerifications) * 100) : 0;
  const pendingPercent = totalVerifications > 0 ? Math.round((totalPending / totalVerifications) * 100) : 0;
  const flaggedPercent = totalVerifications > 0 ? Math.round((totalFlagged / totalVerifications) * 100) : 0;

  // Helper to render initials avatar if no photo
  const renderAvatar = (v: Verification) => {
    if (v.selfieData) {
      return (
        <img
          className="w-full h-full object-cover"
          alt={v.guestName}
          src={v.selfieData}
        />
      );
    }
    const initial = v.guestName ? v.guestName.charAt(0).toUpperCase() : '?';
    return (
      <div className="w-full h-full flex items-center justify-center bg-surface-variant text-on-surface-variant font-bold text-base">
        {initial}
      </div>
    );
  };

  const handleSupportQuery = (response: string) => {
    setChatResponse(response);
  };

  return (
    <main className="max-w-xl mx-auto px-5 pt-4 pb-28 w-full flex flex-col bg-background">
      {/* Header / Shared TopAppBar Mock */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-outline-variant -mx-5 px-5 py-3 mb-2">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <div 
              onClick={() => onNavigate('profile')}
              className="w-10 h-10 rounded-full border-2 border-primary-container bg-cover bg-center shrink-0 shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-all" 
              style={{ backgroundImage: `url(${user?.avatarUrl || officerAvatarUrl})` }}
              title="View Profile"
            />
            <div className="flex-1 px-3">
              <p className="text-on-surface-variant text-[11px] leading-none mb-0.5">Welcome back, {user?.name ? user.name.split(' ')[0] : 'Guardian'}</p>
              <h2 
                onClick={() => onNavigate('profile')}
                className="text-on-surface text-sm font-bold leading-tight flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                title="View Profile"
              >
                <img src="/crazy_app_icon.png" alt="RentVerify Logo" className="w-5 h-5 rounded-full object-cover shrink-0" />
                RentVerify Guardian
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => onNavigate('pending')}
              className="relative flex size-10 cursor-pointer items-center justify-center rounded-full hover:bg-surface-container-high transition-colors"
              title="Notifications"
            >
              <span className="material-symbols-outlined text-primary text-[24px]">notifications</span>
              {pending.length > 0 && (
                <span className="absolute top-2.5 right-2.5 block h-2 w-2 rounded-full bg-error ring-1 ring-background"></span>
              )}
            </button>
            <button 
              onClick={logout}
              className="flex size-10 cursor-pointer items-center justify-center rounded-full hover:bg-error-container/10 text-error transition-colors"
              title="Sign Out"
            >
              <span className="material-symbols-outlined text-[22px]">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Connection Status Banner */}
      <div className="flex items-center justify-between px-1 py-2 mb-4">
        <div className="flex items-center gap-2">
          <span className={`block h-2 w-2 rounded-full ${
            connectionStatus === 'online' ? 'bg-[#10b981]' :
            connectionStatus === 'syncing' ? 'bg-amber-400 animate-pulse' :
            'bg-error'
          }`} />
          <span className="text-[11px] font-semibold text-on-surface-variant">
            {connectionStatus === 'online' ? '☁️ Cloud Connected' :
             connectionStatus === 'syncing' ? '🔄 Syncing...' :
             '💾 Offline Mode'}
          </span>
        </div>
        <span className="text-[10px] font-medium text-outline">
          Synced: {formatSyncTime(lastSyncedAt)}
        </span>
      </div>

      {/* Hero Progress Section */}
      <section className="pb-4">
        <h2 className="text-on-surface text-lg font-bold mb-3">Daily Progress</h2>
        <div className="grid grid-cols-3 gap-3">
          {/* Verified Card */}
          <div 
            onClick={() => onNavigate('audit/approved')}
            className="flex flex-col gap-2 rounded-xl p-4 bg-surface-container-lowest border border-outline-variant shadow-soft transition-transform active:scale-95 cursor-pointer"
          >
            <p className="text-on-surface-variant text-[11px] font-medium">Verified</p>
            <p className="text-primary text-2xl font-bold">{totalApproved}</p>
            <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-secondary transition-all duration-500" style={{ width: `${verifiedPercent || 0}%` }}></div>
            </div>
          </div>

          {/* Pending Card */}
          <div 
            onClick={() => onNavigate('pending')}
            className="flex flex-col gap-2 rounded-xl p-4 bg-surface-container-lowest border border-outline-variant shadow-soft transition-transform active:scale-95 cursor-pointer"
          >
            <p className="text-on-surface-variant text-[11px] font-medium">Pending</p>
            <p className="text-on-surface text-2xl font-bold">{totalPending}</p>
            <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-tertiary-fixed-dim transition-all duration-500" style={{ width: `${pendingPercent || 0}%` }}></div>
            </div>
          </div>

          {/* Flagged Card */}
          <div 
            onClick={() => onNavigate('audit/flagged')}
            className="flex flex-col gap-2 rounded-xl p-4 bg-surface-container-lowest border border-outline-variant shadow-soft transition-transform active:scale-95 cursor-pointer"
          >
            <p className="text-on-surface-variant text-[11px] font-medium">Flagged</p>
            <p className="text-error text-2xl font-bold">{totalFlagged}</p>
            <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-error transition-all duration-500" style={{ width: `${flaggedPercent || 0}%` }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Tasks Section */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-on-surface text-base font-bold">Tasks for Today</h2>
          <button 
            onClick={() => onNavigate('pending')}
            className="text-secondary text-xs font-bold py-2 px-1 hover:underline"
          >
            View All
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Render Pending Tasks first */}
          {pending.length === 0 && arrivals.length === 0 ? (
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-soft text-center">
              <span className="material-symbols-outlined text-[36px] text-outline opacity-40">done_all</span>
              <p className="text-sm font-semibold text-on-surface mt-2">All Caught Up!</p>
              <p className="text-xs text-on-surface-variant mt-1">No pending tasks remaining today.</p>
            </div>
          ) : (
            <>
              {/* Dynamic Pending verification items */}
              {pending.map((v) => (
                <div 
                  key={v.id}
                  onClick={() => onNavigate(`detail/${v.id}`)}
                  className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-xl shadow-soft border border-outline-variant hover:border-secondary transition-all cursor-pointer hover:-translate-y-0.5 duration-200"
                >
                  <div className="size-14 rounded-lg overflow-hidden shrink-0">
                    {renderAvatar(v)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-on-surface font-bold text-sm truncate">{v.guestName}</h3>
                    <p className="text-on-surface-variant text-[11px] mt-0.5">
                      ID: {v.refCode.slice(0, 12)} • {formatRelativeTime(v.submittedAt)}
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <span className="inline-flex items-center rounded-full bg-surface-container-high px-2.5 py-0.5 text-[10px] font-bold text-primary">
                      Pending
                    </span>
                    <span className="material-symbols-outlined text-outline-variant text-[18px]">chevron_right</span>
                  </div>
                </div>
              ))}

              {/* Dynamic Completed/Verified arrivals */}
              {arrivals.map((v) => (
                <div 
                  key={v.id}
                  onClick={() => onNavigate(`audit-detail/${v.id}`)}
                  className="flex items-center gap-4 bg-surface-container-low p-4 rounded-xl border border-transparent opacity-75 grayscale-[0.5] hover:opacity-90 transition-opacity cursor-pointer duration-200"
                >
                  <div className="size-14 rounded-lg overflow-hidden shrink-0 border border-outline-variant">
                    {renderAvatar(v)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-on-surface font-bold text-sm truncate">{v.guestName}</h3>
                    <p className="text-on-surface-variant text-[11px] mt-0.5">
                      ID: {v.refCode.slice(0, 12)} • Verified {v.reviewedAt ? formatRelativeTime(v.reviewedAt) : 'recently'}
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <span className="inline-flex items-center rounded-full bg-secondary/10 px-2.5 py-0.5 text-[10px] font-bold text-secondary">
                      Verified
                    </span>
                    <span className="material-symbols-outlined text-outline-variant text-[18px]">check_circle</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </section>

      {/* Biometric Setup Prompt Banner */}
      {!isBiometricsRegistered && (
        <section className="mt-6 fadeIn">
          <div className="bg-gradient-to-r from-primary-container to-[#1b365d] text-white p-4.5 rounded-2xl shadow-soft border border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-full bg-white/10 flex items-center justify-center text-tertiary-fixed shrink-0">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>fingerprint</span>
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold tracking-wide">Enable Biometric Login</h4>
                <p className="text-[10px] text-outline-variant mt-0.5 max-w-[220px] leading-tight">
                  Sign in instantly next time using Windows Hello Face ID or Fingerprint scanning.
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                success('Initializing secure hardware key registration...');
                try {
                  const ok = await registerBiometrics();
                  if (ok) {
                    success('Windows Hello biometric key registered successfully!');
                  } else {
                    error('Registration was canceled by the user.');
                  }
                } catch (err: any) {
                  error(err.message || 'Failed to register biometric key.');
                }
              }}
              className="px-5 py-3 bg-tertiary-fixed hover:bg-white text-on-tertiary-fixed rounded-xl text-[11px] font-bold shrink-0 transition-colors shadow-sm active:scale-95 text-center flex items-center justify-center"
            >
              Setup ➔
            </button>
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="mt-8">
        <h2 className="text-on-surface text-base font-bold mb-3.5">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => onNavigate('customer')}
            className="flex flex-col items-center justify-center gap-2.5 bg-primary text-on-primary py-5 rounded-2xl shadow-lg transition-transform active:scale-95 hover:bg-primary-container hover:text-on-primary-container duration-200"
          >
            <span className="material-symbols-outlined text-2xl">add_a_photo</span>
            <span className="text-xs font-bold">New Scan</span>
          </button>
          
          <button 
            onClick={async () => {
              setIsExporting(true);
              try {
                await exportAllData();
                success('Data exported successfully!');
              } catch {
                success('Export failed — check console.');
              }
              setIsExporting(false);
            }}
            disabled={isExporting}
            className="flex flex-col items-center justify-center gap-2.5 bg-surface-container-highest text-secondary py-5 rounded-2xl border border-outline-variant transition-transform active:scale-95 hover:bg-surface-container-high duration-200"
          >
            <span className={`material-symbols-outlined text-2xl ${isExporting ? 'animate-spin' : ''}`}>
              {isExporting ? 'sync' : 'download'}
            </span>
            <span className="text-xs font-bold">{isExporting ? 'Exporting...' : 'Export Data'}</span>
          </button>

          <button 
            onClick={async () => {
              setIsRefreshing(true);
              await refreshData();
              setTimeout(() => setIsRefreshing(false), 600);
              success('Data refreshed!');
            }}
            disabled={isRefreshing}
            className="flex flex-col items-center justify-center gap-2.5 bg-surface-container-highest text-primary py-5 rounded-2xl border border-outline-variant transition-transform active:scale-95 hover:bg-surface-container-high duration-200"
          >
            <span className={`material-symbols-outlined text-2xl ${isRefreshing ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span className="text-xs font-bold">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          
          <button 
            onClick={() => {
              setChatStep('directory');
              setChatResponse(null);
              setIsSupportOpen(true);
            }}
            className="flex flex-col items-center justify-center gap-2.5 bg-surface-container-highest text-primary py-5 rounded-2xl border border-outline-variant transition-transform active:scale-95 hover:bg-surface-container-high duration-200 animate-pulse-subtle"
          >
            <span className="material-symbols-outlined text-2xl">support_agent</span>
            <span className="text-xs font-bold">Support</span>
          </button>
        </div>
      </section>

      {/* ===================== BRAND NEW HELP & SUPPORT MODAL ===================== */}
      <Modal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)}>
        <div className="text-left">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-outline-variant">
            <span className="material-symbols-outlined text-secondary text-[26px]">support_agent</span>
            <h3 className="text-on-surface font-bold text-base leading-tight">Help & Support Center</h3>
          </div>

          {chatStep === 'directory' ? (
            <div className="space-y-4">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Need help with Sunrise Villa identity verifications? Reach our dedicated support team 24/7.
              </p>

              {/* Support Contacts Directory */}
              <div className="space-y-2">
                <a 
                  href={`tel:${cleanPhoneForUrl(user?.phone || '+91 800 555 0199')}`}
                  onClick={() => success('Initiating helpline call...')}
                  className="flex items-center gap-3 p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/60 hover:bg-surface-container transition-colors text-xs font-semibold text-on-surface"
                >
                  <span className="material-symbols-outlined text-secondary text-[20px]">phone_in_talk</span>
                  <div>
                    <span className="block text-[10px] text-on-surface-variant font-medium">24/7 Phone Helpline</span>
                    <span>{user?.phone || '+91 800 555 0199'}</span>
                  </div>
                </a>

                <a 
                  href={`https://wa.me/${cleanPhoneForUrl(user?.phone || '+91 98765 43210')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => success('Opening WhatsApp Support chat...')}
                  className="flex items-center gap-3 p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/60 hover:bg-surface-container transition-colors text-xs font-semibold text-on-surface"
                >
                  <span className="material-symbols-outlined text-[#25D366] text-[20px]">chat</span>
                  <div>
                    <span className="block text-[10px] text-on-surface-variant font-medium">WhatsApp Support Agent</span>
                    <span>{user?.phone || '+91 98765 43210'}</span>
                  </div>
                </a>

                <a 
                  href={`mailto:${user?.email || 'support@rentverify.com'}`}
                  onClick={() => success('Opening mail client...')}
                  className="flex items-center gap-3 p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/60 hover:bg-surface-container transition-colors text-xs font-semibold text-on-surface"
                >
                  <span className="material-symbols-outlined text-secondary text-[20px]">mail</span>
                  <div>
                    <span className="block text-[10px] text-on-surface-variant font-medium">Support Email Ticket</span>
                    <span>{user?.email || 'support@rentverify.com'}</span>
                  </div>
                </a>
              </div>

              {/* Launch Simulated Live Chatbot */}
              <button 
                onClick={() => setChatStep('chat')}
                className="w-full py-3 bg-secondary text-white hover:bg-primary rounded-xl font-bold flex items-center justify-center gap-2 text-xs shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">forum</span>
                Chat with RentVerify AI
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/60 flex gap-2">
                <span className="material-symbols-outlined text-secondary text-[18px] shrink-0">smart_toy</span>
                <div>
                  <span className="block text-[9px] font-bold text-outline uppercase tracking-wider">AI Support Bot</span>
                  <p className="text-xs text-on-surface font-semibold mt-0.5 leading-snug">
                    Hello Guardian {user?.name ? user.name.split(' ')[0] : 'Ramesh'}! Select a common query below to get instant answers.
                  </p>
                </div>
              </div>

              {/* Bot response block */}
              {chatResponse && (
                <div className="bg-[#eff4ff] border border-secondary/30 p-3 rounded-xl flex gap-2 fadeIn shadow-sm">
                  <span className="material-symbols-outlined text-[#115cb9] text-[18px] shrink-0">info</span>
                  <p className="text-xs font-medium text-on-surface leading-relaxed">
                    {chatResponse}
                  </p>
                </div>
              )}

              {/* Quick Query Taps */}
              <div className="flex flex-col gap-1.5">
                <button 
                  onClick={() => handleSupportQuery(
                    "To verify a flagged ID: please check the high-res ID scan against the selfie. If you are satisfied it's authentic, you can add a note and tap 'Approve'. If highly suspicious, confirm the 'Flag' to escalate."
                  )}
                  className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant hover:bg-[#e5eeff] hover:border-[#115cb9] rounded-xl text-left text-xs font-semibold text-on-surface truncate"
                >
                  ❓ How to approve a flagged ID?
                </button>
                
                <button 
                  onClick={() => handleSupportQuery(
                    "If a guest's link has expired: you can simply navigate to the guest's profile from your dashboard and trigger a 'Resend link' action to generate a fresh 24-hour verification token."
                  )}
                  className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant hover:bg-[#e5eeff] hover:border-[#115cb9] rounded-xl text-left text-xs font-semibold text-on-surface truncate"
                >
                  ❓ Guest verification link is expired
                </button>

                <button 
                  onClick={() => handleSupportQuery(
                    "Camera glitch: if a guest experiences camera loading errors, ask them to clear their browser cache, enable camera permissions, or upload a photo directly from their gallery instead."
                  )}
                  className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant hover:bg-[#e5eeff] hover:border-[#115cb9] rounded-xl text-left text-xs font-semibold text-on-surface truncate"
                >
                  ❓ Camera upload glitch on mobile
                </button>
              </div>

              {/* Back to main support directory */}
              <button 
                onClick={() => {
                  setChatStep('directory');
                  setChatResponse(null);
                }}
                className="w-full py-2 border border-outline text-on-surface-variant hover:bg-surface-container-low rounded-xl font-bold flex items-center justify-center gap-1.5 text-xs"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Back to Helpline Directory
              </button>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end mt-4 pt-2 border-t border-outline-variant/60">
            <button 
              onClick={() => setIsSupportOpen(false)}
              className="py-1.5 px-4 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold rounded-lg text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
};

export default Dashboard;
