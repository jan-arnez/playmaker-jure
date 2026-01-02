/*
  Warnings:

  - You are about to drop the column `courtId` on the `booking` table. All the data in the column will be lost.
  - You are about to drop the column `totalPrice` on the `booking` table. All the data in the column will be lost.
  - You are about to drop the column `upsells` on the `booking` table. All the data in the column will be lost.
  - You are about to drop the `court` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."booking" DROP CONSTRAINT "booking_courtId_fkey";

-- DropForeignKey
ALTER TABLE "public"."court" DROP CONSTRAINT "court_facilityId_fkey";

-- AlterTable
ALTER TABLE "booking" DROP COLUMN "courtId",
DROP COLUMN "totalPrice",
DROP COLUMN "upsells";

-- DropTable
DROP TABLE "public"."court";

-- CreateTable
CREATE TABLE "sport_category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sport_category_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sport_category" ADD CONSTRAINT "sport_category_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;
