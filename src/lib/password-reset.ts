import { createHash, randomBytes } from "node:crypto";

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export function generateResetToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function resetTokenExpiresAt(now = new Date()): Date {
  return new Date(now.getTime() + RESET_TOKEN_TTL_MS);
}

export function isResetTokenUsable(
  row: { expiresAt: Date; usedAt: Date | null },
  now = new Date()
): boolean {
  return row.usedAt == null && row.expiresAt.getTime() > now.getTime();
}
