/**
 * Utility functions for date parsing and formatting without UTC timezone shift.
 * Avoids the issue where "YYYY-MM-DD" parsed via `new Date("YYYY-MM-DD")` defaults to UTC midnight,
 * causing a 1-day backward shift in West timezones (such as GMT-3 Brazil).
 */

/**
 * Parses a date string safely into a local Date object.
 */
export function parseLocalDate(dateInput?: string | Date | null): Date {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;

  const clean = String(dateInput).trim();
  const datePart = clean.split('T')[0];
  const parts = datePart.split('-');

  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month, day, 12, 0, 0); // Noon local time prevents any edge timezone shift
    }
  }

  return new Date(clean);
}

/**
 * Formats a date string or Date object to Brazilian format DD/MM/YYYY.
 */
export function formatDateBR(dateInput?: string | Date | null): string {
  if (!dateInput) return '—';
  if (typeof dateInput === 'string') {
    const clean = dateInput.trim();
    const datePart = clean.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      if (year.length === 4 && month.length <= 2 && day.length <= 2) {
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
      }
    }
  }
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
export function formatDateInput(dateInput?: string | Date | null): string {
  if (!dateInput) return new Date().toISOString().split('T')[0];
  if (typeof dateInput === 'string') {
    const clean = dateInput.trim();
    const datePart = clean.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      return datePart;
    }
  }
  const d = parseLocalDate(dateInput);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}
