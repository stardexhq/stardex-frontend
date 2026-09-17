import { EventExplorer } from "../components/EventExplorer";

export function Explorer() {
  return (
    <div className="mx-auto max-w-screen-2xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Event explorer</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          The raw contract events Stardex has recorded, newest first. Transfers are decoded
          into sender, receiver and amount; anything without a decoder is kept as{" "}
          <span className="font-mono text-slate-300">raw</span>. Useful for checking exactly
          what arrived.
        </p>
      </div>
      <EventExplorer />
    </div>
  );
}
