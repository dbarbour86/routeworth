import { RouteCalculator } from "@/components/route-calculator";

const infoCards = [
  {
    eyebrow: "Hourly",
    title: "Know your true hourly pay",
    text: "See what the route pays after time, fuel, and vehicle wear are counted.",
  },
  {
    eyebrow: "Margin",
    title: "Avoid low-profit routes",
    text: "Spot offers that look fine up front but fall apart after operating costs.",
  },
  {
    eyebrow: "Speed",
    title: "Compare route offers instantly",
    text: "Run numbers while you are parked, between dispatches, or before accepting.",
  },
];

const futureTools = [
  "Multi-Route Stack Planner",
  "Mileage Deduction Calculator",
  "Courier Expense Tracker",
  "Anonymous Route Board",
  "Weekly Earnings Planner",
];

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "RouteWorth",
    url: "https://routeworth.com/",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any",
    description:
      "Calculate real medical courier route profits instantly. Estimate fuel costs, hourly earnings, maintenance expenses, and route profitability for independent courier drivers and delivery contractors.",
    audience: {
      "@type": "Audience",
      audienceType: "Independent medical couriers and delivery contractors",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <main className="min-h-screen overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <section className="mx-auto flex w-full max-w-6xl flex-col px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        <nav className="mb-10 flex items-center justify-between rounded-full border border-white/8 bg-white/[0.035] px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-full bg-[#0FA3FB] text-sm font-black text-[#061018] shadow-[0_0_28px_rgba(15,163,251,0.42)]">
              RW
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight">RouteWorth</p>
              <p className="text-xs text-white/48">Courier route calculator</p>
            </div>
          </div>
          <a
            href="#calculator"
            className="rounded-full border border-[#0FA3FB]/45 bg-[#0FA3FB]/12 px-4 py-2 text-sm font-semibold text-[#92d9ff] transition duration-200 hover:border-[#0FA3FB] hover:bg-[#0FA3FB]/20 focus:outline-none focus:ring-2 focus:ring-[#0FA3FB]/70"
          >
            Open
          </a>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
          <header className="pb-2">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#9bdcff]">
              Live route math
            </div>
            <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Is This Courier Route Worth It?
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-7 text-white/68 sm:text-xl">
              Quickly calculate real route profits for medical couriers, independent drivers, and delivery contractors.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href="#calculator"
                className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-[#0FA3FB] px-6 text-base font-bold text-[#061018] shadow-[0_18px_45px_rgba(15,163,251,0.28)] transition duration-200 hover:translate-y-[-1px] hover:bg-[#38b6ff] focus:outline-none focus:ring-2 focus:ring-[#8edaff]"
              >
                Calculate Route Profit
              </a>
              <div className="flex min-h-14 items-center rounded-2xl border border-white/10 bg-white/[0.035] px-5 text-sm text-white/62">
                Built for fast checks before you accept.
              </div>
            </div>
          </header>

          <div id="calculator" className="scroll-mt-6">
            <RouteCalculator />
          </div>
        </div>
      </section>

      <section className="border-y border-white/8 bg-black/18 py-9">
        <div className="mx-auto grid w-full max-w-6xl gap-3 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
          {infoCards.map((card) => (
            <article
              key={card.title}
              className="rounded-[1.4rem] border border-white/9 bg-white/[0.035] p-5 shadow-[0_18px_48px_rgba(0,0,0,0.18)] transition duration-300 hover:-translate-y-0.5 hover:border-[#0FA3FB]/32"
            >
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#0FA3FB]">{card.eyebrow}</p>
              <h2 className="mt-4 text-xl font-bold tracking-tight text-white">{card.title}</h2>
              <p className="mt-3 text-sm leading-6 text-white/58">{card.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-white/42">Coming soon</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Future tools</h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {futureTools.map((tool) => (
            <div key={tool} className="min-h-28 rounded-[1.25rem] border border-dashed border-white/12 bg-white/[0.025] p-4 text-white/45">
              <div className="mb-4 h-1 w-8 rounded-full bg-[#0FA3FB]/42" />
              <h3 className="text-sm font-bold leading-5 text-white/68">{tool}</h3>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/32">Coming soon</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="px-4 pb-8 text-center text-sm text-white/42">Built for independent couriers.</footer>
    </main>
  );
}
