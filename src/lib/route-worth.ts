export type RouteInputs = {
  payout: number;
  miles: number;
  hours: number;
  mpg: number;
  gasPrice: number;
  maintenanceCostPerMile: number;
  taxDeductionMileageRate: number;
};

export type RouteRatingKind = "GOOD" | "BORDERLINE" | "BAD";

export type RouteRating = {
  kind: RouteRatingKind;
  label: string;
  explanation: string;
};

export type RouteResults = {
  fuelCost: number;
  maintenanceCost: number;
  netProfit: number;
  taxDeductionValue: number;
  profitPerMile: number;
  hourlyRate: number;
  rating: RouteRating;
};

function positive(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function getRouteRating(hourlyRate: number, profitPerMile: number): RouteRating {
  if (hourlyRate >= 30 && profitPerMile >= 1.25) {
    return {
      kind: "GOOD",
      label: "Good",
      explanation: "Strong route with healthy hourly return and low operating cost.",
    };
  }

  if ((hourlyRate >= 20 && hourlyRate <= 29) || (profitPerMile >= 0.75 && profitPerMile <= 1.24)) {
    return {
      kind: "BORDERLINE",
      label: "Borderline",
      explanation: "The route can work, but the margin is thin. Compare it against your better offers.",
    };
  }

  if (hourlyRate < 20 || profitPerMile < 0.75) {
    return {
      kind: "BAD",
      label: "Bad",
      explanation: "This route is likely underpriced once fuel, mileage, and time are counted.",
    };
  }

  return {
    kind: "BAD",
    label: "Bad",
    explanation: "This route is likely underpriced once fuel, mileage, and time are counted.",
  };
}

export function calculateRouteWorth(inputs: RouteInputs): RouteResults {
  const payout = positive(inputs.payout);
  const miles = positive(inputs.miles);
  const hours = positive(inputs.hours);
  const mpg = positive(inputs.mpg);
  const gasPrice = positive(inputs.gasPrice);
  const maintenanceCostPerMile = positive(inputs.maintenanceCostPerMile);
  const taxDeductionMileageRate = positive(inputs.taxDeductionMileageRate);
  const fuelCost = mpg > 0 ? (miles / mpg) * gasPrice : 0;
  const maintenanceCost = miles * maintenanceCostPerMile;
  const netProfit = Math.max(0, payout - fuelCost - maintenanceCost);
  const taxDeductionValue = miles * taxDeductionMileageRate;
  const profitPerMile = miles > 0 ? netProfit / miles : 0;
  const hourlyRate = hours > 0 ? netProfit / hours : 0;

  return {
    fuelCost,
    maintenanceCost,
    netProfit,
    taxDeductionValue,
    profitPerMile,
    hourlyRate,
    rating: getRouteRating(hourlyRate, profitPerMile),
  };
}
