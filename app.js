const defaults = {
  payout: 145,
  miles: 68,
  hours: 3.2,
  mpg: 27,
  gasPrice: 3.45,
  maintenanceCostPerMile: 0.15,
  taxDeductionMileageRate: 0.725,
  daysPerWeek: 5,
};

const fields = [
  { key: "payout", label: "Route payout", prefix: "$", step: "1", param: "payout" },
  { key: "miles", label: "Total miles", suffix: "mi", step: "1", param: "miles" },
  { key: "hours", label: "Estimated hours", suffix: "hr", step: "0.1", param: "hours" },
  { key: "mpg", label: "Vehicle MPG", suffix: "mpg", step: "1", param: "mpg" },
  { key: "gasPrice", label: "Gas price per gallon", prefix: "$", step: "0.01", param: "gas" },
  { key: "maintenanceCostPerMile", label: "Maintenance cost per mile", prefix: "$", step: "0.01", param: "maintenance" },
  { key: "taxDeductionMileageRate", label: "Tax deduction mileage rate", prefix: "$", step: "0.001", param: "deduction" },
];

const analyticsEvents = {
  calculatorUsed: "calculator_used",
  routeRatedGood: "route_rated_good",
  routeRatedBad: "route_rated_bad",
  shareRoute: "share_route",
  compareRouteStarted: "compare_route_started",
  projectionUsed: "projection_used",
  screenshotSaved: "screenshot_saved",
};

const analysisMessages = {
  good: [
    "Excellent route with strong hourly returns.",
    "Low operating costs make this a profitable route.",
    "Healthy margin for the miles and time involved.",
  ],
  borderline: [
    "This route may become profitable if mileage is reduced.",
    "Fuel costs are cutting into earnings.",
    "The margin is workable, but not comfortable.",
  ],
  bad: [
    "High mileage and low payout make this route risky.",
    "This route may cost more than expected to operate.",
    "The numbers are not strong enough for a daily route.",
  ],
};

const state = { ...defaults, ...readRouteParams() };
const inputChanges = new Set();
const trackedRatings = new Set();
let calculatorUsedTracked = false;
let projectionUsedTracked = false;
let lastRatingKind = "";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function positive(value) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function parseNumber(value) {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : 0;
}

function trackEvent(eventName, payload = {}) {
  if (window.umami && typeof window.umami.track === "function") {
    window.umami.track(eventName, payload);
  }
}

function readRouteParams() {
  const params = new URLSearchParams(window.location.search);
  const values = {};

  fields.forEach((field) => {
    const raw = params.get(field.param) || params.get(field.key);
    if (raw !== null) {
      values[field.key] = parseNumber(raw);
    }
  });

  const days = params.get("days");
  if (days !== null) {
    values.daysPerWeek = clamp(Math.round(parseNumber(days)), 1, 7);
  }

  return values;
}

function hasValidRouteInputs(inputs) {
  return ["payout", "miles", "hours", "mpg", "gasPrice"].every((key) => positive(inputs[key]) > 0);
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

  return {
    kind: "bad",
    label: "Bad",
    explanation: "This route is likely underpriced once fuel, mileage, and time are counted.",
  };
}

function calculate(inputs) {
  if (!hasValidRouteInputs(inputs)) {
    return {
      valid: false,
      fuelCost: 0,
      maintenanceCost: 0,
      netProfit: 0,
      taxDeductionValue: 0,
      profitPerMile: 0,
      hourlyRate: 0,
      rating: {
        kind: "empty",
        label: "Ready",
        explanation: "Enter route details to calculate profitability.",
      },
    };
  }

  const payout = positive(inputs.payout);
  const miles = positive(inputs.miles);
  const hours = positive(inputs.hours);
  const mpg = positive(inputs.mpg);
  const gasPrice = positive(inputs.gasPrice);
  const maintenanceCostPerMile = positive(inputs.maintenanceCostPerMile);
  const taxDeductionMileageRate = positive(inputs.taxDeductionMileageRate);
  const fuelCost = (miles / mpg) * gasPrice;
  const maintenanceCost = miles * maintenanceCostPerMile;
  const netProfit = Math.max(0, payout - fuelCost - maintenanceCost);
  const taxDeductionValue = miles * taxDeductionMileageRate;
  const profitPerMile = miles > 0 ? netProfit / miles : 0;
  const hourlyRate = hours > 0 ? netProfit / hours : 0;

  return {
    valid: true,
    fuelCost,
    maintenanceCost,
    netProfit,
    taxDeductionValue,
    profitPerMile,
    hourlyRate,
    rating: getRating(hourlyRate, profitPerMile),
  };
}

function getSummary(result) {
  if (!result.valid) {
    return "Enter route details to calculate profitability.";
  }

  const messages = analysisMessages[result.rating.kind] || analysisMessages.bad;
  const seed = Math.round(state.payout + state.miles + state.hours + state.gasPrice);
  return messages[seed % messages.length];
}

