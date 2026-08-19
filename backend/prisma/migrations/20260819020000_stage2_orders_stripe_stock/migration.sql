-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM (
  'PENDING',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'FAILED'
);

-- Normalize legacy cancelled spelling before moving to enum.
UPDATE "Order"
SET "status" = 'CANCELLED'
WHERE "status" = 'CANCELED';

-- Convert money columns from floating point to fixed precision decimals.
ALTER TABLE "Product"
ALTER COLUMN "price" TYPE DECIMAL(10, 2)
USING ROUND("price"::numeric, 2);

ALTER TABLE "Order"
ALTER COLUMN "total" TYPE DECIMAL(12, 2)
USING ROUND("total"::numeric, 2);

ALTER TABLE "OrderItem"
ALTER COLUMN "price" TYPE DECIMAL(10, 2)
USING ROUND("price"::numeric, 2);

-- Add order payment metadata and enum status without dropping existing values blindly.
ALTER TABLE "Order"
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "stripeCheckoutSessionId" TEXT,
ADD COLUMN "stripePaymentStatus" TEXT,
ADD COLUMN "paidAt" TIMESTAMP(3),
ADD COLUMN "cancelledAt" TIMESTAMP(3),
ADD COLUMN "status_new" "OrderStatus" NOT NULL DEFAULT 'PENDING';

UPDATE "Order"
SET "status_new" = CASE
  WHEN "status" IN (
    'PENDING',
    'PAID',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'FAILED'
  ) THEN "status"::"OrderStatus"
  ELSE 'PENDING'::"OrderStatus"
END;

ALTER TABLE "Order"
DROP COLUMN "status";

ALTER TABLE "Order"
RENAME COLUMN "status_new" TO "status";

-- Add order item purchase snapshots.
ALTER TABLE "OrderItem"
ADD COLUMN "cartItemId" INTEGER,
ADD COLUMN "productName" TEXT NOT NULL DEFAULT '',
ADD COLUMN "subtotal" DECIMAL(12, 2) NOT NULL DEFAULT 0;

UPDATE "OrderItem" AS oi
SET
  "productName" = p."name",
  "subtotal" = ROUND((oi."price" * oi."quantity")::numeric, 2)
FROM "Product" AS p
WHERE oi."productId" = p."id";

ALTER TABLE "OrderItem"
ALTER COLUMN "subtotal" DROP DEFAULT;

-- Stripe event log for webhook idempotency.
CREATE TABLE "StripeEvent" (
  "id" SERIAL NOT NULL,
  "stripeEventId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "orderId" INTEGER,
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "StripeEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Order_stripeCheckoutSessionId_key"
ON "Order"("stripeCheckoutSessionId");

CREATE UNIQUE INDEX "StripeEvent_stripeEventId_key"
ON "StripeEvent"("stripeEventId");

CREATE INDEX "StripeEvent_orderId_idx"
ON "StripeEvent"("orderId");

ALTER TABLE "StripeEvent"
ADD CONSTRAINT "StripeEvent_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
