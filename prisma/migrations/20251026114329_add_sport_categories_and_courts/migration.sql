-- AlterTable
ALTER TABLE "booking" ADD COLUMN     "courtId" TEXT;

-- CreateTable
CREATE TABLE "court" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "surface" TEXT,
    "capacity" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sportCategoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "court_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "court" ADD CONSTRAINT "court_sportCategoryId_fkey" FOREIGN KEY ("sportCategoryId") REFERENCES "sport_category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "court"("id") ON DELETE CASCADE ON UPDATE CASCADE;