function getBreakdown(result) {
  const total = result.fuelCost + result.maintenanceCost + result.netProfit;

  if (!result.valid || total <= 0) {
    return { fuel: 0, maintenance: 0, takeHome: 0 };
  }

  return {
    fuel: (result.fuelCost / total) * 100,
    maintenance: (result.maintenanceCost / total) * 100,
    takeHome: (result.netProfit / total) * 100,
  };
}

function getProjection(result) {
  const days = clamp(Math.round(positive(state.daysPerWeek) || defaults.daysPerWeek), 1, 7);
  const weekly = result.valid ? result.netProfit * days : 0;

  return {
    days,
    weekly,
    monthly: weekly * 4.33,
    yearly: weekly * 52,
  };
}

function buildShareUrl() {
  const params = new URLSearchParams();

  fields.forEach((field) => {
    const value = positive(state[field.key]);
    if (value > 0) {
      params.set(field.param, trimNumber(value));
    }
  });

  params.set("days", String(clamp(Math.round(positive(state.daysPerWeek) || defaults.daysPerWeek), 1, 7)));

  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

function trimNumber(value) {
  return Number.parseFloat(value.toFixed(3)).toString();
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove("is-visible"), 2300);
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element.textContent !== value) {
    element.textContent = value;
    element.classList.remove("value-pop");
    window.requestAnimationFrame(() => element.classList.add("value-pop"));
  }
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
          <input id="${field.key}" inputmode="decimal" min="0" step="${field.step}" type="number" value="${state[field.key] || ""}" placeholder="0" />
          ${field.suffix ? `<span aria-hidden="true">${field.suffix}</span>` : ""}
        </div>
      </div>
    `,
    )
    .join("");

  fields.forEach((field) => {
    document.querySelector(`#${field.key}`).addEventListener("input", (event) => {
      inputChanges.add(field.key);
      state[field.key] = parseNumber(event.target.value);
      renderResults();
    });
  });
}

function bindProjectionInput() {
  const input = document.querySelector("#days-per-week");
  input.value = clamp(Math.round(positive(state.daysPerWeek) || defaults.daysPerWeek), 1, 7);

  input.addEventListener("input", (event) => {
    state.daysPerWeek = clamp(Math.round(parseNumber(event.target.value)), 1, 7);
    event.target.value = state.daysPerWeek;
    if (!projectionUsedTracked && calculate(state).valid) {
      projectionUsedTracked = true;
      trackEvent(analyticsEvents.projectionUsed);
    }
    renderResults();
  });
}

function bindTrackedActions() {
  document.querySelectorAll("[data-track-event]").forEach((element) => {
    element.addEventListener("click", () => {
      trackEvent(element.dataset.trackEvent);
    });
  });

  document.querySelector("#share-route").addEventListener("click", shareRoute);
  document.querySelector("#mobile-share-route").addEventListener("click", shareRoute);
  document.querySelector("#save-screenshot").addEventListener("click", saveScreenshot);
  document.querySelector("#mobile-save-screenshot").addEventListener("click", saveScreenshot);
}

async function shareRoute() {
  const url = buildShareUrl();
  await copyText(url);
  showToast("Route link copied!");
  trackEvent(analyticsEvents.shareRoute);
}

