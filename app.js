const defaults = {
  payout: 145,
  miles: 68,
  hours: 3.2,
  mpg: 27,
  gasPrice: 3.45,
  maintenanceCostPerMile: 0.15,
  taxDeductionMileageRate: 0.725,
};

const fields = [
  { key: "payout", label: "Route payout", prefix: "$", step: "1" },
  { key: "miles", label: "Total miles", suffix: "mi", step: "1" },
  { key: "hours", label: "Estimated hours", suffix: "hr", step: "0.1" },
  { key: "mpg", label: "Vehicle MPG", suffix: "mpg", step: "1" },
  { key: "gasPrice", label: "Gas price per gallon", prefix: "$", step: "0.01" },
  { key: "maintenanceCostPerMile", label: "Maintenance cost per mile", prefix: "$", step: "0.01" },
  { key: "taxDeductionMileageRate", label: "Tax deduction mileage rate", prefix: "$", step: "0.001" },
];

const state = { ...defaults };
const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function positive(value) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function getRating(hourlyRate, profitPerMile) {
  if (hourlyRate >= 30 && profitPerMile >= 1.25) {
    return {
      kind: "good",
      label: "Good",
      explanation: "Strong route with healthy hourly return and low operating cost.",
    };
  }

  if ((hourlyRate >= 20 && hourlyRate <= 29) || (profitPerMile >= 0.75 && profitPerMile <= 1.24)) {
    return {
      kind: "borderline",
      label: "Borderline",
      explanation: "The route can work, but the margin is thin. Compare it against your better offers.",
    };
  }

  if (hourlyRate < 20 || profitPerMile < 0.75) {
    return {
      kind: "bad",
      label: "Bad",
      explanation: "This route is likely underpriced once fuel, mileage, and time are counted.",
    };
  }

  return {
    kind: "bad",
    label: "Bad",
    explanation: "This route is likely underpriced once fuel, mileage, and time are counted.",
  };
}

function calculate(inputs) {
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
    rating: getRating(hourlyRate, profitPerMile),
  };
}

function renderFields() {
  const stack = document.querySelector("#field-stack");

  stack.innerHTML = fields
    .map(
      (field) => `
      <div class="field">
        <label for="${field.key}">${field.label}</label>
        <div class="input-shell">
          ${field.prefix ? `<span aria-hidden="true">${field.prefix}</span>` : ""}
          <input id="${field.key}" inputmode="decimal" min="0" step="${field.step}" type="number" value="${defaults[field.key]}" placeholder="0" />
          ${field.suffix ? `<span aria-hidden="true">${field.suffix}</span>` : ""}
        </div>
      </div>
    `,
    )
    .join("");

  fields.forEach((field) => {
    document.querySelector(`#${field.key}`).addEventListener("input", (event) => {
      const nextValue = Number.parseFloat(event.target.value);
      state[field.key] = Number.isFinite(nextValue) ? nextValue : 0;
      renderResults();
    });
  });
}

function setText(selector, value) {
  document.querySelector(selector).textContent = value;
}

function renderResults() {
  const result = calculate(state);
  const badge = document.querySelector("#rating-badge");

  setText("#net-profit", money.format(result.netProfit));
  setText("#fuel-cost", money.format(result.fuelCost));
  setText("#maintenance-cost", money.format(result.maintenanceCost));
  setText("#tax-deduction", money.format(result.taxDeductionValue));
  setText("#profit-mile", money.format(result.profitPerMile));
  setText("#hourly-rate", money.format(result.hourlyRate));
  setText("#rating-copy", result.rating.explanation);

  badge.textContent = result.rating.label;
  badge.className = `rating-badge ${result.rating.kind}`;
}

renderFields();
renderResults();
