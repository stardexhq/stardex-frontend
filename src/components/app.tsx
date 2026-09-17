/** Building blocks shared by the invoice, payment and settings pages. */
import type { InvoiceStatus } from "@stardex/sdk";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useApiKey } from "../lib/apiKey";
import { buttonGhost, buttonPrimary } from "../lib/styles";

const STATUS_STYLE: Record<InvoiceStatus, string> = {
  open: "border-slate-500/40 text-slate-300",
  partial: "border-[#f2b441]/40 bg-[#f2b441]/10 text-[#f2b441]",
  paid: "border-[#4fd1a5]/40 bg-[#4fd1a5]/10 text-[#4fd1a5]",
  overpaid: "border-[#6cc3f7]/40 bg-[#6cc3f7]/10 text-[#6cc3f7]",
  cancelled: "border-slate-600/40 text-slate-500 line-through",
};

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  open: "Open",
  partial: "Partly paid",
  paid: "Paid",
  overpaid: "Overpaid",
  cancelled: "Cancelled",
};

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

/** Received versus owed, as a thin bar. */
export function ReceivedBar({ ratio, status }: { ratio: number; status: InvoiceStatus }) {
  const color =
    status === "overpaid" ? "bg-[#6cc3f7]" : status === "paid" ? "bg-[#4fd1a5]" : "bg-[#f2b441]";
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(ratio * 100)}
    >
      <div className={`h-full ${color}`} style={{ width: `${ratio * 100}%` }} />
    </div>
  );
}

/** A title, one line of description and an optional action on the right. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 text-sm text-slate-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorNotice({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
    >
      {children}
    </div>
  );
}

/** A value people copy, like an address or memo, shown large with a copy button. */
export function CopyValue({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div>
      <p className="mb-1.5 text-xs text-slate-400">{label}</p>
      <div className="flex items-stretch gap-2">
        <code
          className={`min-w-0 flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-base)] px-3 py-2.5 text-sm break-all text-slate-100 ${
            mono ? "font-mono" : ""
          }`}
        >
          {value}
        </code>
        <button type="button" onClick={copy} className={`${buttonGhost} shrink-0`}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

/** Shows `children` only when an API key is saved; otherwise explains where to add one. */
export function RequireApiKey({ children }: { children: ReactNode }) {
  const { apiKey } = useApiKey();
  if (apiKey) return <>{children}</>;
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/60 px-6 py-10 text-center">
      <h2 className="text-lg font-semibold">Add your API key to see this page</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
        Invoices and payments are private. Paste the backend admin key once and this browser
        remembers it.
      </p>
      <Link to="/settings" className={`${buttonPrimary} mt-6`}>
        Open settings
      </Link>
    </div>
  );
}

export function LoadMore({
  hasMore,
  loading,
  onClick,
}: {
  hasMore: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  if (!hasMore) return null;
  return (
    <div className="mt-4 flex justify-center">
      <button type="button" onClick={onClick} disabled={loading} className={buttonGhost}>
        {loading ? "Loading..." : "Load more"}
      </button>
    </div>
  );
}
