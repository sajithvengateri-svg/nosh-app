/**
 * Deal Code Service
 *
 * Generates unique 8-character deal codes using a safe charset
 * that avoids ambiguous characters (0/O, 1/I/L).
 *
 * Character set: ABCDEFGHJKLMNPQRSTUVWXYZ23456789 (32 chars)
 * Possible codes: 32^8 = ~1.1 trillion — collision-proof at any scale.
 */

const SAFE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;
const EXPIRY_HOURS = 24;

/** Generate a cryptographically random 8-character deal code. */
export function generateDealCode(): string {
  const chars: string[] = [];
  const randomValues = new Uint8Array(CODE_LENGTH);
  // Use crypto.getRandomValues for secure randomness
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(randomValues);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < CODE_LENGTH; i++) {
      randomValues[i] = Math.floor(Math.random() * 256);
    }
  }
  for (let i = 0; i < CODE_LENGTH; i++) {
    chars.push(SAFE_CHARS[randomValues[i] % SAFE_CHARS.length]);
  }
  return chars.join("");
}

/** Format code for display with a dash: "A8X4-N2P9" */
export function formatCodeForDisplay(code: string): string {
  if (code.length !== CODE_LENGTH) return code;
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/** Build the QR deep link payload. */
export function buildQRPayload(code: string): string {
  return `https://prepmi.app/r/${code}`;
}

/** Get expiry timestamp (24h from now). */
export function getExpiresAt(): string {
  const d = new Date();
  d.setHours(d.getHours() + EXPIRY_HOURS);
  return d.toISOString();
}

/** Check if a code has expired. */
export function isCodeExpired(expiresAt: string): boolean {
  return new Date() >= new Date(expiresAt);
}

/** Get human-readable time remaining. */
export function getTimeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}
