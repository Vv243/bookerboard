# BookerBoard

A year-round WWE booking decision support system that models creative planning
as a Constraint Satisfaction and Optimization Problem.

**Live at:** http://54.146.32.225

**Test credentials:** vinh@bookerboard.com / bookerboard123

---

## Resume Bullet

> Built a year-round WWE booking Constraint Optimization System in Java — AC-3
> arc consistency propagates constraint failures across a match and narrative
> graph in O(ed³), beam search with a fan-weighted heuristic surfaces ranked
> contingency plans; deployed on AWS with a Go API gateway and a React booker
> dashboard.

---

## CS Concepts Demonstrated

- Constraint Satisfaction Problem (CSP) with AC-3 arc consistency — O(ed³)
- Beam search with fan-weighted heuristic
- CQRS architecture (write path vs read path separation)
- Temporal data modeling (fan scores — one row per star per week)
- Bin-packing constraint (broadcast time budget)
- Role-based access control (JWT enforcement at Go API layer)

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| CSP solver | Java Spring Boot | AC-3 and beam search implemented from scratch |
| API gateway | Go (Gin) | Fast, lightweight, routing and orchestration |
| Weekly scraper | Rust Lambda | Memory-safe HTML parsing, runs weekly |
| Fan score pipeline | Go Lambda | Same language as API gateway, weekly cron |
| Booker dashboard | TypeScript React (Vite) | Single frontend, dark/light mode |
| Primary database | PostgreSQL on AWS RDS | Managed, reliable, temporal queries |
| Infrastructure | AWS EC2, RDS, Lambda, S3 | Right-sized for 1–10 users |

---

## Architecture

```
Client      →  React TypeScript dashboard (auth required)
Gateway     →  Go API (EC2) — routing, auth, CQRS split, todo computation
Services    →  Java CSP solver · Go fan score engine
Data        →  PostgreSQL RDS · S3
Ingestion   →  Rust Lambda scraper · Go Lambda poller · Manual input
```

---

## AWS Infrastructure

| Resource | Details |
|---|---|
| EC2 | t2.micro, us-east-1, running Go API + Java solver + nginx |
| RDS | db.t3.micro PostgreSQL 16, bookerboard-db.c4v40ywyq2ih.us-east-1.rds.amazonaws.com |
| Security groups | bookerboard-ec2-sg (22, 80, 8081), bookerboard-rds-sg (5432) |

---

## Running Locally

### Prerequisites
- Docker Desktop
- VS Code with Dev Containers extension

### Setup
```bash
# Clone
git clone git@github.com:Vv243/bookerboard.git
cd bookerboard

# Open in VS Code devcontainer
code .
# → "Reopen in Container" when prompted

# Start PostgreSQL
docker compose up -d

# Load schema and seed data
psql -h postgres -U bookerboard -d bookerboard -f services/db/schema.sql
psql -h postgres -U bookerboard -d bookerboard -f services/db/seed.sql
```

### Run each service

```bash
# Go API (port 8081)
cd services/api
CGO_ENABLED=0 go run main.go

# Java solver (port 8080)
cd services/solver
mvn spring-boot:run

# React dashboard (port 5173)
cd dashboard
npm run dev -- --host
```

### Environment variables (Go API)
```
DATABASE_URL=postgres://bookerboard:bookerboard@postgres:5432/bookerboard?sslmode=disable
JWT_SECRET=bookerboard-dev-secret
SOLVER_URL=http://localhost:8080
PORT=8081
```

### Insert test user
```bash
psql -h postgres -U bookerboard -d bookerboard -c "
INSERT INTO \"user\" (email, password_hash, user_role)
VALUES ('vinh@bookerboard.com', '\$2a\$12\$Kr.LK490Lt99YqivbKEjXu0rwyZ7Nmwut.dQWmUiw.hXCUKFUQnqa', 'creative_director');"
```

---

## Deploying to AWS

### Build binaries locally
```bash
# Go API — cross-compile for Linux
cd services/api
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -buildvcs=false -o bookerboard-api .

# Java solver
cd services/solver
mvn package -DskipTests -q
```

### Upload to EC2
```bash
scp -i ~/.ssh/bookerboard-key.pem \
  services/api/bookerboard-api \
  ec2-user@54.146.32.225:~/bookerboard-api

scp -i ~/.ssh/bookerboard-key.pem \
  services/solver/target/solver-0.0.1-SNAPSHOT.jar \
  ec2-user@54.146.32.225:~/solver-0.0.1-SNAPSHOT.jar
```

### Build and deploy dashboard
```bash
cd dashboard
npm run build
tar -czf /tmp/dashboard-dist.tar.gz -C dashboard dist
scp -i ~/.ssh/bookerboard-key.pem \
  /tmp/dashboard-dist.tar.gz \
  ec2-user@54.146.32.225:~/dashboard-dist.tar.gz
```

Then on EC2:
```bash
sudo mv ~/bookerboard-api /opt/bookerboard/services/api/bookerboard-api
sudo mv ~/solver-0.0.1-SNAPSHOT.jar /opt/bookerboard/services/solver/target/solver-0.0.1-SNAPSHOT.jar
sudo chmod +x /opt/bookerboard/services/api/bookerboard-api
sudo tar -xzf ~/dashboard-dist.tar.gz -C /var/www/bookerboard --strip-components=1
sudo systemctl restart bookerboard-solver bookerboard-api nginx
```

---

