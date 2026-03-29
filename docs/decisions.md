# BookerBoard — Architecture Decisions Log

---

## Session 0 — Environment setup

| Decision | Rationale |
|---|---|
| Devcontainer over native installs | Eliminates environment drift between Windows and Mac — identical runtime on both machines |
| install.sh over devcontainer features block | ghcr.io feature pulling silently fails — direct apt install via shell script is explicit and debuggable |
| Git Bash preferred over PowerShell | Unix-style commands work identically on Windows and Mac — mkdir -p, touch etc. do not work in PowerShell |
| Redis deferred | No public traffic without fan dashboard. Add only if performance demands it |
| Solver is stateless | Easier to test, scale, and reason about. CQRS principle — write logic isolated from data layer |

---

## Session 1 — System design, domain knowledge, UI design

| Decision | Rationale |
|---|---|
| Fan public dashboard removed from scope | Booker system contains all meaningful CS complexity. One polished tool over two half-built ones |
| `segment` replaces `match_slot` | A show is not just matches — promos, packages, backstage segments all consume broadcast time and serve narrative threads |
| `broadcast_window` is its own table | Netflix Raw and USA SmackDown have different time budgets and constraint types. Contracts change — Raw moved networks in 2025, SmackDown changed runtime in 2026. No code change should be required when a contract changes |
| `broadcast_window.constraint_type`: soft or hard | Raw on Netflix has no fixed runtime (Triple H confirmed flexible). SmackDown on cable TV cannot go over. Solver warns on soft, blocks on hard |
| Manual input for merch, crowd, backstage data | WWE internal data not publicly available. System works better the more data you feed it. Manual entries flagged as lower confidence than automated signals |
| Single EC2, no load balancer | 1–10 users. Do not over-engineer for traffic that does not exist |
| Scope: year-round not just WrestleMania | Injuries, overexposure, and stalling feuds are 52-week problems, not one-event problems |
| Backstage score is separate from fan score | A star can have high fan score and low backstage score simultaneously (CM Punk 2023). Conflating them produces incorrect recommendations |
| Backstage score restricted to creative director | Sensitive internal data. Lead writers do not need it to build a card. Enforced at API layer by stripping fields from lead_writer JWT responses |
| `backstage_score` is its own table (table 13) | Four separate signals with individual values — a composite alone hides nuance. Creative director needs to see why a warning is firing |
| `star_availability` added as table 14 | A part-time star can have multiple availability windows per year. A single date range on the star record cannot model this |
| `user` added as table 15 | Auth requires storing users with role claims. JWT issued on login contains role — enforced on every endpoint |
| Part-time availability modeled per window | Roman Reigns available Feb–Apr and Jul–Aug but not between. One row per window in star_availability, not a single date range |
| Todo list computed by Go API, not the solver | Todos are simple rule checks against existing data — not constraint propagation. Calling the solver on every card load would be wasteful and slow |
| Two user roles: creative_director and lead_writer | BookerBoard models the planning layer only. Producers work live execution (Gorilla Position) — not modeled. Staff writers draft promos — not modeled. Two roles covers the exact problem space |
| Lead writer cannot accept solver plans or mark overrides | Escalation model matches real WWE structure — lead writers flag blockers, executive directors make the call |
| Solver input contract explicitly includes all three scores | Fan score, draw score, backstage score all in per-star JSON payload with confidence levels. Prevents silent ranking without complete data |
| NXT excluded from scope | Own creative structure (Shawn Michaels, Ryan Katz), own broadcast window (The CW, 2hrs), own PLE platform (YouTube from Mar 2026). Doubles domain complexity for no additional CS concept demonstrated. Future extension candidate |
| User roles named creative_director and lead_writer | Real WWE industry terms — not the fan term "booker". Maps to actual roles: Executive Director (Prichard/Koskey) and Lead Writer (Baeckstrom/Williams/Road Dogg) |