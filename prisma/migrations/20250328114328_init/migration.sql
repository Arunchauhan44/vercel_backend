/*
  Warnings:

  - You are about to drop the column `age` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `age`,
    ADD COLUMN `confirmPasword` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `otp` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `otpExpires` DATETIME(3) NULL,
    ADD COLUMN `role` VARCHAR(191) NOT NULL DEFAULT 'user',
    MODIFY `name` VARCHAR(191) NOT NULL DEFAULT '',
    MODIFY `password` VARCHAR(191) NOT NULL DEFAULT '';
