-- Add a terminal refund state for orders that were paid by Stripe but could not be fulfilled.
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'REFUNDED';

-- Store enough Stripe metadata to reuse active Checkout Sessions and make refunds idempotent.
ALTER TABLE "Order"
ADD COLUMN "stripeCheckoutSessionUrl" TEXT,
ADD COLUMN "stripeCheckoutSessionExpiresAt" TIMESTAMP(3),
ADD COLUMN "stripeCheckoutSessionAttempt" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "stripeRefundId" TEXT,
ADD COLUMN "stripeRefundStatus" TEXT,
ADD COLUMN "refundedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Order_stripeRefundId_key"
ON "Order"("stripeRefundId");
