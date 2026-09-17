import type { Account, CreateInvoiceInput, InvoiceDetail } from "@stardex/sdk";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useApiKey } from "../lib/apiKey";
import { errorText } from "../lib/money";
import { buttonGhost, buttonPrimary, inputClass } from "../lib/styles";
import { ErrorNotice } from "./app";

const AMOUNT_PATTERN = /^\d+(\.\d{1,7})?$/;

export function InvoiceForm({
  onCreated,
  onCancel,
}: {
  onCreated: (invoice: InvoiceDetail) => void;
  onCancel: () => void;
}) {
  const { stardex } = useApiKey();
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [form, setForm] = useState({
    account: "",
    amount: "",
    asset: "native",
    customAsset: "",
    customerName: "",
    customerEmail: "",
    description: "",
    dueDate: "",
    number: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    stardex
      .accounts()
      .then((list) => {
        if (!active) return;
        const watched = list.filter((a) => a.active);
        setAccounts(watched);
        if (watched.length === 1) setForm((f) => ({ ...f, account: watched[0].address }));
      })
      .catch((err) => active && setError(errorText(err)));
    return () => {
      active = false;
    };
  }, [stardex]);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const amountValid = AMOUNT_PATTERN.test(form.amount.trim()) && Number(form.amount) > 0;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!amountValid) {
      setError("Enter an amount greater than zero with at most 7 decimal places.");
      return;
    }
    setSaving(true);
    setError(null);

    const input: CreateInvoiceInput = {
      account: form.account,
      amount: form.amount.trim(),
      asset: form.asset === "other" ? form.customAsset.trim() : "native",
    };
    if (form.customerName.trim()) input.customerName = form.customerName.trim();
    if (form.customerEmail.trim()) input.customerEmail = form.customerEmail.trim();
    if (form.description.trim()) input.description = form.description.trim();
    if (form.dueDate) input.dueDate = form.dueDate;
    if (form.number.trim()) input.number = form.number.trim();

    try {
      onCreated(await stardex.createInvoice(input));
    } catch (err) {
      setError(errorText(err));
      setSaving(false);
    }
  };

  if (accounts !== null && accounts.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-6 text-sm text-slate-300">
        No account is watched yet, so there is nowhere to be paid. Run{" "}
        <code className="font-mono text-slate-100">stardex accounts add &lt;address&gt;</code> on
        the engine, then come back.
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-6"
    >
      <h2 className="font-semibold">New invoice</h2>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Paid into" htmlFor="inv-account" className="sm:col-span-2">
          <select
            id="inv-account"
            required
            className={`${inputClass} font-mono`}
            value={form.account}
            onChange={(e) => set("account")(e.target.value)}
            disabled={accounts === null}
          >
            <option value="" disabled>
              {accounts === null ? "Loading accounts..." : "Choose an account"}
            </option>
            {accounts?.map((a) => (
              <option key={a.address} value={a.address}>
                {a.label ? `${a.label}  ${a.address}` : a.address}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Amount" htmlFor="inv-amount">
          <input
            id="inv-amount"
            required
            inputMode="decimal"
            className={`${inputClass} tabular-nums`}
            value={form.amount}
            onChange={(e) => set("amount")(e.target.value)}
            placeholder="250.00"
            aria-invalid={form.amount !== "" && !amountValid}
          />
        </Field>

        <Field label="Asset" htmlFor="inv-asset">
          <select
            id="inv-asset"
            className={inputClass}
            value={form.asset}
            onChange={(e) => set("asset")(e.target.value)}
          >
            <option value="native">XLM</option>
            <option value="other">Another asset (CODE:ISSUER)</option>
          </select>
        </Field>

        {form.asset === "other" && (
          <Field label="Asset code and issuer" htmlFor="inv-custom-asset" className="sm:col-span-2">
            <input
              id="inv-custom-asset"
              required
              spellCheck={false}
              className={`${inputClass} font-mono`}
              value={form.customAsset}
              onChange={(e) => set("customAsset")(e.target.value)}
              placeholder="USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
            />
          </Field>
        )}

        <Field label="Customer" htmlFor="inv-customer">
          <input
            id="inv-customer"
            className={inputClass}
            value={form.customerName}
            onChange={(e) => set("customerName")(e.target.value)}
            placeholder="Acme Ltd"
          />
        </Field>

        <Field label="Customer email" htmlFor="inv-email">
          <input
            id="inv-email"
            type="email"
            className={inputClass}
            value={form.customerEmail}
            onChange={(e) => set("customerEmail")(e.target.value)}
          />
        </Field>

        <Field label="Description" htmlFor="inv-description" className="sm:col-span-2">
          <input
            id="inv-description"
            className={inputClass}
            value={form.description}
            onChange={(e) => set("description")(e.target.value)}
            placeholder="Logo design, September"
          />
        </Field>

        <Field label="Due date" htmlFor="inv-due">
          <input
            id="inv-due"
            type="date"
            className={inputClass}
            value={form.dueDate}
            onChange={(e) => set("dueDate")(e.target.value)}
          />
        </Field>

        <Field label="Invoice number" hint="Leave empty to number it automatically" htmlFor="inv-number">
          <input
            id="inv-number"
            className={inputClass}
            value={form.number}
            onChange={(e) => set("number")(e.target.value)}
          />
        </Field>
      </div>

      {error && (
        <div className="mt-5">
          <ErrorNotice>{error}</ErrorNotice>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <button type="submit" className={buttonPrimary} disabled={saving || accounts === null}>
          {saving ? "Creating..." : "Create invoice"}
        </button>
        <button type="button" className={buttonGhost} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  htmlFor,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  htmlFor: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm text-slate-300">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
