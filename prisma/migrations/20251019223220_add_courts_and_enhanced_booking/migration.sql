-- AlterTable
ALTER TABLE "public"."booking" ADD COLUMN     "courtId" TEXT,
ADD COLUMN     "totalPrice" DOUBLE PRECISION,
ADD COLUMN     "upsells" TEXT[];

-- CreateTable
CREATE TABLE "public"."court" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "courtType" TEXT NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "facilityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "court_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."court" ADD CONSTRAINT "court_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "public"."facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."booking" ADD CONSTRAINT "booking_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "public"."court"("id") ON DELETE CASCADE ON UPDATE CASCADE;
