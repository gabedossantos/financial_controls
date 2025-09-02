# Enterprise Financial Controls Design

Production-ready Next.js app demonstrating financial controls analytics (SoD monitoring, risk trends, heatmaps) with a Postgres/Prisma backend.

## Security and public repo hygiene

- No secrets are committed. `.env` is ignored; use `.env.example` as a template.
- Removed debug-only endpoints and sanitized DB utilities for pooled SSL connections.
- Before pushing, ensure your local `.env` is not tracked (see `.gitignore`).

## Quick start

1) Create `.env` from the template

Copy `.env.example` to `.env` and set `DATABASE_URL` to your Postgres connection string (Neon recommended). Example:

DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

Optional: override seed volume (default 50000) using:

SEED_TX_COUNT=2000

2) Install and generate client

- npm ci
- npx prisma generate
- npx prisma migrate deploy

3) Seed data (pick one)

- npm run seed:light (faster local demo)
- npm run seed (full dataset)

4) Run the app

- npm run dev

## Scripts

- dev: start Next.js
- build: next build
- seed: full (50k tx) seed
- seed:light: light seed (2k tx)
- test: run unit & API contract tests

## Testing

Vitest loads `.env` if present; otherwise it falls back to `.env.example` to satisfy required variables. Contract tests mock Prisma where appropriate.

## Notes

- API input is validated with Zod in `lib/validation.ts`.
- Prisma connection tweaks in `lib/db.ts` help on hosted Postgres (Neon).
