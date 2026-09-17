import { Link } from "react-router-dom";
import { buttonPrimary } from "../lib/styles";

export function NotFound() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center px-6 py-32 text-center">
      <p className="font-mono text-6xl font-bold text-[var(--color-accent)]">404</p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-slate-400">
        There is no page at this address. Your invoices and payments are one click away.
      </p>
      <div className="mt-8">
        <Link to="/invoices" className={buttonPrimary}>
          Open invoices
        </Link>
      </div>
    </div>
  );
}
