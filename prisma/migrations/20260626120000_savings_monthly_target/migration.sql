-- Replace the lump-sum savings goal with a per-month savings target.
-- The total to reach by the deadline is now derived (monthly × months left).
ALTER TABLE `household` DROP COLUMN `savingsGoalCents`,
    ADD COLUMN `savingsMonthlyCents` INTEGER NULL;
