# Ratio Study Toolkit

A small Next.js app and TypeScript library for **sales ratio studies**, the
standard way mass appraisal offices measure how well assessed values track the
market. For each stratum of qualified sales it computes the median level, COD,
PRD, and PRB, trims outliers with the IQR method, and checks the results
against adopted performance standards.

All data is synthetic and generated deterministically. Nothing here is real
parcel or sales data.

## Quick start

Requires Node.js 22.13 or newer. There are no native dependencies, so `npm ci`
works without a compiler or any downloads beyond the npm registry.

```bash
npm ci
npm test          # Vitest suite, uses an in-memory database
npm run dev       # http://localhost:3000
```

The app creates and seeds `data/ratio-study.db` on first request. To rebuild it
from scratch:

```bash
npm run db:setup
```

Other scripts: `npm run build`, `npm start`, `npm run typecheck`.

## API

```
GET /api/studies?taxYear=2026&start=2024-01-01&end=2025-12-31&class=RES
```

| Parameter | Meaning |
| --- | --- |
| `taxYear` | Assessment year whose values are compared to sale prices |
| `start`, `end` | Study period, inclusive, `YYYY-MM-DD` |
| `class` | Property class: `RES`, `CON`, `COM`, or `VAC` |

Returns a `StudyResult` (see `src/lib/study/runStudy.ts`) with an `overall`
stratum and one stratum per neighborhood. Invalid parameters return `400` with
`{ "error": "..." }`.

## Methodology

`docs/methodology.md` is the specification for sample selection, trimming,
statistics, rounding, and performance standards. The implementation is expected
to match it exactly.

## Project layout

```
docs/methodology.md        Specification
scripts/setup-db.ts        Recreate and seed the SQLite database
src/app/                   Next.js page and /api/studies route
src/components/            UI components
src/lib/db/                Schema, connection, writers, deterministic seed
src/lib/repos/             SQL queries (the only code that touches the database)
src/lib/stats/             Pure statistics: median, quantiles, COD/PRD/PRB, trimming, rounding
src/lib/study/             Study configuration, stratification, reporting, compliance
tests/                     Vitest suites and fixtures
```

Domain logic in `src/lib/stats` and `src/lib/study` does not depend on Next.js,
so it can be tested directly.

## Database

SQLite through Node's built-in `node:sqlite` module. Node prints an
`ExperimentalWarning` the first time it loads; that is expected. The schema
lives in `src/lib/db/schema.ts`.
Set `DATABASE_PATH` to use a different file, or `:memory:` for an ephemeral
database (the test suite does this).

## License

MIT
