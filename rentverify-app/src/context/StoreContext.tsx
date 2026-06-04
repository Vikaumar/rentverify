import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Verification, AuditEvent, DashboardStats } from '../types';
import * as api from '../api/client';
import type { ConnectionStatus } from '../api/client';

interface StoreContextType {
  verifications: Verification[];
  auditEvents: AuditEvent[];
  connectionStatus: ConnectionStatus;
  lastSyncedAt: string | null;
  user: {
    username: string;
    role: string;
    name?: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
    propertyName?: string;
  } | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isBiometricsRegistered: boolean;
  registerBiometrics: () => Promise<boolean>;
  loginWithBiometrics: () => Promise<boolean>;
  getVerificationById: (id: string) => Verification | undefined;
  getPendingVerifications: () => Verification[];
  getAllAuditableVerifications: () => Verification[];
  addVerification: (data: Omit<Verification, 'id' | 'refCode' | 'status' | 'submittedAt' | 'reviewedAt' | 'reviewedBy' | 'rejectionReason' | 'flagReason' | 'guardianNote' | 'linkToken' | 'linkExpiresAt'>) => Verification;
  updateVerification: (id: string, updates: Partial<Verification>) => Verification | null;
  addAuditEvent: (event: Omit<AuditEvent, 'id' | 'timestamp'>) => AuditEvent;
  getAuditEventsByVerificationId: (verificationId: string) => AuditEvent[];
  getStats: () => DashboardStats;
  getUpcomingArrivals: () => Verification[];
  resetToSeedData: () => void;
  refreshData: () => Promise<void>;
  searchVerifications: (query: string) => Verification[];
  filterByDateRange: (from: string, to: string) => Verification[];
  exportAllData: () => Promise<void>;
  updateUser: (updates: Partial<NonNullable<StoreContextType['user']>>) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// ─── Helpers ──────────────────────────────────────────────────────

function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function generateId(): string {
  const arr = new Uint8Array(4);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

function generateRefId(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `REF-${y}${m}${d}-${suffix}`;
}

function _makeSelfieAvatar(initials: string, bgColor: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="#1a1a2e"/>
    <circle cx="100" cy="100" r="80" fill="${bgColor}" opacity="0.85"/>
    <text x="100" y="115" font-family="Inter,Arial,sans-serif" font-size="56" font-weight="600" fill="#fff" text-anchor="middle">${initials}</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(svg);
}

function _makeIdCard(idType: string, accentColor: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200">
    <rect x="10" y="10" width="300" height="180" rx="12" fill="#1e1e30" stroke="${accentColor}" stroke-width="2"/>
    <rect x="10" y="10" width="300" height="40" rx="12" fill="${accentColor}" opacity="0.3"/>
    <text x="160" y="38" font-family="Inter,Arial,sans-serif" font-size="16" font-weight="700" fill="#fff" text-anchor="middle">${idType}</text>
    <rect x="30" y="70" width="80" height="80" rx="6" fill="#2a2a40"/>
    <text x="70" y="115" font-family="Inter,Arial,sans-serif" font-size="11" fill="#666" text-anchor="middle">PHOTO</text>
    <rect x="130" y="75" width="150" height="10" rx="3" fill="#2a2a40"/>
    <rect x="130" y="95" width="120" height="10" rx="3" fill="#2a2a40"/>
    <rect x="130" y="115" width="140" height="10" rx="3" fill="#2a2a40"/>
    <rect x="130" y="135" width="90" height="10" rx="3" fill="#2a2a40"/>
    <text x="160" y="175" font-family="Inter,Arial,sans-serif" font-size="9" fill="#444" text-anchor="middle">Government of India</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(svg);
}

function _isoOffset(offsetMs: number): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

function _dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

const STORAGE_KEY = 'rentverify_react_data';
const SYNC_QUEUE_KEY = 'rentverify_sync_queue';

// ─── Seed Data Generator ──────────────────────────────────────────

function buildSeedData() {
  const MS_HOUR = 3_600_000;

  // Compact factory for verification records
  function mkV(id: string, ref: string, st: Verification['status'], name: string, phone: string, email: string, cnt: number, purp: string, plat: string, init: string, clr: string, idt: string, ciOff: number, coOff: number, subOff: number, revOff?: number, rBy?: string, rejR?: string, flgR?: string, gNote?: string, tok?: string, ciT?: string): Verification {
    return { id, refCode: ref, status: st, guestName: name, guestPhone: phone, guestEmail: email, guestCount: cnt, purpose: purp, bookingPlatform: plat, selfieData: _makeSelfieAvatar(init, clr), idType: idt, idImageData: _makeIdCard(idt, clr), checkinDate: _dateOffset(ciOff), checkinTime: ciT || '14:00', checkoutDate: _dateOffset(coOff), checkoutTime: '11:00', submittedAt: _isoOffset(subOff), reviewedAt: revOff !== undefined ? _isoOffset(revOff) : null, reviewedBy: rBy || null, rejectionReason: rejR || null, flagReason: flgR || null, guardianNote: gNote || null, linkToken: tok || 'tok_' + id, linkExpiresAt: _isoOffset(24 * MS_HOUR) };
  }

  function mkE(vId: string, name: string, idt: string, subOff: number, revOff?: number, st?: string, extra?: string): AuditEvent[] {
    const e: AuditEvent[] = [
      { id: `e-${vId}-1`, verificationId: vId, eventType: 'link_sent', actor: 'system', description: `Link sent to ${name}`, timestamp: _isoOffset(subOff - 0.5 * MS_HOUR), metadata: null },
      { id: `e-${vId}-2`, verificationId: vId, eventType: 'details_submitted', actor: 'guest', description: 'Details submitted', timestamp: _isoOffset(subOff - 0.3 * MS_HOUR), metadata: null },
      { id: `e-${vId}-3`, verificationId: vId, eventType: 'selfie_uploaded', actor: 'guest', description: 'Selfie uploaded', timestamp: _isoOffset(subOff - 0.2 * MS_HOUR), metadata: null },
      { id: `e-${vId}-4`, verificationId: vId, eventType: 'id_uploaded', actor: 'guest', description: `${idt} uploaded`, timestamp: _isoOffset(subOff - 0.1 * MS_HOUR), metadata: null },
      { id: `e-${vId}-5`, verificationId: vId, eventType: 'submission_complete', actor: 'guest', description: 'Submission completed', timestamp: _isoOffset(subOff), metadata: null },
    ];
    if (revOff !== undefined && st) {
      e.push({ id: `e-${vId}-6`, verificationId: vId, eventType: 'guardian_viewed', actor: 'guardian', description: 'Viewed by Ramesh', timestamp: _isoOffset(revOff - 0.3 * MS_HOUR), metadata: null });
      e.push({ id: `e-${vId}-7`, verificationId: vId, eventType: st as AuditEvent['eventType'], actor: 'guardian', description: `${st.charAt(0).toUpperCase() + st.slice(1)} by Ramesh${extra ? ' — ' + extra : ''}`, timestamp: _isoOffset(revOff), metadata: { reviewedBy: 'Ramesh' } });
      e.push({ id: `e-${vId}-8`, verificationId: vId, eventType: 'sms_sent', actor: 'system', description: `SMS ${st} notification sent`, timestamp: _isoOffset(revOff), metadata: { messageType: st } });
    }
    return e;
  }

  // ───── 10 Pending Customers ─────────────────────────
  const verifications: Verification[] = [
    // PENDING (10)
    mkV('sv17', 'REF-20260601-AS17', 'pending', 'Amit Sharma', '+91 98989 89898', 'amit.sharma@gmail.com', 2, 'Tourism', 'Direct', 'AS', '#6C63FF', 'Aadhaar', 4, 7, -2*MS_HOUR),
    mkV('sv18', 'REF-20260601-SR18', 'pending', 'Sneha Reddy', '+91 87878 78787', 'sneha.reddy@yahoo.com', 1, 'Family Visit', 'Booking.com', 'SR', '#00B894', 'Passport', 3, 5, -5*MS_HOUR),
    mkV('sv19', 'REF-20260601-RV19', 'pending', 'Rahul Verma', '+91 76767 67676', 'rahul.verma@outlook.com', 3, 'Business', 'Agoda', 'RV', '#FDCB6E', 'Aadhaar', 5, 7, -10*MS_HOUR),
    mkV('sv20', 'REF-20260601-PP20', 'pending', 'Pooja Patel', '+91 65656 56565', 'pooja.patel@hotmail.com', 2, 'Tourism', 'Airbnb', 'PP', '#FFEAA7', 'Driving License', 6, 9, -12*MS_HOUR),
    mkV('sv21', 'REF-20260601-VM21', 'pending', 'Vikram Malhotra', '+91 94444 55555', 'vikram.m@gmail.com', 1, 'Business', 'MakeMyTrip', 'VM', '#E17055', 'Aadhaar', 2, 4, -4*MS_HOUR),
    mkV('sv22', 'REF-20260601-DR22', 'pending', 'Deepika Rao', '+91 83333 44444', 'deepika.rao@proton.me', 4, 'Tourism', 'Expedia', 'DR', '#0984E3', 'Voter ID', 7, 10, -18*MS_HOUR),
    mkV('sv23', 'REF-20260601-AN23', 'pending', 'Abhishek Nair', '+91 72222 33333', 'abhishek.n@corp.in', 2, 'Family Visit', 'Direct', 'AN', '#A29BFE', 'Aadhaar', 4, 8, -6*MS_HOUR),
    mkV('sv24', 'REF-20260601-KJ24', 'pending', 'Kirti Joshi', '+91 61111 22222', 'kirti.j@yahoo.in', 1, 'Tourism', 'Airbnb', 'KJ', '#00CEC9', 'Passport', 5, 8, -7*MS_HOUR),
    mkV('sv25', 'REF-20260601-MK25', 'pending', 'Manoj Kumar', '+91 90000 11111', 'manoj.k@outlook.in', 3, 'Business', 'OYO', 'MK', '#74B9FF', 'PAN Card', 8, 12, -8*MS_HOUR),
    mkV('sv26', 'REF-20260601-PS26', 'pending', 'Preeti Singh', '+91 80000 99999', 'preeti.s@gmail.com', 2, 'Student', 'Booking.com', 'PS', '#55EFC4', 'Aadhaar', 3, 6, -9*MS_HOUR),
  ];

  const auditEvents: AuditEvent[] = [
    ...mkE('sv17', 'Amit Sharma', 'Aadhaar', -2*MS_HOUR),
    ...mkE('sv18', 'Sneha Reddy', 'Passport', -5*MS_HOUR),
    ...mkE('sv19', 'Rahul Verma', 'Aadhaar', -10*MS_HOUR),
    ...mkE('sv20', 'Pooja Patel', 'DL', -12*MS_HOUR),
    ...mkE('sv21', 'Vikram Malhotra', 'Aadhaar', -4*MS_HOUR),
    ...mkE('sv22', 'Deepika Rao', 'Voter ID', -18*MS_HOUR),
    ...mkE('sv23', 'Abhishek Nair', 'Aadhaar', -6*MS_HOUR),
    ...mkE('sv24', 'Kirti Joshi', 'Passport', -7*MS_HOUR),
    ...mkE('sv25', 'Manoj Kumar', 'PAN Card', -8*MS_HOUR),
    ...mkE('sv26', 'Preeti Singh', 'Aadhaar', -9*MS_HOUR),
  ];

  return { verifications, auditEvents, notifications: [] };
}



// ─── Context Provider Implementation ──────────────────────────────

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('offline');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [user, setUser] = useState<{
    username: string;
    role: string;
    name?: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
    propertyName?: string;
  } | null>(null);

  const updateUser = useCallback((updates: Partial<NonNullable<StoreContextType['user']>>) => {
    setUser((currentUser) => {
      if (!currentUser) return null;
      const nextUser = { ...currentUser, ...updates };
      localStorage.setItem('rentverify_auth_user', JSON.stringify(nextUser));
      
      // Async API write to MongoDB Atlas if connected
      if (isApiAvailable.current) {
        api.updateProfile({
          name: nextUser.name || '',
          email: nextUser.email || '',
          phone: nextUser.phone || '',
          avatarUrl: nextUser.avatarUrl || '',
          propertyName: nextUser.propertyName || '',
        }).catch((err) => {
          console.warn('[Store] Failed to sync profile updates to API:', err);
        });
      }

      return nextUser;
    });
  }, []);
  const [token, setToken] = useState<string | null>(null);
  const [isBiometricsRegistered, setIsBiometricsRegistered] = useState(
    !!localStorage.getItem('rentverify_biometric_credential_id')
  );
  const isApiAvailable = useRef(false);
  const healthCheckInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── localStorage Cache ─────────────────────────────────────────

  const saveToLocalCache = useCallback((v: Verification[], e: AuditEvent[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ verifications: v, auditEvents: e }));
    } catch (err) {
      console.warn('[Store] Failed to save to localStorage cache:', err);
    }
  }, []);

  const loadFromLocalCache = useCallback((): { verifications: Verification[]; auditEvents: AuditEvent[] } | null => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (err) {
      console.warn('[Store] Failed to load from localStorage cache:', err);
    }
    return null;
  }, []);

  // ─── Sync Queue (for offline writes) ───────────────────────────

  const addToSyncQueue = useCallback((type: 'verification' | 'auditEvent', action: 'create' | 'update', data: any) => {
    try {
      const raw = localStorage.getItem(SYNC_QUEUE_KEY);
      const queue = raw ? JSON.parse(raw) : [];
      queue.push({ type, action, data, timestamp: new Date().toISOString() });
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (err) {
      console.warn('[Store] Failed to add to sync queue:', err);
    }
  }, []);

  const processSyncQueue = useCallback(async () => {
    try {
      const raw = localStorage.getItem(SYNC_QUEUE_KEY);
      if (!raw) return;
      const queue = JSON.parse(raw);
      if (queue.length === 0) return;

      console.log(`[Store] Processing ${queue.length} queued operations...`);
      setConnectionStatus('syncing');

      for (const item of queue) {
        try {
          if (item.type === 'verification') {
            if (item.action === 'create') {
              await api.createVerification(item.data);
            } else if (item.action === 'update') {
              await api.updateVerificationApi(item.data.id, item.data);
            }
          } else if (item.type === 'auditEvent' && item.action === 'create') {
            await api.createAuditEvent(item.data);
          }
        } catch (err) {
          console.warn('[Store] Failed to sync queued item:', err);
        }
      }

      localStorage.removeItem(SYNC_QUEUE_KEY);
      setConnectionStatus('online');
      setLastSyncedAt(new Date().toISOString());
      console.log('[Store] Sync queue processed successfully');
    } catch (err) {
      console.warn('[Store] Failed to process sync queue:', err);
    }
  }, []);

  // ─── Authentication Operations ──────────────────────────────────

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await api.login(username, password);
      if (res.token && res.user) {
        setToken(res.token);
        setUser(res.user);
        api.setAuthToken(res.token);
        localStorage.setItem('rentverify_auth_token', res.token);
        localStorage.setItem('rentverify_auth_user', JSON.stringify(res.user));
        
        // Immediately fetch synced data using the new token
        setConnectionStatus('syncing');
        try {
          const health = await api.checkHealth();
          if (health.status === 'connected') {
            const [vData, eData] = await Promise.all([
              api.fetchVerifications(),
              api.fetchAuditEvents(),
            ]);
            setVerifications(vData);
            setAuditEvents(eData);
            saveToLocalCache(vData, eData);
            setConnectionStatus('online');
            setLastSyncedAt(new Date().toISOString());
          } else {
            setConnectionStatus('offline');
          }
        } catch {
          setConnectionStatus('offline');
        }
        return true;
      }
    } catch (err) {
      console.error('[Store] Login helper failed:', err);
      throw err;
    }
    return false;
  };

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    api.setAuthToken(null);
    localStorage.removeItem('rentverify_auth_token');
    localStorage.removeItem('rentverify_auth_user');
    // Clear data from memory for security
    setVerifications([]);
    setAuditEvents([]);
    setConnectionStatus('offline');
  }, []);

  const registerBiometrics = async (): Promise<boolean> => {
    if (!window.PublicKeyCredential) {
      throw new Error('OS Biometrics are not supported or are disabled in this browser context (HTTPS is required).');
    }

    // IP addresses are not valid Relying Party IDs in the WebAuthn standard
    if (/^[0-9.]+$/.test(window.location.hostname)) {
      throw new Error('Biometric keys (passkeys) cannot be registered on raw IP addresses. Please use "localhost" or a named secure domain.');
    }

    try {
      const challenge = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
      const userId = new Uint8Array([1, 9, 8, 4]);
      
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { 
            name: 'RentVerify App',
            id: window.location.hostname === 'localhost' ? 'localhost' : undefined
          },
          user: {
            id: userId,
            name: 'admin',
            displayName: 'Property Guardian Admin',
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },
            { type: 'public-key', alg: -257 },
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 60000,
        },
      }) as PublicKeyCredential;

      if (credential) {
        const credIdBase64 = bufferToBase64url(credential.rawId);
        localStorage.setItem('rentverify_biometric_credential_id', credIdBase64);
        setIsBiometricsRegistered(true);
        return true;
      }
    } catch (err: any) {
      console.error('[Store] Failed to register biometrics:', err);
      if (err.name === 'NotAllowedError') {
        throw new Error('Biometric registration was canceled or timed out.');
      }
      throw new Error(err.message || 'Failed to complete biometric key registration.');
    }
    return false;
  };

  const loginWithBiometrics = async (): Promise<boolean> => {
    const credIdBase64 = localStorage.getItem('rentverify_biometric_credential_id');
    if (!credIdBase64) return false;

    try {
      const rawId = base64urlToBuffer(credIdBase64);
      const challenge = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
      
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [
            {
              id: rawId,
              type: 'public-key',
            },
          ],
          userVerification: 'required',
        },
      }) as PublicKeyCredential;

      if (assertion) {
        // Automatically authenticate using seeded credentials on successful biometric scan
        const ok = await login('admin', 'Vikumar@16');
        return ok;
      }
    } catch (err) {
      console.error('[Store] Biometric login failed:', err);
      throw err;
    }
    return false;
  };

  // ─── Load Data from API or Cache ────────────────────────────────

  const loadFromApi = useCallback(async (): Promise<boolean> => {
    try {
      const health = await api.checkHealth();
      if (health.status === 'connected') {
        const [vData, eData, profileData] = await Promise.all([
          api.fetchVerifications(),
          api.fetchAuditEvents(),
          api.fetchProfile().catch((err) => {
            console.warn('[Store] Failed to fetch profile from API:', err);
            return null;
          }),
        ]);

        if (profileData) {
          setUser(profileData);
          localStorage.setItem('rentverify_auth_user', JSON.stringify(profileData));
        }

        // If server is connected but DB is empty, seed it
        if (vData.length === 0 && eData.length === 0) {
          console.log('[Store] Database empty, seeding...');
          const seed = buildSeedData();
          await api.seedData({
            verifications: seed.verifications,
            auditEvents: seed.auditEvents,
          });
          setVerifications(seed.verifications);
          setAuditEvents(seed.auditEvents);
          saveToLocalCache(seed.verifications, seed.auditEvents);
        } else {
          setVerifications(vData);
          setAuditEvents(eData);
          saveToLocalCache(vData, eData);
        }

        isApiAvailable.current = true;
        setConnectionStatus('online');
        setLastSyncedAt(new Date().toISOString());
        return true;
      }
    } catch (err) {
      console.warn('[Store] API not available or unauthorized:', err);
    }
    return false;
  }, [saveToLocalCache]);

  // ─── Init on Mount ──────────────────────────────────────────────

  useEffect(() => {
    const initStore = async () => {
      // 1. Restore auth session if exists
      const savedToken = localStorage.getItem('rentverify_auth_token');
      const savedUser = localStorage.getItem('rentverify_auth_user');
      let currentToken = null;

      if (savedToken && savedUser) {
        try {
          api.setAuthToken(savedToken);
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          currentToken = savedToken;
        } catch (e) {
          console.warn('[Store] Failed to restore saved credentials:', e);
        }
      }

      // Only attempt API load if we are authenticated
      let apiLoaded = false;
      if (currentToken) {
        apiLoaded = await loadFromApi();
      }

      if (apiLoaded) {
        // Process any queued offline writes
        await processSyncQueue();
        return;
      }

      // Fallback: Electron native file
      if (window.electronAPI) {
        try {
          const parsed = await window.electronAPI.loadData();
          if (parsed) {
            setVerifications(parsed.verifications || []);
            setAuditEvents(parsed.auditEvents || []);
            setConnectionStatus('offline');
            return;
          }
        } catch (e) {
          console.warn('[Store] Failed to load from native file:', e);
        }
      }

      // Fallback: localStorage
      const cached = loadFromLocalCache();
      if (cached) {
        setVerifications(cached.verifications || []);
        setAuditEvents(cached.auditEvents || []);
        setConnectionStatus('offline');
      } else {
        // Last resort: seed data locally
        const seed = buildSeedData();
        setVerifications(seed.verifications);
        setAuditEvents(seed.auditEvents);
        saveToLocalCache(seed.verifications, seed.auditEvents);
        setConnectionStatus('offline');
      }
    };

    initStore();

    // Health check every 30 seconds to detect connection changes (only if logged in)
    healthCheckInterval.current = setInterval(async () => {
      // Don't ping health check if not logged in
      const activeToken = localStorage.getItem('rentverify_auth_token');
      if (!activeToken) {
        isApiAvailable.current = false;
        setConnectionStatus('offline');
        return;
      }

      try {
        const health = await api.checkHealth();
        const wasOffline = !isApiAvailable.current;
        isApiAvailable.current = health.status === 'connected';

        if (wasOffline && isApiAvailable.current) {
          console.log('[Store] Connection restored! Syncing...');
          await processSyncQueue();
          await loadFromApi();
        }

        setConnectionStatus(isApiAvailable.current ? 'online' : 'offline');
      } catch {
        isApiAvailable.current = false;
        setConnectionStatus('offline');
      }
    }, 30_000);

    return () => {
      if (healthCheckInterval.current) clearInterval(healthCheckInterval.current);
    };
  }, [loadFromApi, loadFromLocalCache, processSyncQueue, saveToLocalCache]);

  // ─── Save Helper (API + local fallback) ─────────────────────────

  const save = useCallback(async (updatedVerifications: Verification[], updatedEvents: AuditEvent[]) => {
    // Always save to local cache
    saveToLocalCache(updatedVerifications, updatedEvents);

    // Also save to Electron native file if available
    if (window.electronAPI) {
      try {
        await window.electronAPI.saveData({
          verifications: updatedVerifications,
          auditEvents: updatedEvents,
        });
      } catch (e) {
        console.warn('[Store] Failed to save to native file:', e);
      }
    }
  }, [saveToLocalCache]);

  // ─── CRUD Operations ───────────────────────────────────────────

  const addVerification = (data: Omit<Verification, 'id' | 'refCode' | 'status' | 'submittedAt' | 'reviewedAt' | 'reviewedBy' | 'rejectionReason' | 'flagReason' | 'guardianNote' | 'linkToken' | 'linkExpiresAt'>) => {
    const newVerification: Verification = {
      ...data,
      id: generateId(),
      refCode: generateRefId(),
      status: 'pending',
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      rejectionReason: null,
      flagReason: null,
      guardianNote: null,
      linkToken: 'tok_' + generateId(),
      linkExpiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    };

    // Optimistic update
    const nextVerifications = [...verifications, newVerification];
    setVerifications(nextVerifications);
    save(nextVerifications, auditEvents);

    // Async API write
    if (isApiAvailable.current) {
      api.createVerification(newVerification).catch((err) => {
        console.warn('[Store] Failed to save verification to API:', err);
        addToSyncQueue('verification', 'create', newVerification);
      });
    } else {
      addToSyncQueue('verification', 'create', newVerification);
    }

    return newVerification;
  };

  const updateVerification = (id: string, updates: Partial<Verification>) => {
    const idx = verifications.findIndex((v) => v.id === id);
    if (idx === -1) return null;

    const nextVerifications = [...verifications];
    nextVerifications[idx] = { ...nextVerifications[idx], ...updates };
    setVerifications(nextVerifications);
    save(nextVerifications, auditEvents);

    // Async API write
    if (isApiAvailable.current) {
      api.updateVerificationApi(id, updates).catch((err) => {
        console.warn('[Store] Failed to update verification on API:', err);
        addToSyncQueue('verification', 'update', { id, ...updates });
      });
    } else {
      addToSyncQueue('verification', 'update', { id, ...updates });
    }

    return nextVerifications[idx];
  };

  const addAuditEvent = (event: Omit<AuditEvent, 'id' | 'timestamp'>) => {
    const newEvent: AuditEvent = {
      ...event,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };

    const nextEvents = [...auditEvents, newEvent];
    setAuditEvents(nextEvents);
    save(verifications, nextEvents);

    // Async API write
    if (isApiAvailable.current) {
      api.createAuditEvent(newEvent).catch((err) => {
        console.warn('[Store] Failed to save audit event to API:', err);
        addToSyncQueue('auditEvent', 'create', newEvent);
      });
    } else {
      addToSyncQueue('auditEvent', 'create', newEvent);
    }

    return newEvent;
  };

  // ─── Query Helpers ──────────────────────────────────────────────

  const getAuditEventsByVerificationId = (verificationId: string) => {
    return auditEvents
      .filter((e) => e.verificationId === verificationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const getVerificationById = (id: string) => {
    return verifications.find((v) => v.id === id);
  };

  const getPendingVerifications = () => {
    return verifications.filter((v) => v.status === 'pending');
  };

  const getAllAuditableVerifications = () => {
    return verifications.filter((v) => v.status !== 'pending');
  };

  const searchVerifications = (query: string): Verification[] => {
    if (!query.trim()) return verifications;
    const q = query.toLowerCase();
    return verifications.filter((v) =>
      v.guestName.toLowerCase().includes(q) ||
      v.guestPhone.toLowerCase().includes(q) ||
      v.refCode.toLowerCase().includes(q) ||
      (v.guestEmail && v.guestEmail.toLowerCase().includes(q))
    );
  };

  const filterByDateRange = (from: string, to: string): Verification[] => {
    const fromMs = new Date(from).getTime();
    const toMs = new Date(to).getTime();
    return verifications.filter((v) => {
      const ms = new Date(v.submittedAt).getTime();
      return ms >= fromMs && ms <= toMs;
    });
  };

  // ─── Stats (computed locally for speed) ─────────────────────────

  const getStats = (): DashboardStats => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let pending = 0;
    let approvedToday = 0;
    let flagged = 0;
    let totalThisMonth = 0;
    let rejectedThisMonth = 0;
    const responseTimes: number[] = [];

    verifications.forEach((v) => {
      if (v.status === 'pending') pending++;
      if (v.status === 'flagged') flagged++;

      if (v.reviewedAt) {
        const reviewedMs = new Date(v.reviewedAt).getTime();
        const submittedMs = new Date(v.submittedAt).getTime();

        if (v.status === 'approved' && reviewedMs >= todayStart) {
          approvedToday++;
        }

        if (reviewedMs >= monthStart) {
          totalThisMonth++;
          if (v.status === 'rejected') rejectedThisMonth++;
        }

        responseTimes.push(reviewedMs - submittedMs);
      }
    });

    const avgResponseTimeMs =
      responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0;

    return {
      pending,
      approvedToday,
      flagged,
      totalThisMonth,
      rejectedThisMonth,
      avgResponseTimeMs,
    };
  };

  const getUpcomingArrivals = (): Verification[] => {
    return verifications
      .filter((v) => v.status === 'approved')
      .sort((a, b) => {
        const t1 = a.reviewedAt ? new Date(a.reviewedAt).getTime() : 0;
        const t2 = b.reviewedAt ? new Date(b.reviewedAt).getTime() : 0;
        return t2 - t1; // Descending: latest first
      });
  };

  // ─── Data Management ────────────────────────────────────────────

  const resetToSeedData = async () => {
    const seed = buildSeedData();
    setVerifications(seed.verifications);
    setAuditEvents(seed.auditEvents);
    saveToLocalCache(seed.verifications, seed.auditEvents);

    if (isApiAvailable.current) {
      try {
        await api.seedData({
          verifications: seed.verifications,
          auditEvents: seed.auditEvents,
        });
      } catch (err) {
        console.warn('[Store] Failed to seed API:', err);
      }
    }
  };

  const refreshData = async () => {
    setConnectionStatus('syncing');
    const loaded = await loadFromApi();
    if (!loaded) {
      setConnectionStatus('offline');
    }
  };

  const exportAllData = async () => {
    // Generate clean Excel-compatible CSV for verification records
    const headers = [
      'Reference Code',
      'Guest Name',
      'Status',
      'Phone Number',
      'Email Address',
      'Guest Count',
      'Purpose of stay',
      'Booking Platform',
      'Check-in Date',
      'Check-in Time',
      'Check-out Date',
      'Check-out Time',
      'Submitted At',
      'Reviewed At',
      'Reviewed By',
      'Rejection Reason',
      'Flag Reason',
      'Guardian Note'
    ];

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = verifications.map((v) => [
      v.refCode,
      v.guestName,
      v.status.toUpperCase(),
      v.guestPhone || '',
      v.guestEmail || '',
      v.guestCount || 1,
      v.purpose || '',
      v.bookingPlatform || '',
      v.checkinDate || '',
      v.checkinTime || '',
      v.checkoutDate || '',
      v.checkoutTime || '',
      v.submittedAt ? new Date(v.submittedAt).toLocaleString() : '',
      v.reviewedAt ? new Date(v.reviewedAt).toLocaleString() : '',
      v.reviewedBy || '',
      v.rejectionReason || '',
      v.flagReason || '',
      v.guardianNote || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map(escapeCSV).join(','))
    ].join('\r\n');

    // Trigger browser download of CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rentverify-guests-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <StoreContext.Provider
      value={{
        verifications,
        auditEvents,
        connectionStatus,
        lastSyncedAt,
        user,
        token,
        login,
        logout,
        isBiometricsRegistered,
        registerBiometrics,
        loginWithBiometrics,
        getVerificationById,
        getPendingVerifications,
        getAllAuditableVerifications,
        addVerification,
        updateVerification,
        addAuditEvent,
        getAuditEventsByVerificationId,
        getStats,
        getUpcomingArrivals,
        resetToSeedData,
        refreshData,
        searchVerifications,
        filterByDateRange,
        exportAllData,
        updateUser,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
