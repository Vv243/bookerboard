# BookerBoard

A year-round WWE booking decision support system that models creative planning 
as a Constraint Satisfaction and Optimization Problem.

## CS Concepts Demonstrated
- Constraint Satisfaction Problem (CSP) with AC-3 arc consistency — O(ed³)
- Beam search with fan-weighted heuristic
- CQRS architecture (write path vs read path separation)
- Temporal data modeling (fan scores — one row per star per week)
- Bin-packing constraint (broadcast time budget)

## Resume Bullet
Built a year-round WWE booking Constraint Optimization System in Java — AC-3 
arc consistency propagates constraint failures across a match and narrative 
graph in O(ed³), beam search with a fan-weighted heuristic surfaces ranked 
contingency plans; deployed on AWS with a Go API gateway and a React booker 
dashboard.

## Current File Structure
```
bookerboard/
├── README.md
├── docker-compose.yml
├── .gitignore
├── .devcontainer/
│   ├── devcontainer.json
│   └── install.sh
├── docs/
│   ├── architecture.md
│   ├── ui-spec.md
│   ├── domain-knowledge.md
│   └── decisions.md
├── services/
│   ├── solver/
│   ├── api/
│   ├── fan-score/
│   └── scraper/
└── dashboard/
```

## How to Run Locally
1. Install Docker Desktop and VS Code
2. Clone the repo via SSH
3. Open in VS Code → "Reopen in Container"
4. Wait for install.sh to complete (~4 minutes first time)
5. `docker compose up -d` to start PostgreSQL

## Architecture
Five layers: Client (React TS) → Gateway (Go EC2) → Services (Java solver, 
Go fan score engine) → Data (PostgreSQL RDS, S3) → Ingestion (Rust Lambda 
scraper, Go Lambda poller, manual input)


## Architecture Decisions Log
| Decision | Rationale | Session |
|---|---|---|
| devcontainer over native installs | Eliminates environment drift between Windows and Mac | 0 |
| install.sh over devcontainer features | ghcr.io feature pulling unreliable; direct apt install is explicit and debuggable | 0 |
| Redis deferred | No public traffic without fan dashboard. Add if performance demands it | 0 |
| Solver is stateless | Easier to test, scale, and reason about. CQRS principle | 0 |

## Session 2 — What was built

PostgreSQL schema — 18 tables, 59 indexes, seed data.

Key design decisions made:
- fan_score is temporal (one row per star per week) — enables trend
  detection not just point-in-time scores
- broadcast_window uses EXCLUDE constraint — prevents overlapping
  contract periods for the same show type
- segment enforces championship_requires_contendership at DB level —
  business rule enforced in data, not just application code
- system_config stores configurable thresholds — no hardcoded
  business rules in application code
- Round 3 tables are append-only historical records — never updated

To run the schema from scratch:
```bash
psql -h postgres -U bookerboard -d bookerboard -f services/db/schema.sql
psql -h postgres -U bookerboard -d bookerboard -f services/db/seed.sql
```

## Build Checklist
- [x] Session 0 — Environment setup
- [x] Session 1 — System design, UI spec, domain knowledge, all docs
- [x] Session 2 — PostgreSQL schema
- [ ] Session 3 — Java CSP solver
- [ ] Session 4 — Go API skeleton
- [ ] Session 5 — Go injury endpoint
- [ ] Session 6 — Fan score pipeline
- [ ] Session 7 — Rust scraper
- [ ] Session 8 — TypeScript booker dashboard
- [ ] Session 9 — AWS deployment