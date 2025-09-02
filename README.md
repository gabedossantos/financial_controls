# Enterprise Financial Controls Design

Production-ready Next.js app for financial controls analytics, segregation of duties (SoD) monitoring, risk trends, and heatmaps, powered by a Postgres/Prisma backend.

## Features
- **Executive Dashboard**: Visualizes key metrics (employees, transactions, violations, compliance rate, resolution time, risk trends)
- **Risk Heatmap**: Department-level risk scoring and violation analysis
- **Trends Analytics**: Time-series charts for violations, risk scores, and control effectiveness
- **SoD Monitoring**: Detects role conflicts, temporal violations, and high-risk transactions
- **Materiality Context**: Adjustable thresholds for financial materiality, performance, and risk sensitivity
- **Employee & Transaction Modals**: Drill-down views for detailed analysis
- **Statistical Analysis**: Anomaly detection, risk scoring, and behavioral analytics

## Setup
1. **Clone the repo**
2. **Create `.env` from `.env.example`**
   - Set `DATABASE_URL` to your Postgres connection string
3. **Install dependencies**
   ```sh
   npm install
   ```
4. **Generate Prisma client & migrate**
   ```sh
   npx prisma generate
   npx prisma migrate deploy
   ```
5. **Seed data**
   ```sh
   npm run seed:light   # Fast demo seed
   npm run seed         # Full dataset
   ```
6. **Run the app**
   ```sh
   npm run dev
   ```

## API Endpoints
- `/api/dashboard/stats` — Dashboard metrics
- `/api/analytics/risk-heatmap` — Department risk heatmap
- `/api/analytics/trends` — Trend analytics (violations, risk scores, control effectiveness)
- `/api/employees` — Employee risk and behavior analysis
- `/api/transactions` — Transaction-level analytics
- `/api/violations` — Violation details
- `/api/health` — Health check

## Scripts
- `dev` — Start Next.js
- `build` — Production build
- `test` — Run unit & API contract tests (Vitest)
- `seed` — Full seed (50k transactions)
- `seed:light` — Light seed (2k transactions)

## Testing
- Uses Vitest; loads `.env` or falls back to `.env.example`
- Contract tests mock Prisma where needed

## Notes
- API input validated with Zod (`lib/validation.ts`)
- Prisma connection optimized for Neon/Postgres
- No secrets or private keys committed; `.env` is ignored

---
For more details, see the code and comments in each module.
