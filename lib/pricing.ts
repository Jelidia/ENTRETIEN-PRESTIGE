// Dynamic Pricing Calculator for Entretien Prestige
// Includes: size, time, holiday, volume discounts

type PricingParams = {
  sqft?: number; // Square footage
  windows?: number; // Number of windows
  serviceType: string; // "basique" | "premium" | "prestige"
  datetime: Date; // When the job is scheduled
  isHoliday?: boolean; // Holiday surcharge
  customerJobCount?: number; // Total jobs for this customer (for volume discount)
};

// Base pricing per service type
const BASE_PRICES = {
  basique: {
    sqft: 0.15, // $0.15 per sq ft
    window: 5.0, // $5 per window
    minimum: 150, // $150 minimum
  },
  premium: {
    sqft: 0.25,
    window: 8.0,
    minimum: 250,
  },
  prestige: {
    sqft: 0.35,
    window: 12.0,
    minimum: 400,
  },
};

export function calculatePrice(params: PricingParams): {
  basePrice: number;
  timeSurcharge: number;
  holidaySurcharge: number;
  volumeDiscount: number;
  finalPrice: number;
  breakdown: string[];
} {
  const serviceType = params.serviceType.toLowerCase() as keyof typeof BASE_PRICES;
  const pricing = BASE_PRICES[serviceType] || BASE_PRICES.basique;

  // Calculate base price
  let basePrice = pricing.minimum;

  if (params.sqft) {
    const sqftPrice = params.sqft * pricing.sqft;
    basePrice = Math.max(basePrice, sqftPrice);
  }

  if (params.windows) {
    basePrice += params.windows * pricing.window;
  }

  const breakdown: string[] = [];
  breakdown.push(`Base price (${serviceType}): $${basePrice.toFixed(2)}`);

  // Time-based surcharge (+20% for evening/weekend)
  let timeSurcharge = 0;
  if (isEveningOrWeekend(params.datetime)) {
    timeSurcharge = basePrice * 0.20;
    breakdown.push(`Evening/Weekend surcharge (+20%): $${timeSurcharge.toFixed(2)}`);
  }

  // Holiday surcharge (+15%)
  let holidaySurcharge = 0;
  if (params.isHoliday) {
    const priceWithTime = basePrice + timeSurcharge;
    holidaySurcharge = priceWithTime * 0.15;
    breakdown.push(`Holiday surcharge (+15%): $${holidaySurcharge.toFixed(2)}`);
  }

  // Volume discount (5+ jobs = 10% off)
  let volumeDiscount = 0;
  if (params.customerJobCount && params.customerJobCount >= 5) {
    const priceBeforeDiscount = basePrice + timeSurcharge + holidaySurcharge;
    volumeDiscount = priceBeforeDiscount * 0.10;
    breakdown.push(`Volume discount 5+ jobs (-10%): -$${volumeDiscount.toFixed(2)}`);
  }

  const finalPrice = basePrice + timeSurcharge + holidaySurcharge - volumeDiscount;

  return {
    basePrice,
    timeSurcharge,
    holidaySurcharge,
    volumeDiscount,
    finalPrice,
    breakdown,
  };
}

function isEveningOrWeekend(date: Date): boolean {
  const hour = date.getHours();
  const day = date.getDay();

  // Weekend: Saturday (6) or Sunday (0)
  if (day === 0 || day === 6) {
    return true;
  }

  // Evening: after 5 PM (17:00)
  if (hour >= 17) {
    return true;
  }

  return false;
}

// Quebec holidays (2026)
const QUEBEC_HOLIDAYS_2026 = [
  "2026-01-01", // New Year's Day
  "2026-04-10", // Good Friday
  "2026-05-18", // National Patriots' Day
  "2026-06-24", // Saint-Jean-Baptiste Day
  "2026-07-01", // Canada Day
  "2026-09-07", // Labour Day
  "2026-10-12", // Thanksgiving
  "2026-12-25", // Christmas
];

export function isQuebecHoliday(date: Date): boolean {
  const dateStr = date.toISOString().split("T")[0];
  return QUEBEC_HOLIDAYS_2026.includes(dateStr);
}

// Calculate subscription discount (10% permanent)
export function calculateSubscriptionPrice(basePrice: number): number {
  return basePrice * 0.90; // 10% discount
}

// Calculate loyalty points redemption
export function calculateLoyaltyDiscount(points: number): number {
  // 100 points = $10 off
  return Math.floor(points / 100) * 10;
}
