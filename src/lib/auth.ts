import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "crm_session";
const SESSION_DURATION = 90 * 24 * 60 * 60; // 90 days in seconds

// Simple HMAC-like token generation for single user PIN auth
export function getAppPin(): string {
  return process.env.APP_ACCESS_PIN || "123456";
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
  const expectedPin = getAppPin().trim();
  return inputPin.trim() === expectedPin;
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
  const expectedToken = generateSessionToken(getAppPin());
  return cookieValue === expectedToken;
}
