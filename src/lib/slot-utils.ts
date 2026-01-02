"use strict";

/**
 * Shared slot generation utilities for calendar components.
 * Used by both provider calendar and facility page calendar.
 */

export interface TimeSlot {
  time: string;        // "07:00", "07:30", etc.
  duration: number;    // in minutes (30, 60, 90, etc.)
  widthUnits: number;  // for CSS grid (duration / 15)
}

export interface SlotAvailability extends TimeSlot {
  id: string;
  available: boolean;
  price?: number;
  bookingId?: string;
  userName?: string;
  status?: "available" | "booked" | "blocked" | "rain" | "unavailable";
}

/**
 * Parse slot duration from timeSlots array (e.g., ["60min"] -> 60)
 */
export function parseSlotDuration(timeSlots: string[] | undefined): number {
  if (!timeSlots || timeSlots.length === 0) return 60; // Default to 60 minutes
  const match = timeSlots[0].match(/(\d+)min/);
  return match ? parseInt(match[1]) : 60;
}

/**
 * Generate time slots for a specific duration
 * Only includes slots where the entire slot fits within working hours
 */
export function generateTimeSlots(
  durationMinutes: number,
  startHour = 7,
  endHour = 24
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  let currentMinutes = startHour * 60;
  const endMinutes = endHour * 60;
  
  while (currentMinutes < endMinutes) {
    // Check if this slot would extend past closing time
    const slotEndMinutes = currentMinutes + durationMinutes;
    if (slotEndMinutes > endMinutes) {
      // Slot would extend past closing, stop generating
      break;
    }
    
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;
    const time = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    
    // Width in 15-min base units (e.g., 30min = 2 units, 60min = 4 units)
    const widthUnits = durationMinutes / 15;
    
    slots.push({
      time,
      duration: durationMinutes,
      widthUnits,
    });
    
    currentMinutes += durationMinutes;
  }
  
  return slots;
}

/**
 * Calculate width percentage for a slot based on 15min base units
 * Each hour = 4 units, full grid has 17 hours = 68 units (7AM-midnight)
 */
export function getSlotWidthPercent(duration: number): number {
  const unitsPerHour = 4; // 60min / 15min = 4
  const totalHours = 17;
  const totalUnits = totalHours * unitsPerHour;
  const slotUnits = duration / 15;
  return (slotUnits / totalUnits) * 100;
}

/**
 * Get the starting position (left %) for a time slot
 */
export function getSlotLeftPercent(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes;
  const startMinutes = 7 * 60; // 7 AM
  const minutesFromStart = totalMinutes - startMinutes;
  const totalDuration = 17 * 60; // 17 hours
  return (minutesFromStart / totalDuration) * 100;
}

/**
 * Pricing tier calculation based on time and court pricing data
 */
export function getPricingTier(
  time: string, 
  courtPricing?: { 
    mode?: string; 
    basicPrice?: number; 
    advancedPricing?: { 
      tiers?: Array<{ 
        enabled?: boolean; 
        timeRange: string; 
        price: number; 
        name: string; 
      }>; 
    }; 
  }
): { price: number; tier: string } {
  const hour = parseInt(time.split(':')[0]);
  
  // If court has advanced pricing with tiers, use actual tier data
  if (courtPricing?.mode === 'advanced' && courtPricing?.advancedPricing?.tiers) {
    const enabledTiers = courtPricing.advancedPricing.tiers.filter((t) => t.enabled);
    
    // Find matching tier based on time range
    let lastTier = null;
    let maxEndHour = -1;

    for (const tier of enabledTiers) {
      const [startTime, endTime] = tier.timeRange.split('-');
      const startHour = parseInt(startTime.split(':')[0]);
      const endHour = parseInt(endTime.split(':')[0]);
      
      // Track the tier that ends the latest
      if (endHour > maxEndHour) {
        maxEndHour = endHour;
        lastTier = tier;
      }
      
      if (hour >= startHour && hour < endHour) {
        return { price: tier.price, tier: tier.name.toLowerCase() };
      }
    }
    
    // If no exact match found, check if we're past the last tier's end time
    if (lastTier && hour >= maxEndHour) {
      return { price: lastTier.price, tier: lastTier.name.toLowerCase() };
    }
    
    // If no tier matches, use first enabled tier as fallback
    if (enabledTiers.length > 0) {
      return { price: enabledTiers[0].price, tier: enabledTiers[0].name.toLowerCase() };
    }
  }
  
  // If court has basic pricing, use that price
  if (courtPricing?.mode === 'basic' && courtPricing?.basicPrice !== undefined) {
    // Determine tier based on hour for color purposes
    let tier = 'morning';
    if (hour >= 12 && hour < 16) tier = 'afternoon';
    else if (hour >= 16) tier = 'evening';
    return { price: courtPricing.basicPrice, tier };
  }
  
  // Fallback to default pricing
  if (hour < 12) return { price: 15, tier: 'morning' };
  if (hour < 16) return { price: 18, tier: 'afternoon' };
  return { price: 20, tier: 'evening' };
}

/**
 * Color classes for different pricing tiers
 * If useAdvancedColors is false, always return a single green (for basic pricing)
 */
export function getPricingColor(tier: string, useAdvancedColors: boolean = true): string {
  // Basic pricing - single uniform green color
  if (!useAdvancedColors) {
    return 'bg-green-200 border-green-300 text-green-900 hover:bg-green-300';
  }
  
  // Advanced pricing - tiered colors
  switch (tier) {
    case 'morning':
      return 'bg-green-100 border-green-200 text-green-800 hover:bg-green-200';
    case 'afternoon':
      return 'bg-green-200 border-green-300 text-green-900 hover:bg-green-300';
    case 'evening':
      return 'bg-green-300 border-green-400 text-green-950 hover:bg-green-400';
    default:
      return 'bg-green-100 border-green-200 text-green-800 hover:bg-green-200';
  }
}

/**
 * Get slot status color class
 */
export function getSlotStatusColor(
  status: "available" | "booked" | "blocked" | "rain" | "unavailable",
  tier?: string,
  useAdvancedPricing?: boolean
): string {
  switch (status) {
    case "available":
      return getPricingColor(tier || 'morning', useAdvancedPricing);
    case "booked":
      return "bg-red-200 border-red-300 text-red-900";
    case "blocked":
      return "bg-gray-200 border-gray-300 text-gray-600";
    case "rain":
      return "bg-blue-200 border-blue-300 text-blue-800";
    case "unavailable":
      return "bg-gray-100 border-gray-200 text-gray-500";
    default:
      return "bg-gray-100 border-gray-200 text-gray-500";
  }
}