## File Structure

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
│   ├── db/
│   │   ├── schema.sql          ← 18 tables, 59 indexes
│   │   └── seed.sql            ← broadcast windows, events, stars
│   ├── solver/                 ← Java Spring Boot — AC-3 + beam search
│   ├── api/                    ← Go API gateway — Gin, JWT, CQRS
│   ├── fan-score/              ← Go Lambda — Reddit + Trends pipeline
│   └── scraper/                ← Rust Lambda — CAGEMATCH scraper
└── dashboard/                  ← TypeScript React — Vite, Tailwind
    └── src/
        ├── lib/
        │   ├── api.ts          ← Axios instance with JWT interceptors
        │   ├── auth.tsx        ← AuthContext, AuthProvider, useAuth
        │   ├── theme.tsx       ← ThemeProvider, dark/light mode
        │   └── styles.ts       ← Design system — themeColors, themeTag
        ├── views/              ← Five views: Login, YearOverview, CardBuilder,
        │                          NarrativeThreads, StarRoster, InjuryAlerts
        └── components/
            └── Layout.tsx      ← Top nav, role badge, theme toggle
```

---

## Build Checklist

- [x] Session 0 — Environment setup (devcontainer, Docker, README, repo)
- [x] Session 1 — System design, UI spec, domain knowledge, all docs
- [x] Session 2 — PostgreSQL schema (18 tables, 59 indexes, seed data)
- [x] Session 3 — Java CSP solver (AC-3 + beam search, verified via curl)
- [x] Session 4 — Go API skeleton (Gin router, JWT auth, middleware)
- [x] Session 5 — Go injury endpoint (PATCH /stars/:id, solver orchestration)
- [x] Session 6 — Fan score pipeline (Go Lambda, Reddit + Trends, 48 rows)
- [x] Session 7 — Rust Lambda scraper (CAGEMATCH HTML parser)
- [x] Session 8 — TypeScript React dashboard (all five views, design system)
- [x] Session 9 — AWS deployment (EC2, RDS, nginx, live at 54.146.32.225)
- [ ] Session 10 — Redis (only if performance demands it)

---

## Session Notes

### Session 2 — PostgreSQL schema
- `fan_score` is temporal — one row per star per week, enables trend detection
- `broadcast_window` uses EXCLUDE constraint — prevents overlapping contract periods
- `segment` enforces `championship_requires_contendership` at DB level
- `system_config` stores configurable thresholds — no hardcoded business rules

### Session 3 — Java CSP solver
Key classes: `Star`, `BroadcastWindow`, `Segment`, `Card`, `BackupPlan`,
`Arc`, `ConstraintGraph`, `AC3`, `BeamSearch`, `SolverService`, `SolverController`

Test: `curl -X POST http://localhost:8080/solve -H "Content-Type: application/json" -d @test-card.json`

### Session 4 — Go API skeleton
Key files: `config/config.go`, `internal/auth/jwt.go`, `internal/middleware/auth.go`,
`internal/handler/health.go`, `main.go`

### Session 5 — Go injury endpoint
Full pipeline: JWT validated → star updated → solver called synchronously →
backup plans written → response returned.

Test: `curl -X PATCH http://localhost:8081/api/stars/1 -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"status":"injured"}'`

### Session 6 — Fan score pipeline
Go Lambda, Reddit + Google Trends fetchers, 48 rows written across 24 stars.

Test: `DATABASE_URL="..." go test -v -run TestLocalRun`

### Session 7 — Rust scraper
Rust ownership model, Result type, async/await with Tokio.
Key files: `src/scraper.rs`, `src/db.rs`, `src/main.rs`

### Session 8 — TypeScript React dashboard
All five views: Login, Year Overview, Card Builder, Narrative Threads, Star Roster, Injury Alerts.
Design system in `src/lib/styles.ts` — `themeColors`, `themeTag`, `themeTodo`.
Dark/light mode with localStorage persistence via `ThemeProvider`.
Hard square tags throughout — Raw, SD, Face, Heel, Active, Injured, On Track, Stalling.

Go API endpoints added:
- `POST /api/auth/login`
- `GET /api/stars`, `PATCH /api/stars/:id`
- `GET /api/card`, `PATCH /api/card/:id/reorder`, `DELETE /api/card/segments/:id`, `POST /api/card/:id/segments`
- `GET /api/threads`, `GET /api/threads/:id`
- `GET /api/todos`
- `GET /api/overview/stats`, `GET /api/overview/ples`

### Session 9 — AWS deployment
- RDS PostgreSQL provisioned and schema loaded
- EC2 t2.micro running Go API (port 8081), Java solver (port 8080), nginx (port 80)
- Binaries built locally and uploaded via scp — faster than building on server
- nginx proxies `/api` to Go API, serves React dashboard at root
- Live at http://54.146.32.225

---

## Architecture Decisions Log

| Decision | Rationale | Session |
|---|---|---|
| Devcontainer over native installs | Eliminates environment drift between Windows and Mac | 0 |
| install.sh over devcontainer features | ghcr.io feature pulling unreliable — direct apt install explicit | 0 |
| Redis deferred | No public traffic. Add only if performance demands it | 0 |
| Solver is stateless | Easier to test, scale, reason about. CQRS principle | 0 |
| Fan public dashboard removed | Booker system contains all CS complexity | 1 |
| broadcast_window is its own table | Contracts change — Raw moved networks 2025 | 1 |
| Backstage score restricted to creative_director | Sensitive internal data, stripped from lead_writer tokens | 1 |
| Todo list computed by Go API, not solver | Simple rule checks, not constraint propagation | 1 |
| Build binaries locally, upload to EC2 | t2.micro too slow to build — cross-compile is fast | 9 |
| nginx as reverse proxy | Serves static dashboard + proxies API, single port 80 | 9 |