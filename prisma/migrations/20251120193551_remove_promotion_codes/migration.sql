-- Remove promotion code column and unique constraint
ALTER TABLE "promotion" DROP CONSTRAINT IF EXISTS "promotion_promotionCode_key";
ALTER TABLE "promotion" DROP COLUMN IF EXISTS "promotionCode";

