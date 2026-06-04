/**
 * @file utils.ts
 * @description General helper utilities for date, time, and image manipulation.
 */

/**
 * Format a date string (YYYY-MM-DD) into a readable format like "Jun 2, 2026".
 */
export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a time string (HH:MM, 24-hour) into 12-hour format like "12:00 PM".
 */
export function formatTime(timeStr?: string | null): string {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Combine a date and time into a single formatted string like "Jun 2, 2026 at 12:00 PM".
 */
export function formatDateTime(dateStr?: string | null, timeStr?: string | null): string {
  const datePart = formatDate(dateStr);
  const timePart = formatTime(timeStr);
  if (datePart && timePart) return `${datePart} at ${timePart}`;
  return datePart || timePart || '';
}

/**
 * Format an ISO date-time string into a human-readable relative time.
 * Returns strings like "just now", "2 hours ago", "3 days ago".
 */
export function formatRelativeTime(isoString?: string | null): string {
  if (!isoString) return '';
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;

  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth} month${diffMonth === 1 ? '' : 's'} ago`;
}

/**
 * Calculate the number of nights between two dates in YYYY-MM-DD format.
 */
export function calculateNights(checkinDate?: string | null, checkoutDate?: string | null): number {
  if (!checkinDate || !checkoutDate) return 0;
  const [y1, m1, d1] = checkinDate.split('-').map(Number);
  const [y2, m2, d2] = checkoutDate.split('-').map(Number);
  const start = new Date(y1, m1 - 1, d1);
  const end = new Date(y2, m2 - 1, d2);
  const diffMs = end.getTime() - start.getTime();
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Compress an image file by drawing it onto a canvas and exporting as JPEG.
 */
export function compressImage(file: File, maxWidth = 800, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas 2D context'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Get visual attributes based on status.
 */
export function getStatusEmoji(status: string): string {
  const map: Record<string, string> = {
    pending: '🟡',
    approved: '✅',
    rejected: '❌',
    flagged: '⚠️',
  };
  return map[status] || '🟡';
}

/**
 * Clamp a number between min and max.
 */
export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
