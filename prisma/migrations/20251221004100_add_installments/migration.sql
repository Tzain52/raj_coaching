-- AlterTable
ALTER TABLE "User" ADD COLUMN     "installment1Paid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "installment2Paid" BOOLEAN NOT NULL DEFAULT false;

