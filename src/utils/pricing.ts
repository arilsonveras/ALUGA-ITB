import { Environment } from '../types';

export interface DynamicPriceResult {
  pricePerHour: number;
  reason: string | null;
  isCustom: boolean;
}

export function getPriceForDate(environment: Environment, dateString: string): DynamicPriceResult {
  if (!dateString) {
    return {
      pricePerHour: environment.pricePerHour,
      reason: null,
      isCustom: false
    };
  }

  // 1. Check custom date restrictions (holidays or special date pricing rules list)
  if (environment.customPricingRules && environment.customPricingRules.length > 0) {
    const specialRule = environment.customPricingRules.find((rule) => rule.date === dateString);
    if (specialRule) {
      return {
        pricePerHour: specialRule.pricePerHour,
        reason: `${specialRule.label} (Feriado/Alta Temporada)`,
        isCustom: true
      };
    }
  }

  // 2. Check corporate/host weekend surcharge price rules (Saturday / Sunday)
  try {
    const parts = dateString.split('-');
    const parsedDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const dayOfWeek = parsedDate.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend && environment.weekendPricePerHour !== undefined && environment.weekendPricePerHour > 0) {
      return {
        pricePerHour: environment.weekendPricePerHour,
        reason: 'Tarifa Diferenciada de Fim de Semana',
        isCustom: true
      };
    }
  } catch (error) {
    console.error('Error parsing date for weekend pricing check:', error);
  }

  // 3. Normal Base Day Rate
  return {
    pricePerHour: environment.pricePerHour,
    reason: null,
    isCustom: false
  };
}
