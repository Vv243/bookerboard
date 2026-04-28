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



To run the schema from scratch:
```bash
psql -h postgres -U bookerboard -d bookerboard -f services/db/schema.sql
psql -h postgres -U bookerboard -d bookerboard -f services/db/seed.sql
```

## Build Checklist
- [x] Session 0 — Environment setup
- [x] Session 1 — System design, UI spec, domain knowledge, all docs
- [x] Session 2 — PostgreSQL schema
- [x] Session 3 — Java CSP solver
- [x] Session 4 — Go API skeleton
- [x] Session 5 — Go injury endpoint
- [x] Session 6 — Fan score pipeline
- [x] Session 7 — Rust scraper
- [x] Session 8 — TypeScript booker dashboard
- [ ] Session 9 — AWS deployment

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

## Session 3 — What was built

Java Spring Boot CSP solver — AC-3 arc consistency and beam search
implemented from scratch.

Key classes:
- Star, BroadcastWindow, Segment, Card, BackupPlan — model layer
- Arc, ConstraintGraph — constraint graph representation
- AC3 — arc consistency algorithm, O(ed³) complexity
- BeamSearch — heuristic search, beam width 3
- SolverService — orchestrates AC3 + BeamSearch
- SolverController — POST /solve endpoint

## Session 4 — What was built

Go API gateway skeleton — Gin router, JWT auth, middleware.

Key files:
- config/config.go — environment variable loading with dev defaults
- internal/model/ — Go structs for Star, Segment, Card, BackupPlan, User
- internal/auth/jwt.go — JWT token generation and validation
- internal/middleware/auth.go — RequireAuth and RequireCreativeDirector
- internal/handler/health.go — GET /health
- main.go — Gin router, route groups, server startup

Verified endpoints:
- GET /health → 200 public
- GET /api/ping (no token) → 401 unauthorized
- GET /api/ping (valid JWT) → 200 with role in response


## Session 5 — What was built

Go injury endpoint — PATCH /stars/:id — full pipeline from
dashboard to solver to database.

Key files:
- internal/db/db.go — PostgreSQL connection pool
- internal/db/star_repository.go — star read/write queries
- internal/db/backup_plan_repository.go — backup plan writes
- internal/handler/solver_client.go — HTTP client for Java solver
- internal/handler/injury.go — PATCH /stars/:id handler

Verified flow:
1. JWT validated by middleware
2. Star status updated in PostgreSQL
3. Active stars fetched for solver payload
4. Java solver called synchronously — POST /solve
5. Backup plans written to PostgreSQL
6. Response returned to dashboard

To test:
curl -X PATCH http://localhost:8081/api/stars/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "injured"}'

## Session 6 — What was built

Go Lambda fan score pipeline — weekly cron that fetches fan
sentiment from Reddit and Google Trends and writes to PostgreSQL.

Key files:
- fetcher/reddit.go — Reddit SquaredCircle search, computes
  pro_score, anti_score, controversy
- fetcher/trends.go — Google Trends interest score (simulated
  locally, real API in production)
- db/writer.go — upserts fan_score rows, one per star per week
  per source
- main.go — Lambda entry point, CloudWatchEvent handler
- handler_test.go — local test runner

Verified: 48 rows written across 24 stars, 2 sources,
week_start = Monday of current week.

To test locally:
DATABASE_URL="postgres://bookerboard:bookerboard@postgres:5432/bookerboard?sslmode=disable" \
  go test -v -run TestLocalRun

## Session 7 — What was built

Rust Lambda CAGEMATCH scraper — HTML parser that extracts match
quality ratings and writes them to match_history.cagematch_score.

Key files:
- src/scraper.rs — CagematchScraper, HTML parsing with CSS selectors,
  score normalization
- src/db.rs — PostgreSQL writer, get_all_star_names, write_cagematch_score
- src/main.rs — Lambda entry point, iterates all stars, orchestrates
  scrape and write
- Cargo.toml — lambda_runtime, reqwest, scraper, tokio-postgres,
  serde_json

Key concepts demonstrated:
- Rust ownership — &str references into HTML buffer, no copies
- Result type and ? operator — error propagation without exceptions
- async/await with Tokio runtime
- No GC — deterministic memory management, safe for Lambda timeouts

Build: cargo build
Deploy: cargo build --release (Session 9)

## Session 8 — What was built (in progress)

TypeScript React dashboard — Vite + React 18 + TailwindCSS.

Completed so far:
- Login view — arena crowd background, gold WWE aesthetic, JWT auth
- Layout — horizontal top nav, role badge, sign out
- Star Roster view — sortable table, brand/status/search filters,
  role-gated backstage column, real data from Go API
- Go API: POST /api/auth/login, GET /api/stars endpoints added
- Auth: bcrypt password hashing, JWT token generation on login

To run dashboard:
cd dashboard
npm run dev -- --host

To run Go API:
cd services/api
CGO_ENABLED=0 go run main.go

Test credentials:
Email: vinh@bookerboard.com
Password: bookerboard123

## Command
To run the solver:
cd services/solver
mvn spring-boot:run

Test with curl:
curl -X POST http://localhost:8080/solve \
  -H "Content-Type: application/json" \
  -d @test-card.json