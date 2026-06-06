const RECEIPT_IMAGE_PREFIX = '[[PAYMENT_RECEIPT_IMAGE:';
const RECEIPT_IMAGE_SUFFIX = ']]';

export function appendPaymentReceiptImage(notes: string | undefined, imageDataUrl?: string | null) {
  if (!imageDataUrl) return notes;
  const visibleNotes = notes || '';
  return `${visibleNotes}\n${RECEIPT_IMAGE_PREFIX}${imageDataUrl}${RECEIPT_IMAGE_SUFFIX}`;
}

export function extractPaymentReceiptImage(notes?: string | null) {
  if (!notes) return null;
  const start = notes.indexOf(RECEIPT_IMAGE_PREFIX);
  if (start === -1) return null;
  const valueStart = start + RECEIPT_IMAGE_PREFIX.length;
  const end = notes.indexOf(RECEIPT_IMAGE_SUFFIX, valueStart);
  if (end === -1) return null;
  const value = notes.slice(valueStart, end).trim();
  return value.startsWith('data:image/') ? value : null;
}

export function stripPaymentReceiptImage(notes?: string | null) {
  if (!notes) return '';
  const start = notes.indexOf(RECEIPT_IMAGE_PREFIX);
  if (start === -1) return notes.trim();
  const end = notes.indexOf(RECEIPT_IMAGE_SUFFIX, start + RECEIPT_IMAGE_PREFIX.length);
  if (end === -1) return notes.trim();
  return `${notes.slice(0, start)}${notes.slice(end + RECEIPT_IMAGE_SUFFIX.length)}`.trim();
}
