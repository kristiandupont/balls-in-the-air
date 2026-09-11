export type FrequencyUnit = "days" | "weeks" | "months" | "years";

export const FREQUENCY_UNIT_DAYS: Record<FrequencyUnit, number> = {
  days: 1,
  weeks: 7,
  months: 30,
  years: 365,
};

export const FREQUENCY_UNITS = Object.keys(
  FREQUENCY_UNIT_DAYS,
) as FrequencyUnit[];

// Picks the largest unit that divides the day count evenly, so a ball stored as
// 30 days is shown as "1 month" rather than "30 days".
export function splitFrequency(days: number): {
  amount: number;
  unit: FrequencyUnit;
} {
  for (const unit of ["years", "months", "weeks"] as FrequencyUnit[]) {
    const size = FREQUENCY_UNIT_DAYS[unit];
    if (days >= size && days % size === 0) {
      return { amount: days / size, unit };
    }
  }
  return { amount: Math.round(days * 100) / 100, unit: "days" };
}

export function frequencyToDays(amount: number, unit: FrequencyUnit): number {
  return amount * FREQUENCY_UNIT_DAYS[unit];
}

const UNIT_SINGULAR: Record<FrequencyUnit, string> = {
  days: "day",
  weeks: "week",
  months: "month",
  years: "year",
};

// "Every 2 weeks" / "Every month"
export function formatFrequency(days: number): string {
  const { amount, unit } = splitFrequency(days);
  if (amount === 1) {
    return `Every ${UNIT_SINGULAR[unit]}`;
  }
  return `Every ${amount} ${unit}`;
}
