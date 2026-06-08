import { createHmac, timingSafeEqual } from "crypto";

export const collectiumSessionCookieName = "ct_session";

type SessionPayload = {
  user: string;
  role: "admin";
  issuedAt: number;
  expiresAt: number;
};

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signValue(value: string): string {
  return createHmac("sha256", requireEnv("CT_AUTH_SECRET"))
    .update(value)
    .digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyAuthCredentials(username: string, password: string): boolean {
  const expectedUser = requireEnv("CT_AUTH_USER");
  const expectedPassword = requireEnv("CT_AUTH_PASSWORD");

  return safeEqual(username, expectedUser) && safeEqual(password, expectedPassword);
}

export function createSessionToken(user: string): string {
  const now = Date.now();

  const payload: SessionPayload = {
    user,
    role: "admin",
    issuedAt: now,
    expiresAt: now + 1000 * 60 * 60 * 8,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signValue(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function readSessionToken(token: string | undefined): SessionPayload | null {
  if (!token || !token.includes(".")) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signValue(encodedPayload);

  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;

    if (!payload.user || !payload.expiresAt || Date.now() > payload.expiresAt) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
