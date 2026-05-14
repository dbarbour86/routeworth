"use client";

import { useMemo, useState } from "react";

import { calculateRouteWorth, type RouteInputs, type RouteRatingKind } from "@/lib/route-worth";

const defaultInputs: RouteInputs = {
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
] satisfies Array<{
  key: keyof RouteInputs;
  label: string;
  prefix?: string;
  suffix?: string;
  step: string;
}>;

const ratingStyles: Record<RouteRatingKind, string> = {
  GOOD: "border-emerald-400/35 bg-emerald-400/14 text-emerald-200",
  BORDERLINE: "border-yellow-300/38 bg-yellow-300/13 text-yellow-100",
  BAD: "border-red-400/38 bg-red-400/13 text-red-100",
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function readNumber(value: string): number {
  const number = Number.parseFloat(value);

  return Number.isFinite(number) ? number : 0;
}

function money(value: number): string {
  return currency.format(Number.isFinite(value) ? value : 0);
}

export function RouteCalculator() {
  const [inputs, setInputs] = useState<RouteInputs>(defaultInputs);
  const results = useMemo(() => calculateRouteWorth(inputs), [inputs]);

  function updateInput(key: keyof RouteInputs, value: string) {
    setInputs((current) => ({
      ...current,
      [key]: readNumber(value),
    }));
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
      <div className="rounded-[1.6rem] border border-white/10 bg-[oklch(0.18_0.01_248/.92)] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.38)] sm:p-5">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#0FA3FB]">Calculator</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Route numbers</h2>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-xs text-white/50">
            V1
          </div>
        </div>

        <div className="grid gap-3">
          {fields.map((field) => (
            <label key={field.key} className="group block">
              <span className="mb-2 block text-sm font-semibold text-white/70">{field.label}</span>
              <span className="flex min-h-14 items-center rounded-2xl border border-white/10 bg-[#0d1116] px-4 transition duration-200 group-focus-within:border-[#0FA3FB]/75 group-focus-within:shadow-[0_0_0_4px_rgba(15,163,251,0.12)]">
                {field.prefix ? <span className="mr-2 text-lg font-bold text-white/36">{field.prefix}</span> : null}
                <input
                  inputMode="decimal"
                  min="0"
                  step={field.step}
                  type="number"
                  value={inputs[field.key] || ""}
                  onChange={(event) => updateInput(field.key, event.target.value)}
                  className="w-full bg-transparent text-xl font-bold text-white outline-none placeholder:text-white/18"
                  placeholder="0"
                />
                {field.suffix ? <span className="ml-2 text-sm font-bold uppercase tracking-wide text-white/36">{field.suffix}</span> : null}
              </span>
            </label>
          ))}
        </div>
      </div>

      <aside className="rounded-[1.6rem] border border-[#0FA3FB]/20 bg-[linear-gradient(180deg,rgba(15,163,251,0.12),rgba(255,255,255,0.035)_32%,rgba(255,255,255,0.025))] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.42)] sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#9bdcff]">Live result</p>
            <output className="mt-2 block text-3xl font-black tracking-tight text-white">{money(results.netProfit)}</output>
            <p className="mt-1 text-sm text-white/48">Estimated net profit</p>
          </div>
          <div className={`rounded-full border px-3 py-2 text-xs font-black tracking-[0.12em] ${ratingStyles[results.rating.kind]}`}>
            {results.rating.label}
          </div>
        </div>

        <p className="mb-5 rounded-2xl border border-white/8 bg-black/18 p-4 text-sm leading-6 text-white/66">
          {results.rating.explanation}
        </p>

        <div className="grid gap-2">
          <Metric label="Estimated fuel cost" value={money(results.fuelCost)} />
          <Metric label="Estimated maintenance cost" value={money(results.maintenanceCost)} />
          <Metric label="Estimated tax deduction value" value={money(results.taxDeductionValue)} />
          <Metric label="Profit per mile" value={money(results.profitPerMile)} accent />
          <Metric label="Effective hourly rate" value={money(results.hourlyRate)} accent />
        </div>

        <div className="mt-5 grid grid-cols-3 overflow-hidden rounded-2xl border border-white/10 bg-black/20 text-center">
          <Threshold label="Bad" value="< $20/hr" tone="text-red-200" />
          <Threshold label="Watch" value="$20-29/hr" tone="text-yellow-100" />
          <Threshold label="Good" value="$30+/hr" tone="text-emerald-200" />
        </div>
      </aside>
    </section>
  );
}

function Metric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 rounded-2xl border border-white/8 bg-black/16 px-4">
      <span className="text-sm text-white/55">{label}</span>
      <output className={accent ? "font-mono text-lg font-black text-[#8fd9ff]" : "font-mono text-base font-bold text-white/86"}>
        {value}
      </output>
    </div>
  );
}

function Threshold({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="border-r border-white/8 p-3 last:border-r-0">
      <p className={`text-xs font-black uppercase tracking-[0.14em] ${tone}`}>{label}</p>
      <p className="mt-1 font-mono text-[0.7rem] text-white/42">{value}</p>
    </div>
  );
}
