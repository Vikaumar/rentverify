/**
 * @file types.ts
 * @description Core TypeScript interfaces for RentVerify application state.
 */

export interface Verification {
  id: string;
  refCode: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  guestName: string;
  guestPhone: string;
  guestEmail: string | null;
  guestCount: number;
  purpose: string;
  bookingPlatform: string | null;
  selfieData: string | null; // Base64 compressed JPEG DataURL
  idType: string;
  idImageData: string | null; // Base64 compressed JPEG DataURL
  checkinDate: string; // YYYY-MM-DD
  checkinTime: string; // HH:MM
  checkoutDate: string; // YYYY-MM-DD
  checkoutTime: string; // HH:MM
  submittedAt: string; // ISO 8601 string
  reviewedAt: string | null; // ISO 8601 string
  reviewedBy: string | null;
  rejectionReason: string | null;
  flagReason: string | null;
  guardianNote: string | null;
  linkToken: string;
  linkExpiresAt: string;
}

export interface AuditEvent {
  id: string;
  verificationId: string;
  eventType:
    | 'link_sent'
    | 'details_submitted'
    | 'selfie_uploaded'
    | 'id_uploaded'
    | 'submission_complete'
    | 'guardian_viewed'
    | 'approved'
    | 'rejected'
    | 'flagged'
    | 'sms_sent'
    | 'whatsapp_sent'
    | 'escalation_sent';
  actor: 'guest' | 'guardian' | 'system';
  description: string;
  timestamp: string; // ISO 8601 string
  metadata: Record<string, any> | null;
}

export interface DashboardStats {
  pending: number;
  approvedToday: number;
  flagged: number;
  totalThisMonth: number;
  rejectedThisMonth: number;
  avgResponseTimeMs: number;
}

declare global {
  interface Window {
    electronAPI?: {
      loadData: () => Promise<any>;
      saveData: (data: any) => Promise<boolean>;
    };
  }
}
