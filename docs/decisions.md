# BookerBoard — Architecture Decisions Log

Every major decision with rationale. Updated through Session 9.

---

## Session 0 — Environment Setup

| Decision | Rationale |
|---|---|
| Devcontainer over native installs | Eliminates environment drift between Windows and Mac. Same tools, same versions, always. |
| install.sh over devcontainer features block | ghcr.io feature pulling unreliable — direct apt install is explicit and debuggable |
| Git Bash preferred over PowerShell | Unix-style commands work identically on both machines |
| Redis deferred | No public traffic. Add only if performance demands it |
| Solver is stateless | Easier to test, scale, reason about. CQRS principle — write path and read path separated |

---

## Session 1 — System Design

| Decision | Rationale |
|---|---|
| Fan public dashboard removed | Booker system contains all CS complexity. Public dashboard adds Redis dependency for no additional CS concept |
| `segment` replaces `match_slot` | Shows are not just matches — promos, packages, backstage segments all have constraints |
| `broadcast_window` is its own table | Contracts change — Raw moved to Netflix 2025, SmackDown changed runtime 2026. No code change required |
| `broadcast_window.constraint_type` soft or hard | Raw flexible runtime (soft). SmackDown cable TV (hard). Solver warns vs blocks |
| Manual input for merch, crowd, backstage data | WWE internal data not publicly available |
| Single EC2, no load balancer | 1–10 users. Do not over-engineer |
| Scope: year-round not just WrestleMania | Injuries, overexposure, stalling feuds are 52-week problems |
| Backstage score separate from fan score | CM Punk 2023 — high fan score, low backstage reputation. Conflating them makes wrong recommendations |
| Backstage score restricted to creative_director | Sensitive internal data. Stripped from API response for lead_writer tokens |
| `backstage_score` is its own table | Four signals with individual values — composite alone hides nuance |
| `star_availability` added as own table | Part-time star can have multiple windows per year. Single date range on star cannot model this |
| `user` table added | JWT-based auth requires storing users with role claims |
| Todo list computed by Go API, not solver | Todos are simple rule checks — not constraint propagation. Solver on every load would be wasteful |
| Two roles: creative_director and lead_writer | BookerBoard models planning layer only. Producers (live execution) not modeled |
| Lead writer cannot accept solver plans | Escalation model matches real WWE structure — lead writers flag, executive directors decide |
| NXT excluded from scope | Own creative structure, broadcast window, PLE platform. Doubles complexity for no additional CS concept |
| Roles named creative_director and lead_writer | Real WWE industry terms, not fan term "booker" |

---

## Session 2 — PostgreSQL Schema

| Decision | Rationale |
|---|---|
| `fan_score` is temporal (one row per star per week) | Enables trend detection — not just point-in-time scores. Week-over-week delta shows momentum |
| `broadcast_window` uses EXCLUDE constraint | Prevents overlapping contract periods for the same show type at the database level |
| `segment` enforces `championship_requires_contendership` | Business rule enforced in data, not just application code. Prevents invalid cards from being saved |
| `system_config` stores configurable thresholds | No hardcoded business rules in application code. Overexposure threshold, stall threshold configurable without deploy |
| Historical tables are append-only | `championship_match_history`, `match_history` never updated — only inserted. Preserves full record |
| 59 indexes across 18 tables | Temporal queries on `fan_score`, feud detection on `match_history`, availability checks on `star_availability` all need index support |
| `btree_gist` extension for EXCLUDE | Standard PostgreSQL range exclusion — no custom code required |

---

## Session 3 — Java CSP Solver

| Decision | Rationale |
|---|---|
| AC-3 before beam search | AC-3 prunes the constraint graph first — reduces the search space beam search has to explore |
| Beam width 3 | Balances coverage vs speed. Width 1 = greedy (misses good solutions). Width 10 = too slow for sub-second response |
| Fan score as primary heuristic | Beam search ranks candidates by aggregate fan score of stars in the plan. Maximizes crowd reaction |
| Solver receives full card as JSON | Stateless contract — solver never touches the database. Easier to test, scale, and reason about |
| Spring Boot for solver | Vinh's strongest language is Java. AC-3 and beam search implemented from scratch, not from library |
| Solver runs synchronously on injury write path | Sub-second response required. Queue/async would add latency and complexity for 1-10 users |

---

## Session 4 — Go API Skeleton

