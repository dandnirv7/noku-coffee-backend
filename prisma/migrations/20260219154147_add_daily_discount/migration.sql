-- CreateTable
CREATE TABLE "daily_discount" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "discountValue" DECIMAL(12,2) NOT NULL,
    "discountPercent" DECIMAL(5,2),
    "maxQuota" INTEGER NOT NULL,
    "usedQuota" INTEGER NOT NULL DEFAULT 0,
    "targetUserIds" TEXT[],
    "dayKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_discount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_discount_dayKey_idx" ON "daily_discount"("dayKey");

-- CreateIndex
CREATE UNIQUE INDEX "daily_discount_productId_dayKey_key" ON "daily_discount"("productId", "dayKey");

-- AddForeignKey
ALTER TABLE "daily_discount" ADD CONSTRAINT "daily_discount_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
