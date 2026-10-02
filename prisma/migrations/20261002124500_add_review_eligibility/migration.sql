CREATE TYPE "ReviewEligibilityStatus" AS ENUM ('AVAILABLE', 'USED');

CREATE TABLE "ReviewEligibility" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "orderItemId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "status" "ReviewEligibilityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "reviewId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "ReviewEligibility_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReviewEligibility_orderItemId_key" ON "ReviewEligibility"("orderItemId");
CREATE UNIQUE INDEX "ReviewEligibility_reviewId_key" ON "ReviewEligibility"("reviewId");
CREATE INDEX "ReviewEligibility_userId_productId_idx" ON "ReviewEligibility"("userId", "productId");
CREATE INDEX "ReviewEligibility_userId_status_idx" ON "ReviewEligibility"("userId", "status");
CREATE INDEX "ReviewEligibility_productId_status_idx" ON "ReviewEligibility"("productId", "status");
