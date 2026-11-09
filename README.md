# VANTA Lang Results

Local Next.js + HeroUI viewer for finished language benchmark metrics.

## Data source

Reads `../vanta-lang-pipeline/results/benchmark_metrics_<lang>.csv` and writes portable JSON to `public/data/`.

```bash
npm run publish-data
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- `/` — portfolio insights + charts
- `/lang/[condition]` — per-language report
- `/compare` — EN-vs-SR style multi-language dashboard

Compare URL is shareable, e.g.:

```text
/compare?langs=english,serbian&base=english&metric=wall_clock_seconds&charts=perCase,pctDiff,totals,scatter,heatmap,statsTable
```

Controls encoded in the query string: `langs`, `base`, `metric`, `charts`.

Deploy later (Vercel). No auth.
