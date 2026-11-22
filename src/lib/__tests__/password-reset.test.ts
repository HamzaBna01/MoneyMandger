import test from "node:test";
import assert from "node:assert/strict";
import {
  generateResetToken,
  hashResetToken,
  isResetTokenUsable,
  RESET_TOKEN_TTL_MS,
  resetTokenExpiresAt,
} from "../password-reset";

test("hashResetToken is stable and does not equal the raw token", () => {
  const token = "reset-token-example";
  const hash = hashResetToken(token);
  assert.equal(hash, hashResetToken(token));
  assert.notEqual(hash, token);
  assert.equal(hash.length, 64);
});

test("generateResetToken returns unique values", () => {
  const a = generateResetToken();
  const b = generateResetToken();
  assert.notEqual(a, b);
  assert.ok(a.length >= 32);
});

test("isResetTokenUsable rejects used or expired rows", () => {
  const now = new Date("2026-09-27T12:00:00.000Z");
  const expiresAt = resetTokenExpiresAt(now);
  assert.equal(expiresAt.getTime() - now.getTime(), RESET_TOKEN_TTL_MS);

  assert.equal(isResetTokenUsable({ expiresAt, usedAt: null }, now), true);
  assert.equal(
    isResetTokenUsable({ expiresAt, usedAt: now }, now),
    false
  );
  assert.equal(
    isResetTokenUsable({ expiresAt: now, usedAt: null }, now),
    false
  );
});
