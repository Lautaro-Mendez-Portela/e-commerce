-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentIntentId" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';
