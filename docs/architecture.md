# BookerBoard — System Architecture
# (Session 1 complete — verified March 2026)

## What BookerBoard Does

A year-round WWE booking decision support system that models creative
planning as a Constraint Satisfaction and Optimization Problem. When
injuries, story changes, or bad fan reactions break a planned card,
BookerBoard surfaces ranked valid alternatives in under a second.

Two users:
- **Creative Director** (Executive Director equivalent — Prichard/Koskey)
  — thinks year-round, makes strategic calls, sees all data including
  backstage scores, accepts solver backup plans
- **Lead Writer** (Baeckstrom/Williams equivalent) — builds weekly Raw
  and SmackDown cards segment by segment, works within constraints,
  escalates blockers to creative director

## The Five Layers
```
Client      →  React TypeScript booker dashboard (auth required)
Gateway     →  Go API (EC2) — routing, auth, CQRS split
Services    →  Java CSP solver · Go fan score engine
Data        →  PostgreSQL RDS · S3
Ingestion   →  Rust Lambda scraper · Go Lambda poller · Manual input
```

## The Two Critical Flows

### Injury write path (~860ms synchronous)
```
Creative director or lead writer flags injury
→ Go API receives PATCH /stars/:id
→ Go API calls Java solver synchronously
→ Java solver runs AC-3 arc consistency (propagates constraint failures)
→ Java solver runs beam search (finds top-K valid replacement cards)
→ Ranked backup plans written to PostgreSQL
→ Response returned to dashboard
```

### Read path (dashboard loads)
```
Go API → PostgreSQL → dashboard
Go API computes next-show todo list from rule checks → included in response
```

These two paths never interfere. The solver's write activity does not
touch the read path. This is the CQRS principle — Command Query
Responsibility Segregation.

## Service Responsibilities

### React TypeScript Dashboard (Client)
- Five views: year overview, card builder, narrative threads, star
  roster, injury alerts
- Auth required — planning tool only, not public
- Creative director lands on year overview on login
- Lead writer lands on card builder on login
- Talks only to the Go API gateway, never directly to services or DB

### Go API Gateway (EC2)
- Single entry point for all dashboard requests
- Handles authentication — issues JWT with role claim on login
- Enforces role-based access on every endpoint
- Splits read vs write traffic (CQRS)
- Calls Java solver synchronously on injury write path
- Computes next-show todo list on every card load — runs rule checks
  against the database (no solver call) and returns sorted blocker /
  warning / decision items with the card response
- Does not contain business logic — routes and orchestrates only

### Java CSP Solver (EC2, same instance as Go API)
- Stateless — receives card state as JSON, returns ranked alternatives
  as JSON
- Never touches the database directly
- Implements AC-3 arc consistency from scratch — O(ed³)
- Implements beam search with fan-weighted heuristic from scratch
- Sub-second response required — synchronous call, no queue
- Enforces availability constraints — part-time stars outside their
  contracted window excluded from beam search before ranking begins
- Surfaces backstage score warnings on any backup plan containing a
  star below the configured professionalism threshold

### Go Fan Score Engine (Lambda)
- Runs on a weekly cron, not always-on
- Fetches Reddit sentiment and Google Trends data
- Aggregates into fan_score rows (one per star per week)
- Writes to PostgreSQL

### Rust Lambda Scraper
- Runs weekly, not always-on
- Parses CAGEMATCH HTML for match quality scores
- Memory-safe HTML parsing — Rust ownership model prevents parsing bugs
- Writes match quality data to PostgreSQL

## User Roles

Two roles. Enforced at the Go API layer via JWT claims on every request.

### Creative Director
- Full access to all five views
- Reads and writes backstage scores
- Accepts solver backup plans and marks storyline overrides
- Confirms part-time star appearances
- Sees all todo items — blockers, warnings, and decisions
- Lands on year overview on login

### Lead Writer
- No access to year overview
- Lands on card builder on login — primary workspace
- Narrative threads: read-only
- Star roster: read-only — backstage score fields stripped from API
  response for lead_writer tokens
- Injury alerts: read-only — action buttons replaced with "Escalate
  to creative director"
- Cannot accept solver plans or mark storyline overrides
- Todo items: sees blockers and warnings only, not decisions

### How it works technically
Go API issues a JWT on login containing the user's role claim. Every
endpoint checks the role before returning data. Backstage score fields
are stripped from star responses for lead_writer tokens. Solver action
endpoints return 403 for lead_writer tokens.

## AWS Infrastructure

| Service | What runs on it |
|---|---|
| EC2 | Go API gateway + Java CSP solver (single instance) |
| RDS | PostgreSQL — managed, automated backups |
| Lambda | Rust scraper + Go fan score poller (weekly cron) |
| S3 | Static assets, solver JAR deployment artifacts |

**Why single EC2:** 1–10 users. No load balancer, no ECS, no Kubernetes.
Do not over-engineer for traffic that does not exist.

**Why Lambda for scrapers:** Event-driven, weekly schedule, no reason
to burn always-on compute.

**Why RDS over self-managed Postgres:** Automated backups and failover
with zero ops overhead.

## The Solver Contract

