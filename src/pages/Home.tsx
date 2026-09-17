import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "../components/app";
import { GITHUB_URL } from "../site";
import { buttonGhost, buttonPrimary } from "../lib/styles";

export function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <NeedsAPerson />
      <Repos />
    </>
  );
}

function Hero() {
  return (
    <section className="border-b border-[var(--color-border)]">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 sm:py-24 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <h1 className="text-4xl leading-[1.1] font-bold tracking-tight sm:text-5xl">
            Know which invoice every Stellar payment paid.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Stardex gives each invoice its own payment reference, watches your Stellar address,
            and matches every payment that arrives to the invoice it pays. The ones it cannot
            match wait for you, with the reason.
          </p>
          <p className="mt-4 max-w-xl text-sm text-slate-400">
            Open source and self hosted. It only reads the network, so it never holds your keys
            or your money.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/invoices" className={buttonPrimary}>
              Open invoices
            </Link>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className={buttonGhost}>
              Read the code
            </a>
          </div>
        </div>
        <SettlementDemo />
      </div>
    </section>
  );
}

type Phase = "waiting" | "arriving" | "settled";

/**
 * The one animated moment on the page: a payment arrives with its memo and the
 * invoice it names turns paid. Plays once; with reduced motion it starts settled.
 */
function SettlementDemo() {
  const [phase, setPhase] = useState<Phase>(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "settled"
      : "waiting",
  );

  useEffect(() => {
    if (phase !== "waiting") return;
    const arrive = setTimeout(() => setPhase("arriving"), 700);
    const settle = setTimeout(() => setPhase("settled"), 1900);
    return () => {
      clearTimeout(arrive);
      clearTimeout(settle);
    };
    // Runs once on mount; later phases are driven by these timers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const arrived = phase !== "waiting";
  const settled = phase === "settled";

  return (
    <div className="relative" aria-label="Example: a payment arrives and its invoice is marked paid">
      <div
        className={`rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] p-4 transition-all duration-700 ease-out motion-reduce:transition-none ${
          arrived ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
        }`}
      >
        <p className="text-xs text-slate-500">Payment arrived on Stellar</p>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
          <p className="tabular-nums">
            <span className="text-xl font-semibold">1,250.00</span>{" "}
            <span className="text-slate-400">USDC</span>
          </p>
          <p className="text-sm text-slate-400">
            memo <span className="font-mono text-slate-200">100001</span>
          </p>
        </div>
        <p className="mt-1 font-mono text-xs text-slate-500">from GBRX…Q4KD</p>
      </div>

      <div
        aria-hidden
        className={`mx-auto h-8 w-px transition-colors duration-500 motion-reduce:transition-none ${
          settled ? "bg-[#4fd1a5]" : "bg-[var(--color-border)]"
        }`}
      />

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold">INV-100001</p>
            <p className="text-sm text-slate-400">Acme Ltd, brand identity</p>
          </div>
          <StatusBadge status={settled ? "paid" : "open"} />
        </div>
        <p className="mt-5 text-sm text-slate-400">Received</p>
        <p className="tabular-nums">
          <span className="text-3xl font-bold tracking-tight">{settled ? "1,250.00" : "0.00"}</span>
          <span className="text-slate-400"> of 1,250.00 USDC</span>
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
          <div
            className={`h-full bg-[#4fd1a5] transition-[width] duration-700 ease-out motion-reduce:transition-none ${
              settled ? "w-full" : "w-0"
            }`}
          />
        </div>
        <p className="mt-4 text-xs text-slate-500">
          {settled ? "Matched automatically by reference, just now" : "Waiting for payment"}
        </p>
      </div>
    </div>
  );
}

const STEPS = [
  {
    title: "Create an invoice",
    body: "It gets a reference number, like 100001, and a payment address built from your account and that number.",
  },
  {
    title: "Your customer pays",
    body: "Either to that address with no memo, or to your usual address with the reference as the memo. Any Stellar wallet works.",
  },
  {
    title: "Stardex records it",
    body: "It follows every payment into your address, in any asset, straight from the Stellar network.",
  },
  {
    title: "The invoice updates",
    body: "Paid, partly paid or overpaid, with the time it arrived. Export payments and invoices as CSV for your books.",
  },
];

function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">How it works</h2>
      <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <li key={step.title} className="border-t border-[var(--color-border)] pt-5">
            <span className="text-sm text-[var(--color-accent)] tabular-nums">{i + 1}</span>
            <h3 className="mt-2 font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

const REASONS = [
  ["No reference", "The customer sent no memo and did not use the invoice address."],
  ["Unknown reference", "The memo does not match any invoice on that account."],
  ["Wrong asset", "The invoice asked for USDC and XLM arrived, for example."],
  ["Cancelled invoice", "The payment named an invoice you had already cancelled."],
];

function NeedsAPerson() {
  return (
    <section className="border-y border-[var(--color-border)] bg-[var(--color-surface)]/30">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            When a payment cannot be matched, you see why
          </h2>
          <p className="mt-4 max-w-lg text-slate-400">
            Customers forget memos. Stardex does not guess. It puts the payment in a review list
            with the reason, and you match it to the right invoice or set it aside in one step.
          </p>
          <dl className="mt-8 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
            {REASONS.map(([term, detail]) => (
              <div key={term} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
                <dt className="text-sm font-medium text-slate-200">{term}</dt>
                <dd className="text-sm text-slate-400">{detail}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">What it does not do</h2>
          <p className="mt-4 max-w-lg text-slate-400">
            Stardex is a bookkeeping tool, kept narrow on purpose.
          </p>
          <ul className="mt-8 space-y-4 text-sm text-slate-300">
            <li>It never holds keys, signs transactions or moves funds. It only reads the network.</li>
            <li>It does not convert currency. Cashing out stays with your anchor or exchange.</li>
            <li>It does not calculate tax. It gives your accountant clean records to work from.</li>
          </ul>
          <p className="mt-8 text-sm text-slate-400">
            It suits anyone who takes many payments into one Stellar address: marketplaces,
            payment apps, SaaS products, NGOs and freelancers.
          </p>
        </div>
      </div>
    </section>
  );
}

const REPOS = [
  { name: "stardex", role: "Engine that records payments and matches them to invoices", stack: "Rust, Postgres" },
  { name: "stardex-backend", role: "HTTP API for invoices, payments and exports", stack: "TypeScript, Node" },
  { name: "stardex-sdk", role: "Typed client, published on npm as @stardex/sdk", stack: "TypeScript" },
  { name: "stardex-frontend", role: "This web app", stack: "React, Vite" },
];

function Repos() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Open source, in four parts</h2>
      <p className="mt-4 max-w-2xl text-slate-400">
        Run it yourself with plain Rust, Postgres and TypeScript. Contributions are welcome in
        every repo.
      </p>
      <ul className="mt-8 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
        {REPOS.map((repo) => (
          <li
            key={repo.name}
            className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr_auto] sm:items-baseline sm:gap-6"
          >
            <a
              href={`${GITHUB_URL}/${repo.name}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-sm text-[var(--color-accent)] hover:underline"
            >
              {repo.name}
            </a>
            <span className="text-sm text-slate-300">{repo.role}</span>
            <span className="text-sm text-slate-500 sm:text-right">{repo.stack}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
