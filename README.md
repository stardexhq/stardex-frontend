# stardex-frontend

The web app for [Stardex](https://github.com/stardexhq/stardex), open source payment reconciliation for businesses paid on Stellar. Built with React 19, Vite and Tailwind v4.

It runs entirely in the browser and talks to [stardex-backend](https://github.com/stardexhq/stardex-backend) through [@stardex/sdk](https://github.com/stardexhq/stardex-sdk).

Live demo: [stardex.onrender.com](https://stardex.onrender.com)

## What's here today

- **Invoices.** Create invoices for a watched Stellar account, see how much of each has arrived, and filter by status.
- **Invoice page.** How the customer pays (a muxed address, or the account plus a memo ID, and a link that opens a Stellar wallet), the amount still owed, and every payment applied.
- **Payments.** Everything that arrived, with the ones that could not be matched automatically waiting for review. Match them to an invoice by hand or ignore them, and download payments or invoices as CSV.
- **Explorer.** A filterable, paginated table of indexed contract events.
- **Settings.** Paste the backend admin key once; this browser keeps it in local storage.

Invoices, payments and exports need the backend's `STARDEX_ADMIN_KEY`. Without it those pages ask you to add the key in Settings.

## Run it locally

You need Node 25 (see `.node-version`) and a running backend.

```bash
cp .env.example .env    # points at http://localhost:8080 by default
pnpm install
pnpm dev                # http://localhost:5173
```

## Scripts

```bash
pnpm dev         # dev server
pnpm build       # typecheck + production build into dist/
pnpm preview     # serve the production build
pnpm lint        # eslint
pnpm typecheck   # tsc, no emit
```

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `VITE_STARDEX_API` | `http://localhost:8080` | Base URL of the Stardex backend |

## Deploy

It builds to static files. On Render: a Static Site from this repo, build command `pnpm install && pnpm build`, publish directory `dist`, a rewrite from `/*` to `/index.html`, and `VITE_STARDEX_API` set to your backend URL.

## Related repos

| Repo | What it is |
|---|---|
| [stardex](https://github.com/stardexhq/stardex) | Rust engine and database schema |
| [stardex-backend](https://github.com/stardexhq/stardex-backend) | HTTP API this app reads from |
| [stardex-sdk](https://github.com/stardexhq/stardex-sdk) | TypeScript client used by this app |

## License

Apache-2.0
