// Shared by the /dream/[id] server route and the Gallery's client-side
// fetch (see api/dream/[id]/route.ts) so both produce identical symbol
// labels — otherwise the overlay's fetched preview and the real route's
// server-rendered version could show slightly different text.
export function shortSymbol(symbol: string): string {
  return symbol.split(" - ")[0].trim();
}

// Shared by DreamResultScreen's "Edit image details" sheet — native
// <input type="date">/<input type="time"> require exact "YYYY-MM-DD" /
// "HH:mm" strings, and both read/write in the browser's local timezone
// (matching how formatDreamDate/formatDreamTime already render createdAt
// via `new Date(iso)` + toLocaleString, not UTC).
export function toDateInputValue(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function toTimeInputValue(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${min}`;
}

export function combineDateAndTime(dateStr: string, timeStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [h, min] = timeStr.split(":").map(Number);
  return new Date(y, m - 1, d, h, min).toISOString();
}
