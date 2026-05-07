# BookerBoard — System Architecture

Updated through Session 9.

---

## Five Layers

```
Client      →  React TypeScript dashboard (auth required)
Gateway     →  Go API (EC2) — routing, auth, CQRS split, todo computation
Services    →  Java CSP solver · Go fan score engine
Data        →  PostgreSQL RDS · S3
Ingestion   →  Rust Lambda scraper · Go Lambda poller · Manual input
```

---

## Live Infrastructure

| Component | Address | Notes |
|---|---|---|
| Dashboard + API | http://54.146.32.225 | nginx on port 80 |
| Go API | http://54.146.32.225:8081 | Direct access for testing |
| Java solver | http://54.146.32.225:8080 | Internal only |
| RDS PostgreSQL | bookerboard-db.c4v40ywyq2ih.us-east-1.rds.amazonaws.com:5432 | sslmode=require |

### EC2 Services (systemd)
- `bookerboard-solver` — Java Spring Boot, port 8080
- `bookerboard-api` — Go Gin, port 8081
- `nginx` — port 80, serves dashboard + proxies /api

### nginx routing
```
GET /        → /var/www/bookerboard (React SPA)
GET /api/*   → http://localhost:8081/api/*
```

---

## Two Critical Flows

### Injury Write Path (~860ms synchronous)
```
User flags injury (PATCH /stars/:id)
→ Go API receives request
→ Star status updated in PostgreSQL
→ Go API calls Java solver synchronously (POST /solve)
→ Solver runs AC-3 + beam search
→ Ranked backup plans written to PostgreSQL
→ Response returned to dashboard
```

### Read Path (dashboard loads)
```
Go API → PostgreSQL → dashboard
Go API computes next-show todo list from rule checks → included in response
```

---

## Solver Contract

The Java solver is stateless. Receives card state as JSON, returns ranked
alternative cards as JSON with reasoning per plan. Never touches the database.

---

## User Roles

Enforced at Go API layer via JWT claims.

**creative_director:** Full access, backstage scores, accepts solver plans, lands on year overview.

**lead_writer:** No year overview, backstage scores stripped, escalate-only on injury alerts, decisions hidden from todo list.

---

## Todo Computation

Go API computes todos on every card load from rule checks.

- **Blockers:** Injured star in segment, championship match missing contendership reason, hard constraint exceeded
- **Warnings:** Stalling thread, part-time star approaching appearance limit, overexposure approaching
- **Decisions (creative_director only):** Thread with no target PLE, championship reign over 180 days

---

## Constraint Graph

```
sum(segment.duration) ≤ broadcast_window.content_minutes
  → soft (Raw): warn, allow save
  → hard (SmackDown): block finalization

AND no segment features star WHERE star.status = 'injured'
AND part_time stars within availability window and appearances limit
AND all narrative_threads serviced within threshold weeks
AND championship matches: build_weeks ≥ minimum, contendership_reason set
AND no immediate rematch: same stars same title < 6 weeks
AND star.consecutive_appearances ≤ overexposure_threshold
AND backstage_score.composite < threshold → flag warning (does not block)
```

---

## Database — 18 Tables

| Table | Purpose |
|---|---|
| `star` | WWE roster |
| `championship` | Titles and current holders |
| `ppv_event` | All events — weekly and PLEs |
| `broadcast_window` | Show runtime contracts |
| `segment` | Card segments |
| `narrative_thread` | Active storylines |
| `championship_match_history` | Historical title matches |
| `match_history` | All historical matchups |
| `fan_score` | Temporal — one row per star per week |
| `draw_score` | Business value per star |
| `backstage_score` | Professionalism, locker room, creative cooperation |
| `star_availability` | Part-time star windows |
| `solver_run` | Every solver invocation |
| `backup_plan` | Ranked backup plans |
| `user` | Creative directors and lead writers |
| `segment_star` | Stars assigned to segments |
| `narrative_thread_star` | Stars in narrative threads |
| `system_config` | Configurable thresholds |

---

## Local Development

```bash
docker compose up -d
psql -h postgres -U bookerboard -d bookerboard -f services/db/schema.sql
psql -h postgres -U bookerboard -d bookerboard -f services/db/seed.sql

cd services/solver && mvn spring-boot:run
cd services/api && CGO_ENABLED=0 go run main.go
cd dashboard && npm run dev -- --host
```

---

## Deployment Workflow

```bash
# 1. Build locally
cd services/api
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -buildvcs=false -o bookerboard-api .
cd dashboard && npm run build

# 2. Upload
scp -i ~/.ssh/bookerboard-key.pem services/api/bookerboard-api ec2-user@54.146.32.225:~/
tar -czf /tmp/dist.tar.gz -C dashboard dist
scp -i ~/.ssh/bookerboard-key.pem /tmp/dist.tar.gz ec2-user@54.146.32.225:~/

# 3. Apply on EC2
ssh -i ~/.ssh/bookerboard-key.pem ec2-user@54.146.32.225
sudo mv ~/bookerboard-api /opt/bookerboard/services/api/bookerboard-api
sudo chmod +x /opt/bookerboard/services/api/bookerboard-api
sudo tar -xzf ~/dist.tar.gz -C /var/www/bookerboard --strip-components=1
sudo systemctl restart bookerboard-api nginx

# 4. Verify
curl http://54.146.32.225/health
```