| Decision | Rationale |
|---|---|
| Gin over standard library | Middleware chaining, route groups, and parameter binding are cleaner with Gin. Standard library would require significant boilerplate |
| JWT claims include userRole | Role enforcement at middleware layer — handlers don't need to re-query the database for role |
| RequireAuth and RequireCreativeDirector as separate middleware | Composable — some routes need auth only, some need auth + role. Separation keeps handlers clean |
| Config loaded from environment variables | Twelve-factor app principle. No secrets in code. Different values for dev vs prod without code changes |
| CGO_ENABLED=0 for builds | Disables C bindings. Pure Go binary. Required for cross-compilation and smaller binary size |

---

## Session 5 — Go Injury Endpoint

| Decision | Rationale |
|---|---|
| Solver called synchronously in PATCH /stars/:id | Injury write path is ~860ms. Acceptable for 1-10 users. Queue would add complexity with no benefit |
| Backup plans written to PostgreSQL before response | Persists plans so creative director can review them later, not just immediately after flagging |
| Star status updated before solver call | Solver needs to know the star is injured to exclude them from backup plan candidates |
| BackupPlanRepository separate from StarRepository | Single responsibility — each repository owns one domain |

---

## Session 6 — Fan Score Pipeline

| Decision | Rationale |
|---|---|
| Go Lambda over always-on service | Fan scores only need updating weekly. Lambda costs pennies vs EC2 running 24/7 for a weekly job |
| Reddit r/SquaredCircle as primary source | Largest wrestling discussion community. Pro/anti/controversy signals are meaningful |
| Google Trends as secondary source | Measures search interest — different signal from Reddit sentiment |
| One row per star per week per source | Preserves data provenance. Can weight sources differently later. Enables per-source confidence scoring |
| Upsert on conflict | Idempotent — Lambda can safely re-run without creating duplicate rows |

---

## Session 7 — Rust Scraper

| Decision | Rationale |
|---|---|
| Rust for scraper | Memory-safe HTML parsing. No GC pauses. Deterministic memory management safe for Lambda timeouts |
| CAGEMATCH as data source | Most comprehensive match quality database available publicly. Star ratings from audience votes |
| Lambda over always-on scraper | Runs weekly, not continuous. Lambda is the correct tool for periodic batch jobs |
| target/ added to .gitignore | Rust build artifacts are hundreds of MB. Should have been done before first cargo build |

---

## Session 8 — TypeScript React Dashboard

| Decision | Rationale |
|---|---|
| Vite over Create React App | Much faster build and hot reload. Standard in production React projects |
| React Query (TanStack) for data fetching | Handles loading states, error states, caching, and refetching. Cleaner than raw useEffect + fetch |
| `import type` for TypeScript interfaces | Vite requires type-only imports for interfaces — prevents runtime errors from erased types |
| `localSegments` separate from React Query cache | Server data (React Query) is source of truth. Local state only used during active drag operations |
| Design system in styles.ts | Single file for all colors, fonts, spacing. Change once, updates everywhere |
| ThemeProvider with localStorage | Theme persists across sessions. Dark mode default — matches WWE aesthetic |
| Hard square tags (no border radius) | Rounded pill badges look generic/AI-generated. Square tags feel like broadcast chyrons |
| `themeColors(isDark)` function pattern | Returns full color object for current theme. Components call once per render, not per element |
| `npm run dev -- --host` required | Devcontainer networking — Vite must listen on all interfaces for port forwarding to work |
| Horizontal top nav over sidebar | Booker tool is wide-format. Sidebar wastes horizontal space that segment lists need |

---

## Session 9 — AWS Deployment

| Decision | Rationale |
|---|---|
| Build binaries locally, upload via scp | t2.micro has 1GB RAM — too slow to compile Go + Java. Cross-compilation on dev machine is fast |
| nginx as reverse proxy | Single port 80 entry point. Serves static React dashboard + proxies /api to Go API. Standard pattern |
| Go API and Java solver on same EC2 instance | Solver called synchronously — network latency between two instances would add 50-100ms per call |
| Systemd for service management | Auto-restart on crash, starts on boot, logs to journald. Standard Linux service management |
| RDS over PostgreSQL on EC2 | Managed backups, point-in-time recovery, automatic failover. Worth the small cost for a database |
| `publicly-accessible = true` on RDS | Allows direct psql connections from devcontainer for schema management and seeding |
| No Elastic IP allocated yet | Static IP costs $0.005/hour when not attached. Should allocate before sharing URL publicly |
| `sslmode=require` in DATABASE_URL | RDS requires SSL. Enforces encrypted connections between EC2 and RDS |