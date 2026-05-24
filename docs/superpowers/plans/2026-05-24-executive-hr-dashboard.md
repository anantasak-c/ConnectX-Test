# Executive HR Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a chart-first executive HR compensation dashboard connected to Google Sheets with CSV fallback.

**Architecture:** Express serves `/api/dashboard-data` and the built React app. Shared analytics code joins worker, title, and bonus data, then returns dashboard-ready metrics. React renders KPI scorecards, executive insight panels, charts, and a compact drill-down table.

**Tech Stack:** React, Vite, TypeScript, Express, Recharts, Google Sheets API, Vitest.

---

## File Structure

- `package.json`: scripts and dependencies.
- `index.html`: Vite entry point.
- `server.js`: Express server, env parsing, Google Sheets fetch, CSV fallback, static serving.
- `src/main.tsx`: React bootstrap.
- `src/App.tsx`: dashboard page and chart layout.
- `src/App.css`: minimal Looker-style dashboard styling.
- `src/lib/analytics.ts`: data normalization and metric calculation.
- `src/lib/format.ts`: number and percent formatting.
- `src/lib/analytics.test.ts`: TDD coverage for all executive metrics.

## Tasks

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/App.css`

- [x] Create a Vite React TypeScript app shell.
- [x] Add scripts for `dev`, `server`, `build`, `test`, and `preview`.

### Task 2: Analytics Module

**Files:**
- Create: `src/lib/analytics.ts`
- Create: `src/lib/analytics.test.ts`

- [x] Write failing tests for KPI totals, department share, bonus coverage, salary bands, and ranking.
- [x] Implement normalization, joining, and metric calculations.
- [x] Run tests and keep the analytics module independent of React.

### Task 3: Server Data Source

**Files:**
- Create: `server.js`

- [x] Read local env files without exposing secrets.
- [x] Fetch Google Sheets tabs with service account credentials.
- [x] Fall back to the attached CSV files under `C:\Users\anant\OneDrive\เดสก์ท็อป\Test`.
- [x] Return normalized dashboard payload at `/api/dashboard-data`.

### Task 4: Chart-First Dashboard UI

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css`
- Create: `src/lib/format.ts`

- [x] Render KPI cards.
- [x] Render donut, bar, horizontal bar, salary band, top compensation, and outlier charts.
- [x] Add executive insight copy in compact panels.
- [x] Add compact employee drill-down table.

### Task 5: Verification

**Files:**
- No new files.

- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Start the local server.
- [ ] Verify the dashboard visually in a browser at the local URL.
