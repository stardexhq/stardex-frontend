import type { Invoice, InvoiceStatus } from "@stardex/sdk";
import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ErrorNotice,
  LoadMore,
  PageHeader,
  ReceivedBar,
  RequireApiKey,
  StatusBadge,
} from "../components/app";
import { InvoiceForm } from "../components/InvoiceForm";
import { useCursorList } from "../hooks/useCursorList";
import { useApiKey } from "../lib/apiKey";
import { assetCode, displayAmount, receivedRatio } from "../lib/money";
import { buttonPrimary } from "../lib/styles";

const FILTERS: Array<{ value: InvoiceStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "partial", label: "Partly paid" },
  { value: "paid", label: "Paid" },
  { value: "overpaid", label: "Overpaid" },
  { value: "cancelled", label: "Cancelled" },
];

export function Invoices() {
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const { apiKey } = useApiKey();

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <PageHeader
        title="Invoices"
        description="What customers owe you, and how much of it has arrived on Stellar."
        action={
          apiKey &&
          !creating && (
            <button type="button" className={buttonPrimary} onClick={() => setCreating(true)}>
              New invoice
            </button>
          )
        }
      />
      <RequireApiKey>
        {creating && (
          <div className="mb-8">
            <InvoiceForm
              onCreated={(invoice) => navigate(`/invoices/${invoice.id}`)}
              onCancel={() => setCreating(false)}
            />
          </div>
        )}
        <InvoiceList />
      </RequireApiKey>
    </div>
  );
}

function InvoiceList() {
  const { stardex } = useApiKey();
  const [status, setStatus] = useState<InvoiceStatus | "all">("all");

  const load = useCallback(
    (cursor: string | undefined) =>
      stardex.invoices({ status: status === "all" ? undefined : status, cursor, limit: 50 }),
    [stardex, status],
  );
  const { items, loading, error, hasMore, loadMore } = useCursorList(load);

  return (
    <section>
      <div role="group" aria-label="Filter by status" className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={status === f.value}
            onClick={() => setStatus(f.value)}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              status === f.value
                ? "border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-white"
                : "border-[var(--color-border)] text-slate-400 hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <ErrorNotice>{error}</ErrorNotice>}

      {!error && loading && items.length === 0 && (
        <p className="py-12 text-center text-sm text-slate-400">Loading invoices...</p>
      )}

      {!error && !loading && items.length === 0 && (
        <p className="py-12 text-center text-sm text-slate-400">
          {status === "all"
            ? "No invoices yet. Create one and share its payment details with your customer."
            : "No invoices with this status."}
        </p>
      )}

      {items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
          <table className="w-full min-w-[42rem] border-collapse text-sm">
            <thead>
              <tr className="bg-[var(--color-surface)] text-left text-xs text-slate-400">
                <th className="px-4 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Received</th>
                <th className="px-4 py-3 font-medium">Due</th>
              </tr>
            </thead>
            <tbody>
              {items.map((invoice) => (
                <InvoiceRow key={invoice.id} invoice={invoice} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <LoadMore hasMore={hasMore} loading={loading} onClick={loadMore} />
    </section>
  );
}

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const code = assetCode(invoice.asset);
  return (
    <tr className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface)]/50">
      <td className="px-4 py-3">
        <Link
          to={`/invoices/${invoice.id}`}
          className="font-medium text-slate-100 hover:text-[var(--color-accent)]"
        >
          {invoice.number}
        </Link>
        <p className="text-xs text-slate-500">{invoice.customerName ?? "No customer name"}</p>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={invoice.status} />
      </td>
      <td className="px-4 py-3">
        <div className="ml-auto w-48">
          <p className="text-right tabular-nums">
            <span className="text-slate-100">{displayAmount(invoice.amountReceived)}</span>
            <span className="text-slate-500">
              {" "}
              of {displayAmount(invoice.amount)} {code}
            </span>
          </p>
          {invoice.status !== "cancelled" && (
            <div className="mt-1.5">
              <ReceivedBar
                ratio={receivedRatio(invoice.amountReceived, invoice.amount)}
                status={invoice.status}
              />
            </div>
          )}
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-slate-400">
        {invoice.dueDate ? new Date(`${invoice.dueDate}T00:00:00`).toLocaleDateString() : "None"}
      </td>
    </tr>
  );
}