function saveScreenshot() {
  const result = calculate(state);
  const canvas = document.createElement("canvas");
  const size = 1080;
  const scale = window.devicePixelRatio || 1;
  canvas.width = size * scale;
  canvas.height = size * scale;

  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  drawScreenshotCard(ctx, result, size);

  const link = document.createElement("a");
  link.download = `routeworth-${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  trackEvent(analyticsEvents.screenshotSaved);
}

function drawScreenshotCard(ctx, result, size) {
  ctx.fillStyle = "#0b0d10";
  ctx.fillRect(0, 0, size, size);

  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "rgba(15, 163, 251, 0.2)");
  gradient.addColorStop(0.45, "rgba(255, 255, 255, 0.04)");
  gradient.addColorStop(1, "rgba(15, 163, 251, 0.08)");
  ctx.fillStyle = gradient;
  roundRect(ctx, 70, 70, 940, 940, 42);
  ctx.fill();

  ctx.fillStyle = "#0FA3FB";
  roundRect(ctx, 110, 115, 116, 116, 58);
  ctx.fill();

  ctx.fillStyle = "#061018";
  ctx.font = "900 38px Inter, Arial, sans-serif";
  ctx.fillText("RW", 139, 185);

  ctx.fillStyle = "#f7fbff";
  ctx.font = "900 72px Inter, Arial, sans-serif";
  ctx.fillText("RouteWorth", 110, 300);

  ctx.fillStyle = "rgba(247, 251, 255, 0.68)";
  ctx.font = "500 34px Inter, Arial, sans-serif";
  ctx.fillText("Courier route profit check", 110, 352);

  drawScreenshotMetric(ctx, "Payout", money.format(positive(state.payout)), 110, 455);
  drawScreenshotMetric(ctx, "Miles", `${trimNumber(positive(state.miles))} mi`, 570, 455);
  drawScreenshotMetric(ctx, "Hourly", money.format(result.hourlyRate), 110, 650);
  drawScreenshotMetric(ctx, "Rating", result.rating.label, 570, 650, result.rating.kind);

  ctx.fillStyle = "rgba(247, 251, 255, 0.72)";
  ctx.font = "600 32px Inter, Arial, sans-serif";
  ctx.fillText(getSummary(result), 110, 860);

  ctx.fillStyle = "rgba(247, 251, 255, 0.46)";
  ctx.font = "500 26px Inter, Arial, sans-serif";
  ctx.fillText("Built for independent couriers", 110, 930);
}

function drawScreenshotMetric(ctx, label, value, x, y, tone = "") {
  const toneColor = tone === "good" ? "#7df0af" : tone === "borderline" ? "#ffe27a" : tone === "bad" ? "#ff8d8d" : "#8fd9ff";

  ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
  roundRect(ctx, x, y, 390, 138, 28);
  ctx.fill();

  ctx.fillStyle = "rgba(247, 251, 255, 0.56)";
  ctx.font = "700 24px Inter, Arial, sans-serif";
  ctx.fillText(label.toUpperCase(), x + 28, y + 45);

  ctx.fillStyle = toneColor;
  ctx.font = "900 48px Inter, Arial, sans-serif";
  ctx.fillText(value, x + 28, y + 102);
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function trackCalculationEvents(result) {
  if (inputChanges.size === 0) {
    lastRatingKind = result.rating.kind;
    return;
  }

  if (!calculatorUsedTracked && inputChanges.size >= 3 && result.valid) {
    calculatorUsedTracked = true;
    trackEvent(analyticsEvents.calculatorUsed, {
      rating: result.rating.kind,
    });
  }

  if (!result.valid || result.rating.kind === lastRatingKind) {
    return;
  }

  lastRatingKind = result.rating.kind;

  if (result.rating.kind === "good" && !trackedRatings.has("good")) {
    trackedRatings.add("good");
    trackEvent(analyticsEvents.routeRatedGood);
  }

  if (result.rating.kind === "bad" && !trackedRatings.has("bad")) {
    trackedRatings.add("bad");
    trackEvent(analyticsEvents.routeRatedBad);
  }
}

function renderBreakdown(result) {
  const breakdown = getBreakdown(result);
  const fuelBar = document.querySelector("#fuel-bar");
  const maintenanceBar = document.querySelector("#maintenance-bar");
  const takeHomeBar = document.querySelector("#take-home-bar");

  takeHomeBar.style.width = `${breakdown.takeHome}%`;
  fuelBar.style.width = `${breakdown.fuel}%`;
  maintenanceBar.style.width = `${breakdown.maintenance}%`;
  fuelBar.style.left = `${breakdown.takeHome}%`;
  maintenanceBar.style.left = `${breakdown.takeHome + breakdown.fuel}%`;
  setText("#take-home-percent", `${Math.round(breakdown.takeHome)}% take-home`);
}

function renderProjection(result) {
  const projection = getProjection(result);
  const input = document.querySelector("#days-per-week");

  if (document.activeElement !== input) {
    input.value = projection.days;
  }

  setText("#weekly-income", money.format(projection.weekly));
  setText("#monthly-income", money.format(projection.monthly));
  setText("#yearly-income", money.format(projection.yearly));
}

function renderResults() {
  const result = calculate(state);
  const badge = document.querySelector("#rating-badge");
  const resultsCard = document.querySelector(".results-card");
  const summary = getSummary(result);

  resultsCard.dataset.rating = result.rating.kind;
  badge.textContent = result.rating.label;
  badge.className = `rating-badge ${result.rating.kind}`;

  setText("#net-profit", money.format(result.netProfit));
  setText("#fuel-cost", money.format(result.fuelCost));
  setText("#maintenance-cost", money.format(result.maintenanceCost));
  setText("#tax-deduction", money.format(result.taxDeductionValue));
  setText("#profit-mile", money.format(result.profitPerMile));
  setText("#hourly-rate", money.format(result.hourlyRate));
  setText("#rating-summary", summary);
  setText("#rating-copy", result.valid ? result.rating.explanation : "Enter route details to calculate profitability.");

  renderBreakdown(result);
  renderProjection(result);
  trackCalculationEvents(result);
}

renderFields();
bindProjectionInput();
renderResults();
bindTrackedActions();
