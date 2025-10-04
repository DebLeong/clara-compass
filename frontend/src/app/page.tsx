"use client";
import React, { useMemo, useState } from "react";

// Clara Compass — Landing Screen MVP
// One-file React component with TailwindCSS
// - 3-tap onboarding (ecosystem, membership, local commerce)
// - Computes a simple Familiarity Score and surfaces 6 logos
// - Modular so it can be wired to backend later

// --- Helpers ---------------------------------------------------------------
const companies = {
  // Ecosystems
  AAPL: { name: "Apple", domain: "apple.com" },
  GOOGL: { name: "Google", domain: "google.com" },
  MSFT: { name: "Microsoft", domain: "microsoft.com" },
  AMZN: { name: "Amazon", domain: "amazon.com" },
  META: { name: "Meta", domain: "meta.com" },
  TCEHY: { name: "Tencent", domain: "tencent.com" },
  BABA: { name: "Alibaba", domain: "alibaba.com" },
  // Membership / retail
  COST: { name: "Costco", domain: "costco.com" },
  WMT: { name: "Walmart", domain: "walmart.com" },
  TGT: { name: "Target", domain: "target.com" },
  SBUX: { name: "Starbucks", domain: "starbucks.com" },
  // Local commerce / logistics
  UBER: { name: "Uber", domain: "uber.com" },
  LYFT: { name: "Lyft", domain: "lyft.com" },
  DASH: { name: "DoorDash", domain: "doordash.com" },
  CART: { name: "Instacart", domain: "instacart.com" },
  MEITUAN: { name: "Meituan", domain: "meituan.com" },
  GRAB: { name: "Grab", domain: "grab.com" },
  // Geo priors (fallbacks)
  MCD: { name: "McDonald's", domain: "mcdonalds.com" },
  HD: { name: "Home Depot", domain: "homedepot.com" },
  BKNG: { name: "Booking", domain: "booking.com" },
  DAL: { name: "Delta", domain: "delta.com" },
  AAPL_EXTRA: { name: "Apple (Services)", domain: "apple.com" },
};

type Ticker = keyof typeof companies;

type Choice = {
  id: string;
  label: string;
  ticker: Ticker;
  complements?: Ticker[]; // close substitutes to softly credit
};

const ecosystems: Choice[] = [
  { id: "apple", label: "Apple", ticker: "AAPL", complements: ["GOOGL", "MSFT", "AMZN"] },
  { id: "google", label: "Google", ticker: "GOOGL", complements: ["AAPL", "MSFT", "AMZN"] },
  { id: "microsoft", label: "Microsoft", ticker: "MSFT", complements: ["AAPL", "GOOGL", "AMZN"] },
  { id: "amazon", label: "Amazon", ticker: "AMZN", complements: ["AAPL", "GOOGL", "MSFT"] },
  { id: "meta", label: "Meta", ticker: "META", complements: ["AAPL", "GOOGL"] },
  { id: "tencent", label: "Tencent", ticker: "TCEHY", complements: ["BABA"] },
  { id: "alibaba", label: "Alibaba", ticker: "BABA", complements: ["TCEHY"] },
];

const memberships: Choice[] = [
  { id: "costco", label: "Costco", ticker: "COST", complements: ["WMT", "TGT"] },
  { id: "walmart", label: "Walmart/Sam's", ticker: "WMT", complements: ["TGT"] },
  { id: "target", label: "Target", ticker: "TGT", complements: ["WMT"] },
  { id: "prime", label: "Amazon Prime", ticker: "AMZN", complements: ["AAPL"] },
  { id: "starbucks", label: "Starbucks Rewards", ticker: "SBUX" },
  { id: "none-membership", label: "None", ticker: "AAPL_EXTRA" },
];

const localCommerce: Choice[] = [
  { id: "uber", label: "Uber", ticker: "UBER", complements: ["LYFT"] },
  { id: "lyft", label: "Lyft", ticker: "LYFT", complements: ["UBER"] },
  { id: "doordash", label: "DoorDash", ticker: "DASH" },
  { id: "instacart", label: "Instacart", ticker: "CART" },
  { id: "meituan", label: "Meituan", ticker: "MEITUAN" },
  { id: "grab", label: "Grab", ticker: "GRAB" },
  { id: "none-local", label: "None", ticker: "MCD" },
];

// Clearbit logo helper (fallback to initials badge)
const Logo: React.FC<{ ticker: Ticker }>= ({ ticker }) => {
  const { name, domain } = companies[ticker];
  const src = `https://logo.clearbit.com/${domain}`;
  return (
    <div className="flex items-center gap-3 p-2 rounded-xl border border-gray-200 hover:shadow-sm transition">
      <img onError={(e)=>{(e.currentTarget as HTMLImageElement).style.display='none';}} alt={name} src={src} className="h-8 w-8 rounded"/>
      <div className="text-sm font-medium">{name}<span className="ml-2 text-xs text-gray-500">{ticker}</span></div>
    </div>
  );
};