### Input — card state as JSON per request
```json
{
  "show": {
    "id": "...",
    "name": "Raw",
    "date": "2026-03-30",
    "broadcast_window": {
      "content_minutes": 150,
      "constraint_type": "soft"
    }
  },
  "segments": [...],
  "stars": [
    {
      "id": "...",
      "name": "CM Punk",
      "schedule_type": "full_time",
      "status": "active",
      "fan_score": {
        "value": 91,
        "trend": "up",
        "confidence": "high"
      },
      "draw_score": {
        "value": 89,
        "confidence": "medium"
      },
      "backstage_score": {
        "value": 54,
        "confidence": "high",
        "below_threshold": true
      },
      "availability": {
        "available": true,
        "appearances_remaining": null
      }
    }
  ],
  "narrative_threads": [...],
  "constraints": {
    "rematch_window_weeks": 6,
    "overexposure_threshold": 4,
    "backstage_score_threshold": 60
  }
}
```

### Output — ranked alternative cards as JSON
```json
{
  "plans": [
    {
      "rank": 1,
      "score": 0.94,
      "segments": [...],
      "violations_resolved": [...],
      "warnings": ["CM Punk backstage score below threshold"],
      "reasoning": "Jey Uso inserted as championship challenger..."
    }
  ]
}
```

### Solver guarantees
- No database connection
- No local state between calls
- Testable with pure data — no database setup needed in unit tests
- Enforces availability constraints before ranking
- Surfaces backstage warnings without blocking valid plans

## Data Model Summary (15 Tables)

| Table | Purpose |
|---|---|
| `star` | WWE roster — name, brand, alignment, health, workload, injury risk, elevation trajectory, schedule_type (full_time / part_time / special_appearance), contracted_appearances_remaining |
| `championship` | Title name, brand, prestige tier, current holder, reign start |
| `ppv_event` | Every event — weekly Raw/SmackDown and PLEs — with type and prestige tier |
| `broadcast_window` | Show name, distributor (US), distributor (international), content_minutes, constraint_type ('soft' or 'hard'), effective dates — one row per contract period per show |
| `segment` | Every card segment — type, duration range, star tier required, narrative thread FK |
| `narrative_thread` | Active storylines — stars involved, target PLE, build weeks, heat trajectory, status |
| `championship_match_history` | Historical title matches — which stars, which title, which event, result |
| `match_history` | All historical matchups for repeat-feud detection and CAGEMATCH quality scores |
| `fan_score` | Temporal — one row per star per week: pro_score, anti_score, controversy, data_source, confidence |
| `draw_score` | Business value per star: merch_score, crowd_reaction, social_following, data_source, confidence |
| `backstage_score` | Per star — professionalism, locker_room_reputation, creative_cooperation, injury_reliability, composite_score, below_threshold flag — creative director only |
| `star_availability` | Per part-time star — available_from, available_to, max_appearances, appearances_used, notes — one row per availability window |
| `solver_run` | Every solver invocation — input card, output plans, latency, planning horizon |
| `backup_plan` | Ranked backup plans from solver — score, reasoning, constraint violations resolved |
| `user` | Creative directors and lead writers — email, role, hashed password, created_at |

## Todo Computation

Todos are computed by the Go API on every card load — not by the solver.
They are derived from simple rule checks against the database.

### Blocker rules (must resolve before card can finalize)
- Segment contains injured or unavailable star
- Championship match segment has no contendership reason
- Card exceeds broadcast_window content_minutes where constraint_type
  is 'hard'

### Warning rules (should resolve before show airs)
- Part-time star on card with limited appearances remaining
- Narrative thread has had no segment in the last X weeks and target
  PLE is within Y weeks
- Star's consecutive appearances approaching overexposure threshold

### Decision rules (creative director judgment required)
- Feud has no target PLE assigned and has been dark for X weeks
- Championship reign length approaching overexposure threshold
- Part-time star's availability window ending soon with no follow-up
  window defined

## Constraint Graph (what the solver enforces)
```
sum(segment.duration_max) ≤ broadcast_window.content_minutes
  → soft: warn · hard: block

AND no segment features star WHERE star.status = 'injured'

AND star.schedule_type = 'part_time'
  → show date must fall within active star_availability window
  → star_availability.appearances_used < max_appearances

AND all narrative_threads serviced within threshold weeks

AND championship matches:
  → build_weeks ≥ minimum
  → contendership_reason IS NOT NULL
  → both stars have had build segments

AND no immediate rematch: same stars same title < 6 weeks apart

AND star.consecutive_appearances ≤ overexposure_threshold

AND segment.star_tier_required matches star.tier

AND event.prestige_tier ≥ championship.prestige_tier (title matches)

AND backstage_score.composite < threshold
  → flag warning on plan (does not block)
```

## CS Concepts Demonstrated

| Concept | Where |
|---|---|
| CSP with AC-3 arc consistency O(ed³) | Java solver |
| Beam search with fan-weighted heuristic | Java solver |
| CQRS — read/write path separation | Go API gateway |
| Temporal data modeling | fan_score (one row per star per week) |
| Bin-packing constraint | Broadcast window time budget |
| Availability constraint modeling | star_availability table + solver |
| Role-based access control | Go API JWT enforcement |