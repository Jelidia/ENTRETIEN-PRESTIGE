// Dynamic Pricing Calculator — Field Service Management Platform
// Pricing rules, service prices, and holidays are loaded from DB per company.
// Hardcoded values serve only as fallback defaults when no DB config is available.

import { createAdminClient } from "./supabaseServer";

type PricingParams = {
  sqft?: number;
  windows?: number;
  serviceType: string;
  datetime: Date;
  isHoliday?: boolean;
  customerJobCount?: number;
};

type ServicePricing = {
  sqft: number;
  window: number;
  minimum: number;
};

type PricingConfig = {
  services?: Record<string, ServicePricing>;
  eveningSurcharge?: number;
  holidaySurcharge?: number;
  volumeDiscount?: number;
  volumeMinJobs?: number;
  holidays?: string[]; // ISO date strings
};

// Fallback defaults — used only when no company config is loaded
const DEFAULT_SERVICES: Record<string, ServicePricing> = {
  "standard service": { sqft: 0.15, window: 5.0, minimum: 150 },
  "premium service": { sqft: 0.25, window: 8.0, minimum: 250 },
  "emergency service": { sqft: 0.35, window: 12.0, minimum: 400 },
};

const DEFAULT_EVENING_SURCHARGE = 0.20;
const DEFAULT_HOLIDAY_SURCHARGE = 0.15;
const DEFAULT_VOLUME_DISCOUNT = 0.10;
const DEFAULT_VOLUME_MIN_JOBS = 5;

const DEFAULT_HOLIDAYS = [
  "2026-01-01",
  "2026-04-10",
  "2026-05-18",
  "2026-06-24",
  "2026-07-01",
  "2026-09-07",
  "2026-10-12",
  "2026-12-25",
];

export function calculatePrice(
  params: PricingParams,
  config?: PricingConfig,
): {
  basePrice: number;
  timeSurcharge: number;
  holidaySurcharge: number;
  volumeDiscount: number;
  finalPrice: number;
  breakdown: string[];
} {
  const services = config?.services ?? DEFAULT_SERVICES;
  const eveningSurcharge = config?.eveningSurcharge ?? DEFAULT_EVENING_SURCHARGE;
  const holidaySurcharge = config?.holidaySurcharge ?? DEFAULT_HOLIDAY_SURCHARGE;
  const volumeDiscount = config?.volumeDiscount ?? DEFAULT_VOLUME_DISCOUNT;
  const volumeMinJobs = config?.volumeMinJobs ?? DEFAULT_VOLUME_MIN_JOBS;

  const serviceKey = params.serviceType.toLowerCase();
  const pricing = services[serviceKey] ?? Object.values(services)[0] ?? DEFAULT_SERVICES["standard service"];

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
  breakdown.push(`Base price (${serviceKey}): $${basePrice.toFixed(2)}`);

  // Time-based surcharge (evening/weekend)
  let timeSurchargeAmount = 0;
  if (isEveningOrWeekend(params.datetime)) {
    timeSurchargeAmount = basePrice * eveningSurcharge;
    breakdown.push(`Evening/Weekend surcharge (+${(eveningSurcharge * 100).toFixed(0)}%): $${timeSurchargeAmount.toFixed(2)}`);
  }

  // Holiday surcharge
  let holidaySurchargeAmount = 0;
  if (params.isHoliday) {
    const priceWithTime = basePrice + timeSurchargeAmount;
    holidaySurchargeAmount = priceWithTime * holidaySurcharge;
    breakdown.push(`Holiday surcharge (+${(holidaySurcharge * 100).toFixed(0)}%): $${holidaySurchargeAmount.toFixed(2)}`);
  }

  // Volume discount
  let volumeDiscountAmount = 0;
  if (params.customerJobCount && params.customerJobCount >= volumeMinJobs) {
    const priceBeforeDiscount = basePrice + timeSurchargeAmount + holidaySurchargeAmount;
    volumeDiscountAmount = priceBeforeDiscount * volumeDiscount;
    breakdown.push(`Volume discount ${volumeMinJobs}+ jobs (-${(volumeDiscount * 100).toFixed(0)}%): -$${volumeDiscountAmount.toFixed(2)}`);
  }

  const finalPrice = basePrice + timeSurchargeAmount + holidaySurchargeAmount - volumeDiscountAmount;

  return {
    basePrice,
    timeSurcharge: timeSurchargeAmount,
    holidaySurcharge: holidaySurchargeAmount,
    volumeDiscount: volumeDiscountAmount,
    finalPrice,
    breakdown,
  };
}

function isEveningOrWeekend(date: Date): boolean {
  const hour = date.getHours();
  const day = date.getDay();

  if (day === 0 || day === 6) return true;
  if (hour >= 17) return true;

  return false;
}

export function isHoliday(date: Date, holidays?: string[]): boolean {
  const dateStr = date.toISOString().split("T")[0];
  const list = holidays ?? DEFAULT_HOLIDAYS;
  return list.includes(dateStr);
}

/** @deprecated Use isHoliday() instead */
export function isQuebecHoliday(date: Date): boolean {
  return isHoliday(date);
}

// Calculate subscription discount (10% permanent)
export function calculateSubscriptionPrice(basePrice: number): number {
  return basePrice * 0.90;
}

// Calculate loyalty points redemption
export function calculateLoyaltyDiscount(points: number): number {
  return Math.floor(points / 100) * 10;
}

/**
 * Load pricing configuration for a company from the database.
 * Returns a PricingConfig that can be passed to calculatePrice().
 */
export async function loadCompanyPricing(companyId: string): Promise<PricingConfig> {
  const supabase = createAdminClient();

  const [servicesRes, rulesRes, holidaysRes] = await Promise.all([
    supabase
      .from("company_services")
      .select("name, default_price")
      .eq("company_id", companyId)
      .eq("active", true)
      .order("sort_order"),
    supabase
      .from("pricing_rules")
      .select("rule_key, rule_value, conditions")
      .eq("company_id", companyId)
      .eq("is_active", true),
    supabase
      .from("holidays")
      .select("holiday_date")
      .eq("company_id", companyId),
  ]);

  const services: Record<string, ServicePricing> = {};
  if (servicesRes.data) {
    for (const svc of servicesRes.data) {
      services[svc.name.toLowerCase()] = {
        sqft: 0,
        window: 0,
        minimum: Number(svc.default_price) || 0,
      };
    }
  }

  let eveningSurcharge: number | undefined;
  let holidaySurcharge: number | undefined;
  let volumeDiscount: number | undefined;
  let volumeMinJobs: number | undefined;

  if (rulesRes.data) {
    for (const rule of rulesRes.data) {
      switch (rule.rule_key) {
        case "evening_surcharge":
          eveningSurcharge = Number(rule.rule_value);
          break;
        case "holiday_surcharge":
          holidaySurcharge = Number(rule.rule_value);
          break;
        case "volume_discount":
          volumeDiscount = Number(rule.rule_value);
          if (rule.conditions && typeof rule.conditions === "object" && "min_jobs" in rule.conditions) {
            volumeMinJobs = Number((rule.conditions as Record<string, unknown>).min_jobs);
          }
          break;
      }
    }
  }

  const holidays = holidaysRes.data?.map((h) => h.holiday_date) ?? [];

  return {
    services: Object.keys(services).length > 0 ? services : undefined,
    eveningSurcharge,
    holidaySurcharge,
    volumeDiscount,
    volumeMinJobs,
    holidays,
  };
}
