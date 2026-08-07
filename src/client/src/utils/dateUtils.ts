/**
 * Utility functions for date parsing and formatting without UTC timezone shift.
 * Avoids the issue where "YYYY-MM-DD" parsed via `new Date("YYYY-MM-DD")` defaults to UTC midnight,
 * causing a 1-day backward shift in West timezones (such as GMT-3 Brazil).
 */

/**
 * Parses a date string, Date object, or Firestore Timestamp safely into a local Date object.
 */
export function parseLocalDate(dateInput?: any): Date {
  if (!dateInput) return new Date();

  // Firestore Timestamp support ({ toDate: () => Date } or { seconds: number })
  if (typeof dateInput === 'object' && dateInput !== null) {
    if (typeof dateInput.toDate === 'function') {
      dateInput = dateInput.toDate();
    } else if (typeof dateInput.seconds === 'number') {
      dateInput = new Date(dateInput.seconds * 1000);
    }
  }

  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return new Date();
    return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate(), 12, 0, 0);
  }

  const clean = String(dateInput).trim();
  if (!clean) return new Date();

  const datePart = clean.split('T')[0].split(' ')[0];

  // Try YYYY-MM-DD or DD-MM-YYYY
  if (datePart.includes('-')) {
    const parts = datePart.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          return new Date(year, month, day, 12, 0, 0);
        }
      } else if (parts[2].length === 4) {
        // DD-MM-YYYY
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          return new Date(year, month, day, 12, 0, 0);
        }
      }
    }
  }

  // Try DD/MM/YYYY or YYYY/MM/DD
  if (datePart.includes('/')) {
    const parts = datePart.split('/');
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        // DD/MM/YYYY
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          return new Date(year, month, day, 12, 0, 0);
        }
      } else if (parts[0].length === 4) {
        // YYYY/MM/DD
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          return new Date(year, month, day, 12, 0, 0);
        }
      }
    }
  }

  const d = new Date(clean);
  if (!isNaN(d.getTime())) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
  }

  return new Date();
}

/**
 * Formats a date string, Date object, or Timestamp to Brazilian format DD/MM/YYYY.
 */
export function formatDateBR(dateInput?: any): string {
  if (!dateInput) return '—';
  const d = parseLocalDate(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Returns date formatted as YYYY-MM-DD for HTML <input type="date"> fields.
 */
export function formatDateInput(dateInput?: any): string {
  const d = parseLocalDate(dateInput);
  if (isNaN(d.getTime())) {
    const now = new Date();
    const y = now.getFullYear();
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const dayStr = now.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${dayStr}`;
  }
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

