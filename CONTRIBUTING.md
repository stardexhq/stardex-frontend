# Contributing to stardex-frontend

The general rules for all Stardex repos (claiming issues, PR size, commit style) are in the [org contributing guide](https://github.com/stardexhq/.github/blob/main/CONTRIBUTING.md). This file only covers what is specific to this repo.

## Setup

```bash
cp .env.example .env
pnpm install
pnpm dev
```

Run [stardex-backend](https://github.com/stardexhq/stardex-backend) locally, or point `VITE_STARDEX_API` at a deployed one.

## Guidelines

- All data access goes through `@stardex/sdk` (`src/lib/client.ts`). Do not call `fetch` against the backend directly.
- Data loading lives in hooks under `src/hooks/`; follow the pattern in `useEvents.ts` (stale request guard, cursor pagination).
- Reuse the shared components in `src/components/ui.tsx` before adding new ones.
- Check loading, empty and error states, and a narrow phone width, before opening a PR.
- Run `pnpm typecheck && pnpm lint && pnpm build` before pushing.
