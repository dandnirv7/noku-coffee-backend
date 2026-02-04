/*
  Warnings:

  - A unique constraint covering the columns `[orderNumber]` on the table `order` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[paymentExternalId]` on the table `order` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `orderNumber` to the `order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shippingAddress` to the `order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shippingPhone` to the `order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shippingReceiver` to the `order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "order" ADD COLUMN     "orderNumber" TEXT NOT NULL,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentExternalId" TEXT,
ADD COLUMN     "paymentStatus" TEXT,
ADD COLUMN     "paymentUrl" TEXT,
ADD COLUMN     "shippingAddress" TEXT NOT NULL,
ADD COLUMN     "shippingPhone" TEXT NOT NULL,
ADD COLUMN     "shippingReceiver" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "address" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "receiverName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "streetLine1" TEXT NOT NULL,
    "streetLine2" TEXT,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_log" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_orderNumber_key" ON "order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "order_paymentExternalId_key" ON "order"("paymentExternalId");

-- AddForeignKey
ALTER TABLE "address" ADD CONSTRAINT "address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_log" ADD CONSTRAINT "payment_log_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
