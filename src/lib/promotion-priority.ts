/**
 * Promotion Priority Logic
 * 
 * When multiple promotions apply to a booking, the system automatically
 * selects the promotion that offers the best deal (largest discount/lowest price).
 * 
 * Priority Rules:
 * 1. Calculate the final price for each applicable promotion
 * 2. Select the promotion that results in the lowest final price
 * 3. If prices are equal, prefer percentage discounts over fixed amounts
 * 
 * Example:
 * - Promotion A: 20% off (original price €50 → €40)
 * - Promotion B: €5 off (original price €50 → €45)
 * - Result: Promotion A is applied (€40 < €45)
 */

export interface PromotionEligibility {
  promotionId: string;
  finalPrice: number;
  discountAmount: number;
  discountType: "percentage" | "fixed";
  discountValue: number;
}

/**
 * Calculate the best promotion from a list of eligible promotions
 * Returns the promotion that results in the lowest final price
 */
export function selectBestPromotion(
  eligiblePromotions: PromotionEligibility[]
): PromotionEligibility | null {
  if (eligiblePromotions.length === 0) {
    return null;
  }

  if (eligiblePromotions.length === 1) {
    return eligiblePromotions[0];
  }

  // Sort by final price (lowest first), then by discount type preference
  const sorted = eligiblePromotions.sort((a, b) => {
    // Primary sort: lowest final price wins
    if (a.finalPrice !== b.finalPrice) {
      return a.finalPrice - b.finalPrice;
    }
    
    // Secondary sort: if prices are equal, prefer percentage discounts
    if (a.discountType === "percentage" && b.discountType === "fixed") {
      return -1;
    }
    if (a.discountType === "fixed" && b.discountType === "percentage") {
      return 1;
    }
    
    // Tertiary sort: if both same type, prefer larger discount value
    return b.discountValue - a.discountValue;
  });

  return sorted[0];
}

/**
 * Calculate final price after applying a promotion
 */
export function calculateFinalPrice(
  originalPrice: number,
  discountType: "percentage" | "fixed",
  discountValue: number
): number {
  if (discountType === "percentage") {
    return originalPrice * (1 - discountValue / 100);
  } else {
    return Math.max(0, originalPrice - discountValue);
  }
}

