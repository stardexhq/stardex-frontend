import type { InvoiceDetail as Detail } from "@stardex/sdk";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  CopyValue,
  ErrorNotice,
  ReceivedBar,
  RequireApiKey,
  StatusBadge,
} from "../components/app";
import { useApiKey } from "../lib/apiKey";
import { formatDateTime } from "../lib/format";
import { assetCode, displayAmount, errorText, receivedRatio } from "../lib/money";
import { buttonGhost } from "../lib/styles";

export function InvoiceDetail() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Link to="/invoices" className="text-sm text-slate-400 hover:text-white">
        Back to invoices
      </Link>
      <div className="mt-6">
        <RequireApiKey>
          <InvoiceView />
        </RequireApiKey>
      </div>
    </div>
  );
}

function InvoiceView() {
  const { id = "" } = useParams();
  const { stardex } = useApiKey();
  const [invoice, setInvoice] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    try {
      setInvoice(await stardex.invoice(id));
      setError(null);
    } catch (err) {
      setError(errorText(err));
    }
  }, [stardex, id]);

  useEffect(() => {
    void load();
  }, [load]);

  const cancel = async () => {
    if (!invoice || !window.confirm(`Cancel ${invoice.number}? Payments sent to it afterwards will not be matched.`)) {
      return;
    }
    setCancelling(true);
    try {
      setInvoice(await stardex.cancelInvoice(invoice.id));
      setError(null);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setCancelling(false);
    }
  };

  if (error && !invoice) return <ErrorNotice>{error}</ErrorNotice>;
  if (!invoice) return <p className="py-12 text-center text-sm text-slate-400">Loading invoice...</p>;

  const code = assetCode(invoice.asset);
  const pay = invoice.paymentInstructions;
  const outstanding = invoice.status === "open" || invoice.status === "partial";

  return (
    <article>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{invoice.number}</h1>
            <StatusBadge status={invoice.status} />
          </div>
          <p className="mt-2 text-sm text-slate-400">
            {invoice.customerName ?? "No customer name"}
            {invoice.customerEmail && <span className="text-slate-500">, {invoice.customerEmail}</span>}
          </p>
          {invoice.description && <p className="mt-1 text-sm text-slate-300">{invoice.description}</p>}
        </div>
        {outstanding && (
          <button type="button" className={buttonGhost} onClick={cancel} disabled={cancelling}>
            {cancelling ? "Cancelling..." : "Cancel invoice"}
          </button>
        )}
      </header>

      {error && (
        <div className="mt-6">
          <ErrorNotice>{error}</ErrorNotice>
        </div>
      )}

      <section className="mt-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/60">
        <div className="p-6">
          <p className="text-sm text-slate-400">Received</p>
          <p className="mt-1 tabular-nums">
            <span className="text-4xl font-bold tracking-tight">
              {displayAmount(invoice.amountReceived)}
            </span>
            <span className="text-lg text-slate-400">
              {" "}
              of {displayAmount(invoice.amount)} {code}
            </span>
          </p>
          {invoice.status !== "cancelled" && (
            <div className="mt-4">
              <ReceivedBar
                ratio={receivedRatio(invoice.amountReceived, invoice.amount)}
                status={invoice.status}
              />
            </div>
          )}
          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <Fact label="Issued" value={formatDateTime(invoice.issuedAt)} />
            <Fact
              label="Due"
              value={invoice.dueDate ? new Date(`${invoice.dueDate}T00:00:00`).toLocaleDateString() : "None"}
            />
            <Fact label="Paid" value={invoice.paidAt ? formatDateTime(invoice.paidAt) : "Not yet"} />
            <Fact label="Reference" value={invoice.reference} mono />
          </dl>
        </div>

        {outstanding && (
          <div className="border-t border-[var(--color-border)] p-6">
            <h2 className="font-semibold">How your customer pays</h2>
            <p className="mt-1 text-sm text-slate-400">
              {invoice.status === "partial" ? "Send the remaining " : "Send "}
              {displayAmount(pay.amount)} {code} in either of these two ways. Both reach the same
              account and are matched to this invoice automatically.
            </p>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-200">Option 1: one address</p>
                <CopyValue label="Pay to this address, no memo needed" value={pay.muxedAddress} />
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-200">Option 2: address and memo</p>
                <CopyValue label="Pay to" value={pay.account} />
                <CopyValue label="With memo ID" value={pay.memo} />
              </div>
            </div>
            <p className="mt-5 text-sm text-slate-400">
              Some wallets cannot send to M addresses. If yours cannot, use option 2.{" "}
              <a href={pay.sep7Uri} className="text-[var(--color-accent)] hover:underline">
                Open in a Stellar wallet
              </a>
            </p>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-semibold">Payments applied</h2>
        {invoice.allocations.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">Nothing has arrived for this invoice yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-[var(--color-border)]">
            <table className="w-full min-w-[32rem] border-collapse text-sm">
              <thead>
                <tr className="bg-[var(--color-surface)] text-left text-xs text-slate-400">
                  <th className="px-4 py-3 font-medium">Applied</th>
                  <th className="px-4 py-3 font-medium">Matched</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.allocations.map((a) => (
                  <tr key={a.id} className="border-t border-[var(--color-border)]">
                    <td className="px-4 py-3 text-slate-300">{formatDateTime(a.createdAt)}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {a.matchedBy === "manual" ? "By hand" : "Automatically, by reference"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-100">
                      {displayAmount(a.amount)} {code}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </article>
  );
}

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={`mt-0.5 text-slate-200 ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
