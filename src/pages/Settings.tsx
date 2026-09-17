import { useState, type FormEvent } from "react";
import type { Account } from "@stardex/sdk";
import { ErrorNotice, PageHeader } from "../components/app";
import { API_BASE_URL } from "../config";
import { useApiKey } from "../lib/apiKey";
import { errorText } from "../lib/money";
import { buttonGhost, buttonPrimary, inputClass } from "../lib/styles";

type Check =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "ok"; accounts: Account[] }
  | { state: "failed"; message: string };

export function Settings() {
  const { apiKey, setApiKey, stardex } = useApiKey();
  const [draft, setDraft] = useState(apiKey);
  const [reveal, setReveal] = useState(false);
  const [check, setCheck] = useState<Check>({ state: "idle" });

  const save = (e: FormEvent) => {
    e.preventDefault();
    setApiKey(draft);
    setCheck({ state: "idle" });
  };

  const remove = () => {
    setApiKey("");
    setDraft("");
    setCheck({ state: "idle" });
  };

  const testConnection = async () => {
    setCheck({ state: "checking" });
    try {
      setCheck({ state: "ok", accounts: await stardex.accounts() });
    } catch (err) {
      setCheck({ state: "failed", message: errorText(err) });
    }
  };

  const unsaved = draft.trim() !== apiKey;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <PageHeader
        title="Settings"
        description="Connect this browser to your Stardex backend. The key stays in this browser only."
      />

      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-6">
        <h2 className="font-semibold">Backend</h2>
        <p className="mt-1 text-sm text-slate-400">
          Reading from <span className="font-mono text-slate-200">{API_BASE_URL}</span>
        </p>

        <form onSubmit={save} className="mt-6">
          <label htmlFor="api-key" className="text-sm text-slate-300">
            API key
          </label>
          <p className="mt-0.5 text-xs text-slate-500">
            The value of <span className="font-mono">STARDEX_ADMIN_KEY</span> on the backend.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              id="api-key"
              type={reveal ? "text" : "password"}
              autoComplete="off"
              spellCheck={false}
              className={`${inputClass} min-w-0 flex-1 font-mono`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Paste your key"
            />
            <button type="button" className={buttonGhost} onClick={() => setReveal((v) => !v)}>
              {reveal ? "Hide" : "Show"}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="submit" className={buttonPrimary} disabled={!unsaved}>
              Save key
            </button>
            <button
              type="button"
              className={buttonGhost}
              onClick={testConnection}
              disabled={!apiKey || unsaved || check.state === "checking"}
            >
              {check.state === "checking" ? "Testing..." : "Test connection"}
            </button>
            {apiKey && (
              <button type="button" className={buttonGhost} onClick={remove}>
                Remove key
              </button>
            )}
          </div>
          {unsaved && apiKey && (
            <p className="mt-2 text-xs text-slate-500">Save the new key before testing it.</p>
          )}
        </form>

        <div className="mt-6" aria-live="polite">
          {check.state === "failed" && <ErrorNotice>{check.message}</ErrorNotice>}
          {check.state === "ok" && (
            <div className="rounded-lg border border-[#4fd1a5]/40 bg-[#4fd1a5]/10 px-4 py-3 text-sm text-[#b9f0dc]">
              Connected.{" "}
              {check.accounts.length === 0
                ? "No accounts are watched yet. Add one with `stardex accounts add` on the engine."
                : `Watching ${check.accounts.length} account${check.accounts.length === 1 ? "" : "s"}.`}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
