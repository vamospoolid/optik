/*
  Warnings:

  - You are about to drop the column `product_id` on the `order_items` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "LensFeature" ADD VALUE 'blue_protect';

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "frame_item";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "lens_item";

-- AlterTable
ALTER TABLE "frames" ADD COLUMN     "sku" TEXT,
ADD COLUMN     "supplier_id" TEXT;

-- AlterTable
ALTER TABLE "lenses" ADD COLUMN     "supplier_id" TEXT;

-- AlterTable
ALTER TABLE "order_items" DROP COLUMN "product_id",
ADD COLUMN     "frame_id" TEXT,
ADD COLUMN     "lens_id" TEXT;

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_person" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "frames" ADD CONSTRAINT "frames_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lenses" ADD CONSTRAINT "lenses_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_frame_id_fkey" FOREIGN KEY ("frame_id") REFERENCES "frames"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_lens_id_fkey" FOREIGN KEY ("lens_id") REFERENCES "lenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
