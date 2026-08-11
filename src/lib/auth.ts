import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "crm_session";
const SESSION_DURATION = 90 * 24 * 60 * 60; // 90 days in seconds

const DEV_FALLBACK_PIN = "123456";

/**
 * The configured PIN, or null when there is none.
 *
 * The old fallback to "123456" applied in production too. That value is
 * visible in this repository, so a deployment missing APP_ACCESS_PIN was
 * protected by a publicly known PIN. Outside development the app now refuses
 * to unlock at all rather than accepting it — a locked-out deploy is a far
 * cheaper mistake than an open one.
 */
export function getAppPin(): string | null {
  const configured = process.env.APP_ACCESS_PIN?.trim();
  if (configured) return configured;
  return process.env.NODE_ENV === "production" ? null : DEV_FALLBACK_PIN;
}

export function isPinConfigured(): boolean {
  return getAppPin() !== null;
}

export function generateSessionToken(pin: string): string {
  const secret = process.env.CRON_SECRET || "crm_secret_key";
  const str = `${pin}:${secret}:authenticated`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `valid_session_${Math.abs(hash)}`;
}

export function verifyPin(inputPin: string): boolean {
  const expectedPin = getAppPin();
  // No PIN configured in production: fail closed.
  if (!expectedPin) return false;
  return inputPin.trim() === expectedPin.trim();
}

export async function setAuthSession(pin: string) {
  const token = generateSessionToken(pin);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });
}

export async function clearAuthSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export function isValidSession(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  const pin = getAppPin();
  if (!pin) return false;
  return cookieValue === generateSessionToken(pin);
}