const Chip: React.FC<{
  selected?: boolean;
  onClick?: ()=>void;
  children: React.ReactNode;
}> = ({ selected, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full border text-sm transition ${selected ? 'bg-black text-white border-black' : 'bg-white text-gray-800 border-gray-300 hover:border-gray-500'}`}
  >{children}</button>
);

// Scoring
function scoreFromChoice(choice: Choice | null, weight: number) {
  const map = new Map<Ticker, number>();
  if (!choice) return map;
  map.set(choice.ticker, (map.get(choice.ticker) || 0) + 1.0 * weight);
  (choice.complements || []).forEach(c => {
    map.set(c, (map.get(c) || 0) + 0.4 * weight);
  });
  return map;
}

function mergeScores(...maps: Map<Ticker, number>[]) {
  const out = new Map<Ticker, number>();
  maps.forEach(m => m.forEach((v,k)=> out.set(k, (out.get(k)||0) + v)));
  return out;
}

function topN<T extends string>(map: Map<T, number>, n: number): T[] {
  return Array.from(map.entries())
    .sort((a,b)=> b[1]-a[1])
    .slice(0,n)
    .map(([k])=>k);
}

export default function ClaraCompassLanding() {
  const [eco, setEco] = useState<string | null>(null);
  const [mem, setMem] = useState<string | null>(null);
  const [loc, setLoc] = useState<string | null>(null);

  const ecoChoice = ecosystems.find(e=> e.id===eco) || null;
  const memChoice = memberships.find(e=> e.id===mem) || null;
  const locChoice = localCommerce.find(e=> e.id===loc) || null;

  const scores = useMemo(()=>{
    const m1 = scoreFromChoice(ecoChoice, 0.6);
    const m2 = scoreFromChoice(memChoice, 0.3);
    const m3 = scoreFromChoice(locChoice, 0.2);
    // tiny geo prior stub (can be swapped for real IP-based priors later)
    const geo = new Map<Ticker, number>();
    geo.set('MCD', 0.05); geo.set('HD', 0.05); geo.set('BKNG', 0.05);
    return mergeScores(m1,m2,m3,geo);
  },[ecoChoice,memChoice,locChoice]);

  const picks = topN(scores, 6);
  const canShow = eco || mem || loc;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
      <header className="px-6 md:px-10 py-6 flex items-center justify-between">
        <div className="text-xl font-semibold tracking-tight">Clara Compass</div>
        <div className="text-sm text-gray-500">A compass, not a map.</div>
      </header>

      <main className="px-6 md:px-10">
        <section className="max-w-5xl mx-auto text-center py-6 md:py-12">
          <h1 className="text-3xl md:text-5xl font-semibold leading-tight">Invest where your life overlaps reality.</h1>
          <p className="mt-3 md:mt-4 text-gray-600 max-w-3xl mx-auto">Answer three quick questions. We’ll surface the public companies you most likely know through daily use or work—and help you understand their fundamentals with AI.</p>
        </section>

        {/* Q1 */}
        <section className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl border bg-white/70 backdrop-blur">
            <h3 className="font-medium mb-3">1) Your main tech ecosystem</h3>
            <div className="flex flex-wrap gap-2">
              {ecosystems.map(c=> (
                <Chip key={c.id} selected={eco===c.id} onClick={()=> setEco(c.id)}>{c.label}</Chip>
              ))}
            </div>
          </div>

          {/* Q2 */}
          <div className="p-5 rounded-2xl border bg-white/70 backdrop-blur">
            <h3 className="font-medium mb-3">2) Membership you actually use</h3>
            <div className="flex flex-wrap gap-2">
              {memberships.map(c=> (
                <Chip key={c.id} selected={mem===c.id} onClick={()=> setMem(c.id)}>{c.label}</Chip>
              ))}
            </div>
          </div>

          {/* Q3 */}
          <div className="p-5 rounded-2xl border bg-white/70 backdrop-blur">
            <h3 className="font-medium mb-3">3) Default local commerce</h3>
            <div className="flex flex-wrap gap-2">
              {localCommerce.map(c=> (
                <Chip key={c.id} selected={loc===c.id} onClick={()=> setLoc(c.id)}>{c.label}</Chip>
              ))}
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="max-w-5xl mx-auto mt-8 md:mt-10">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-medium">Your 6 familiar public companies</h4>
            <div className="text-xs text-gray-500">No email required • Private by default</div>
          </div>
          <div className={`grid sm:grid-cols-2 md:grid-cols-3 gap-3 ${canShow? '' : 'opacity-40'}`}>
            {picks.map((t)=> (
              <Logo key={t} ticker={t} />
            ))}
          </div>
          {!canShow && (
            <p className="text-sm text-gray-500 mt-3">Make a selection above to personalize your list.</p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              disabled={!canShow}
              className={`px-4 py-2 rounded-xl text-white font-medium ${canShow? 'bg-black hover:bg-gray-900' : 'bg-gray-400 cursor-not-allowed'}`}
              onClick={()=> alert('Continue to your Familiar Portfolio (stub).')}
            >Continue</button>
            <button
              className="px-4 py-2 rounded-xl border border-gray-300 text-gray-800 hover:border-gray-600"
              onClick={()=> alert('Optional: Connect Gmail metadata to boost accuracy (stub).')}
            >Boost accuracy (optional)</button>
          </div>

          <p className="text-xs text-gray-500 mt-3">Scoring = 0.6×ecosystem + 0.3×membership + 0.2×local commerce + tiny geo prior. Replace with learned weights later.</p>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto px-6 md:px-10 py-8 text-xs text-gray-500">
        © {new Date().getFullYear()} Clara Compass • Built for long-term, fundamentals-first investors.
      </footer>
    </div>
  );
}
