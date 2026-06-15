import { createHash, randomBytes } from "crypto";

const INVITE_EXPIRY_DAYS = 7;

export function generateInviteToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function getInviteExpiryDate(): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);
  return expiresAt;
}

export function buildInviteUrl(token: string): string {
  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/signup?invite=${token}`;
}

export function getPermanentInviteToken(): string | null {
  const token = process.env.PERMANENT_INVITE_TOKEN?.trim();
  return token || null;
}

export function isPermanentInviteToken(token: string): boolean {
  const permanentToken = getPermanentInviteToken();
  return Boolean(permanentToken && token === permanentToken);
}

export function getPermanentInviteUrl(): string | null {
  const token = getPermanentInviteToken();
  return token ? buildInviteUrl(token) : null;
}
