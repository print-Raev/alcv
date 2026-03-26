# ALLCLEAR

Commercial-ready post-construction cleaning bid generator + CRM + follow-up + revenue system.

## Stack

- Frontend: React + Vite + TypeScript
- Backend: Express + TypeScript
- Database: PostgreSQL (simple schema)
- Validation: Zod (schema-light, permissive)

## Product principles implemented

- Leads are **never blocked** for missing fields.
- Incomplete data is accepted and assigned a status (`SittingOnData`, `NeedsEnrichment`, etc.).
- User edits override extraction.
- Proposal generation does not imply sent state (`Generated ≠ Sent`).
- Revenue analytics unlock after at least 3 sent bids.

## Structure

```txt
.
├─ src/                    # frontend app (intake terminal, CRM, proposal, revenue dashboard)
├─ backend/
│  ├─ src/                 # Express API, extraction, import, pricing, analytics
│  ├─ sql/schema.sql       # Postgres schema
│  └─ .env.example
├─ .env.example            # frontend env
└─ README.md
```

## Setup

### 1) Install frontend deps

```bash
npm install
```

### 2) Install backend deps

```bash
npm --prefix backend install
```

### 3) Env files

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

### 4) (Optional) Create Postgres schema

```bash
psql "$DATABASE_URL" -f backend/sql/schema.sql
```

> The current backend is resilient and can run with in-memory storage if `DATABASE_URL` is unavailable.

## Run

Frontend:

```bash
npm run dev
```

Backend:

```bash
npm run dev:backend
```

## Main APIs

- `POST /api/intake` (text/file/image intake, extraction, lead creation)
- `GET /api/imports/preview` (CSV/JSON/pasted rows preview + fuzzy match)
- `POST /api/imports/commit` (save imported rows)
- `GET /api/leads`
- `PATCH /api/leads/:id`
- `POST /api/leads/:id/proposal` (competitive/standard/premium pricing)
- `DELETE /api/leads/:id` (soft delete)
- `GET /api/analytics`

## Pricing engine (2026 ranges)

- Rough clean: 0.10–0.30 sqft
- Final clean: 0.30–0.75 sqft
- Touch-up: 0.10–0.20 sqft
- Baseline average approx 0.25; complex jobs can approach 0.80
- Modifiers: debris, glass detail, urgency, floors, access difficulty

## UI behavior implemented

- Black + white minimalist interface
- Fast 120–180ms transitions
- Subtle pulse/fade for KPI and card updates
- “Sitting on Data” visibility for wasted opportunities
- Sent + follow-up progression tracking

## Pre-publish hardening included

- App boots with 5 realistic seed leads covering: complete, missing contact, missing sqft, missing contractor, and messy intake text.
- Generated vs Sent is visually separated in the proposal control panel.
- Soft delete updates cards and counters instantly.
- Follow-up timeline events are only created after Sent / FollowUpDue transitions.
- Revenue metrics remain locked until 3 sent bids.
