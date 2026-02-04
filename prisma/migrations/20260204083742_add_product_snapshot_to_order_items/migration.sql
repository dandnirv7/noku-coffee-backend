/*
  Warnings:

  - Added the required column `productNameSnapshot` to the `order_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productSkuSnapshot` to the `order_item` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "order_item" DROP CONSTRAINT "order_item_productId_fkey";

-- AlterTable
ALTER TABLE "order_item" ADD COLUMN     "productNameSnapshot" TEXT NOT NULL,
ADD COLUMN     "productSkuSnapshot" TEXT NOT NULL,
ALTER COLUMN "productId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
