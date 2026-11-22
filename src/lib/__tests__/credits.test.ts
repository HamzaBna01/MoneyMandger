import test from "node:test";
import assert from "node:assert/strict";
import { describeCreditStatus } from "../credits";

test("describeCreditStatus marks overdue and paid states correctly", () => {
    const now = new Date("2026-07-10T12:00:00.000Z");

    assert.equal(
        describeCreditStatus({ totalCents: 100000, paidCents: 0, dueDate: new Date("2026-07-01T00:00:00.000Z") }, now),
        "OVERDUE"
    );
    assert.equal(
        describeCreditStatus({ totalCents: 100000, paidCents: 50000, dueDate: new Date("2026-07-20T00:00:00.000Z") }, now),
        "PARTIALLY_PAID"
    );
    assert.equal(
        describeCreditStatus({ totalCents: 100000, paidCents: 100000, dueDate: new Date("2026-07-20T00:00:00.000Z") }, now),
        "PAID"
    );
});
