-- AlterTable: add `email`, backfill existing rows from the related user, then
-- enforce NOT NULL (a plain NOT NULL add fails when the table already has rows).
ALTER TABLE `AuthEvent` ADD COLUMN `email` VARCHAR(191) NULL;

UPDATE `AuthEvent` `e`
  JOIN `User` `u` ON `u`.`id` = `e`.`userId`
  SET `e`.`email` = `u`.`email`;

ALTER TABLE `AuthEvent` MODIFY COLUMN `email` VARCHAR(191) NOT NULL;
