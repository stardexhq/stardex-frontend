import type { ExportKind, Invoice, Payment, PaymentMatchStatus, UnmatchedReason } from "@stardex/sdk";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { ErrorNotice, LoadMore, PageHeader, RequireApiKey } from "../components/app";
import { useCursorList } from "../hooks/useCursorList";
import { useApiKey } from "../lib/apiKey";
import { formatDateTime, timeAgo, truncateMiddle } from "../lib/format";
import { assetCode, displayAmount, errorText } from "../lib/money";
import { buttonGhost, buttonPrimary, inputClass } from "../lib/styles";

const TABS: Array<{ value: PaymentMatchStatus | "all"; label: string }> = [
  { value: "unmatched", label: "Needs review" },
  { value: "matched", label: "Matched" },
  { value: "ignored", label: "Ignored" },
  { value: "all", label: "All" },
];

const REASON: Record<UnmatchedReason, string> = {
  no_reference: "No memo or muxed ID was sent, so it could not be linked to an invoice.",
  no_invoice: "The memo or ID does not match any invoice on this account.",
  asset_mismatch: "It was paid in a different asset than the invoice asks for.",
  invoice_cancelled: "It was sent to an invoice that is cancelled.",
};

export function Payments() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <PageHeader
        title="Payments"
        description="Everything that arrived in your watched accounts. Payments that could not be matched automatically wait here for you."
        action={<Downloads />}
      />
      <RequireApiKey>
        <PaymentList />
      </RequireApiKey>
    </div>
  );
}

