# Executive HR Dashboard Design

## Goal

Build a chart-first executive dashboard for HR compensation analysis. The dashboard should connect to Google Sheets using a local env file such as `.env.local` or `.env.local.txt`, and should also work from the provided CSV files as a local fallback.

## Data

The dashboard combines three tables:

- `worker`: employee profile, salary, joining date, department
- `title`: worker title history, joined by `WORKER_REF_ID`
- `bonus`: bonus payments, joined by `WORKER_REF_ID`

The app derives `TOTAL_BONUS`, `TOTAL_INCOME`, salary bands, department contribution, bonus coverage, and ranking metrics.

## Dashboard

The dashboard is optimized for executives and chart reading:

- KPI scorecards for headcount, salary, bonus, total income, average salary, median salary, min salary, and max salary
- Department contribution charts comparing income share and headcount share
- Efficiency charts for average salary and cost per head by department
- Bonus concentration charts showing bonus distribution and coverage
- Salary band distribution chart
- Top compensation ranking chart
- Minimal detail table sorted by total income

## Architecture

Use a small full-stack app:

- Express server reads `.env.local`, `.env.local.txt`, or `.env.lopcal.txt`, fetches Google Sheets data, and falls back to local CSV files.
- Shared analytics module normalizes and joins data.
- React frontend renders the dashboard with Recharts and a minimal Looker-like visual style.

## Error Handling

If Google Sheets credentials, sheet ID, or network access fail, the API falls back to CSV data and marks the source as `csv-fallback`. If neither Google Sheets nor CSV data is available, the API returns a JSON error for the UI to display.

## Testing

Unit tests cover analytics calculations, including KPI totals, department contribution, salary stats, bonus coverage, salary bands, and top compensation ordering.