function Downloads() {
  const { apiKey, stardex } = useApiKey();
  const [busy, setBusy] = useState<ExportKind | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!apiKey) return null;

  const download = async (kind: ExportKind) => {
    setBusy(kind);
    setError(null);
    try {
      const csv = await stardex.exportCsv(kind);
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `stardex-${kind}-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={buttonGhost} onClick={() => download("payments")} disabled={busy !== null}>
          {busy === "payments" ? "Preparing..." : "Download payments CSV"}
        </button>
        <button type="button" className={buttonGhost} onClick={() => download("invoices")} disabled={busy !== null}>
          {busy === "invoices" ? "Preparing..." : "Download invoices CSV"}
        </button>
      </div>
      {error && <p className="text-xs text-rose-300">{error}</p>}
    </div>
  );
}

function PaymentList() {
  const { stardex } = useApiKey();
  const [tab, setTab] = useState<PaymentMatchStatus | "all">("unmatched");

  const load = useCallback(
    (cursor: string | undefined) =>
      stardex.payments({ status: tab === "all" ? undefined : tab, cursor, limit: 50 }),
    [stardex, tab],
  );
  const { items, loading, error, hasMore, loadMore, reload } = useCursorList(load);

  return (
    <section>
      <div role="tablist" aria-label="Payment status" className="mb-4 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              tab === t.value
                ? "border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-white"
                : "border-[var(--color-border)] text-slate-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <ErrorNotice>{error}</ErrorNotice>}

      {!error && loading && items.length === 0 && (
        <p className="py-12 text-center text-sm text-slate-400">Loading payments...</p>
      )}

      {!error && !loading && items.length === 0 && (
        <p className="py-12 text-center text-sm text-slate-400">
          {tab === "unmatched"
            ? "Nothing needs review. Every payment has been matched or set aside."
            : "No payments here yet."}
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {items.map((payment) => (
          <PaymentItem key={payment.id} payment={payment} onChanged={reload} />
        ))}
      </ul>

      <LoadMore hasMore={hasMore} loading={loading} onClick={loadMore} />
    </section>
  );
}

function PaymentItem({ payment, onChanged }: { payment: Payment; onChanged: () => void }) {
  const { stardex } = useApiKey();
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ignore = async () => {
    setBusy(true);
    setError(null);
    try {
      await stardex.ignorePayment(payment.id);
      onChanged();
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  };

  const unmatched = payment.matchStatus === "unmatched";

  return (
    <li className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="tabular-nums">
            <span className="text-lg font-semibold text-slate-100">{displayAmount(payment.amount)}</span>{" "}
            <span className="text-slate-400">{assetCode(payment.asset)}</span>
          </p>
          <p className="mt-1 text-sm text-slate-400">
            From <span className="font-mono text-slate-300" title={payment.fromAddress}>{truncateMiddle(payment.fromAddress)}</span>
            <span title={formatDateTime(payment.closedAt)}>, {timeAgo(payment.closedAt)}</span>
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {payment.reference ? (
              <>
                Memo <span className="font-mono text-slate-300">{payment.reference}</span>
              </>
            ) : (
              "No memo"
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {payment.matchStatus === "matched" && payment.invoiceId && (
            <Link to={`/invoices/${payment.invoiceId}`} className="text-sm text-[#4fd1a5] hover:underline">
              View invoice
            </Link>
          )}
          {payment.matchStatus === "ignored" && <span className="text-sm text-slate-500">Ignored</span>}
          {unmatched && !picking && (
            <>
              <button type="button" className={buttonPrimary} onClick={() => setPicking(true)} disabled={busy}>
                Match to invoice
              </button>
              <button type="button" className={buttonGhost} onClick={ignore} disabled={busy}>
                Ignore
              </button>
            </>
          )}
        </div>
      </div>

      {unmatched && payment.unmatchedReason && (
        <p className="mt-3 border-l-2 border-[#f47a8b] pl-3 text-sm text-slate-300">
          {REASON[payment.unmatchedReason]}
        </p>
      )}

      {picking && (
        <MatchPicker
          payment={payment}
          onDone={onChanged}
          onCancel={() => setPicking(false)}
        />
      )}

      {error && (
        <div className="mt-3">
          <ErrorNotice>{error}</ErrorNotice>
        </div>
      )}
    </li>
  );
}

/** Choose an open or partly paid invoice on the same account, in the same asset. */
function MatchPicker({
  payment,
  onDone,
  onCancel,
}: {
  payment: Payment;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { stardex } = useApiKey();
  const load = useCallback(
    async (cursor: string | undefined) => {
      const page = await stardex.invoices({ account: payment.account, cursor, limit: 200 });
      return {
        ...page,
        items: page.items.filter(
          (i: Invoice) => i.asset === payment.asset && (i.status === "open" || i.status === "partial"),
        ),
      };
    },
    [stardex, payment.account, payment.asset],
  );
  const { items, loading, error, hasMore, loadMore } = useCursorList(load);
  const [choice, setChoice] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const match = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await stardex.matchPayment(payment.id, choice);
      onDone();
    } catch (err) {
      setSaveError(errorText(err));
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 rounded-md border border-[var(--color-border)] bg-[var(--color-base)]/60 p-4">
      <label htmlFor={`match-${payment.id}`} className="text-sm text-slate-300">
        Which invoice is this payment for?
      </label>
      {error ? (
        <div className="mt-2">
          <ErrorNotice>{error}</ErrorNotice>
        </div>
      ) : !loading && items.length === 0 && !hasMore ? (
        <p className="mt-2 text-sm text-slate-400">
          No open invoices in {assetCode(payment.asset)} on this account.
        </p>
      ) : (
        <select
          id={`match-${payment.id}`}
          className={`${inputClass} mt-2`}
          value={choice}
          onChange={(e) => setChoice(e.target.value)}
        >
          <option value="" disabled>
            {loading ? "Loading invoices..." : "Choose an invoice"}
          </option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.number}
              {i.customerName ? `, ${i.customerName}` : ""}: {displayAmount(i.amountReceived)} of{" "}
              {displayAmount(i.amount)} {assetCode(i.asset)} received
            </option>
          ))}
        </select>
      )}
      {hasMore && (
        <button type="button" className="mt-2 text-xs text-[var(--color-accent)] hover:underline" onClick={loadMore}>
          Look further back
        </button>
      )}
      {saveError && (
        <div className="mt-3">
          <ErrorNotice>{saveError}</ErrorNotice>
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={buttonPrimary} onClick={match} disabled={!choice || saving}>
          {saving ? "Matching..." : "Match payment"}
        </button>
        <button type="button" className={buttonGhost} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
