# BookerBoard — Domain Knowledge
# (Verified March 2026)

## The Problem WWE Booking Actually Has

WWE produces ~150 televised episodes per year across Raw and SmackDown,
plus 10-12 PLEs. Booking decisions compound across weeks — a bad
decision in February affects WrestleMania in April. Current booking
has no systematic way to track:

- Whether a narrative thread is stalling or building
- Whether a star is overexposed
- Whether a championship match has been sufficiently earned
- Whether a backup plan exists if an injury strikes
- Whether a star's backstage behavior should affect their push

BookerBoard models all of this systematically.

---

## Real WWE Creative Structure (verified 2026)

Understanding who BookerBoard actually serves:

| Role | Real name | BookerBoard user |
|---|---|---|
| Chief Content Officer | Triple H | Not a user — final say, not a planner |
| Executive Director | Bruce Prichard, Ed Koskey | Creative Director |
| Lead Writer per show | Baeckstrom, Williams (Raw) · Road Dogg, Switaka (SD) | Lead Writer |
| Staff Writer | Various | Not modeled — drafts promos, not cards |
| Producer / Road Agent | Abyss, Roode, Helms etc. | Not modeled — live execution, not planning |

BookerBoard serves two roles: Creative Director (year-round strategy)
and Lead Writer (weekly card building). Producers work the Gorilla
Position during live shows — a real-time execution problem BookerBoard
does not model.

---

## WWE Schedule Reality (verified March 2026)

| Show | US Broadcast | International | Runtime | Ad Breaks | Constraint type |
|---|---|---|---|---|---|
| Raw | Netflix | Netflix | Flexible ~2.5hrs | ~10 breaks US · no-ad subscribers see continued action | Soft |
| SmackDown | USA Network | Netflix | 3 hours (as of Jan 2, 2026) | Standard cable breaks | Hard |
| NXT | The CW | Netflix | 2 hours | Standard broadcast breaks | Out of scope |
| Main Event | YouTube | YouTube | ~1 hour | Pre-roll only | Out of scope |
| PLEs — main roster | ESPN DTC (US) | Netflix | 3–4 hours | Varies | Hard |
| NXT PLEs | YouTube (US, from Mar 2026) | Netflix | 2–3 hours | Varies | Out of scope |
| PLE library pre-Sept 2025 | Netflix (US) | Netflix | — | — | N/A |

### Key insights for the solver

**Raw (soft constraint):** No fixed runtime by contract — Triple H
confirmed flexible runtime with ~150 content minutes as the target.
Solver warns when over target but does not block save.

**SmackDown (hard constraint):** Three hours on cable TV. Effective
content window ~140 minutes after commercial breaks. Solver blocks
card finalization when exceeded.

**PLEs:** ESPN DTC in US, Netflix internationally. Same card, different
distributor. One broadcast_window row per PLE regardless of market.

**Why broadcast_window is its own table:** Contracts change constantly.
Raw moved from USA to Netflix in Jan 2025. SmackDown went 2hrs → 3hrs
in Jan 2026. NXT PLEs moved from Peacock to YouTube in Mar 2026.
A code change should never be required when a contract changes — a
single row update handles it.

---

## Segment Types and Durations

| Type | Main eventer | Midcard/undercard | Notes |
|---|---|---|---|
| In-ring promo | 10–15 min | 3–5 min | Opening segments often run long |
| Non-title match | 10–15 min | 5–10 min | Raw avg 11.2 min · SD avg 8.8 min (2025) |
| Championship match | 15–25 min | 10–15 min | Avg 12.5 min (2025 data) |
| Backstage segment | 2–5 min | 1–3 min | Does not consume ring time |
| Video package | 2–4 min | 2–4 min | Filler during transitions |
| Special match | 20–35 min | 15–20 min | Cage, ladder, TLC — PLE context primarily |

### Typical card structure

**Raw (~150 content minutes):**
- 4–5 matches standard · 2–3 on promo-heavy nights · 6+ tournament
  nights
- Remaining time: promos, packages, backstage segments, entrances

**SmackDown (~140 content minutes):**
- Similar structure · avg match time lower than Raw (8.8 vs 11.2 min)

**PLEs (3–4 hours):**
- 7–10 matches · Main event 20–35 min · Secondary 15–25 min ·
  Midcard 10–15 min each

---

## Star Scoring Model

Three separate scores per star. Deliberately separate — they measure
different things and can contradict each other.

### Fan Score (automated + temporal)

| Signal | Source | Confidence |
|---|---|---|
| Reddit sentiment | Go Lambda scraper | High |
| Google Trends search volume | Go Lambda scraper | High |
| Match quality score | Rust CAGEMATCH scraper | High |

Stored as one row per star per week. Enables trend detection — a star
rising from 61 to 72 over three weeks is a different booking decision
than a star sitting at 72 with no momentum. A single overwritten value
cannot tell you direction, only position.

### Draw Score (manual input)

| Signal | Source | Confidence |
|---|---|---|
| Merch sales score | Manual — creative director | Lower |
| Crowd reaction rating | Manual — creative director | Lower |
| Social media following | Automated — public API | High |

Manual entries flagged as lower confidence than automated signals.

### Backstage Score (manual input, private)

| Signal | What it measures |
|---|---|
| Professionalism | Shows up prepared, hits marks, respects crew |
| Locker room reputation | Relationship with peers and management |
| Creative cooperation | Takes direction vs fights every decision |
| Injury reliability | Works through issues vs extended time off |

Composite score = average of four signals.
`below_threshold` flag = composite < configurable threshold (default 60).

**Why separate from fan score:** CM Punk in 2023 — massive fan
reaction, WWE cautious due to reputation risk. Conflating them makes
incorrect recommendations.

**How the solver uses it:** Stars below threshold get a warning flag on
any backup plan containing them. The solver does not block — the
creative director makes the final call. Lead writers never see
backstage scores.

---

## Championship Match Constraints

A championship match must satisfy all three before the solver considers
it valid:

1. **Build weeks minimum** — enough weeks since feud started
2. **Contendership reason exists:**
   - Royal Rumble win — earns WrestleMania title shot of winner's choice
   - Money in the Bank cash-in — can be used anytime
   - Number 1 contender match result
   - Tournament win (used regularly — e.g. 2026 Royal Rumble build)
   - GM-assigned match — manual storyline override
3. **Both stars have had build segments** — promos or confrontations
   explaining why this match matters have aired

Missing any of these → critical constraint violation → writer must fix
or mark as storyline override.

---

## Narrative Thread Health

An active storyline between two or more stars building toward a target
PLE. System tracks health automatically.

**Green — on track:**
- Segments airing weekly or close to it
- Escalation happening (promos → confrontations → matches)
- Fan score trending upward for involved stars

**Amber — stalling:**
- Thread absent from TV for X weeks without resolution event
- Same match repeated with no escalation
- Big moment aired with no follow-up the next week

**Red — abandoned:**
- Thread inactive beyond abandonment threshold
- Target PLE passed with no resolution
- Stars moved to unrelated segments

Thresholds configurable — different storyline types have different
natural rhythms.

---

## Overexposure Detection

A star is flagged when:
- Appears in main event of every consecutive PLE
- Appears every week with no narrative progression
- Win rate so high matches feel predictable
- Consecutive appearance count exceeds configured threshold

Overexposure damages long-term draw value even when short-term fan
score is high. The system tracks it before it becomes a crowd problem.

---

## Injury Contingency Logic

When a star is flagged injured the solver:

1. Marks all segments containing that star as constraint failures
2. Runs AC-3 to propagate failures through the constraint graph
3. Runs beam search to find top-K valid replacement cards
4. Ranks alternatives by combined fan score, draw score, backstage score
5. Returns ranked plans with reasoning and constraint violations resolved

The creative director sees three options: accept a ranked plan, mark as
storyline override, or run the solver again.
The lead writer sees the alert read-only and can escalate to creative
director.

---

## The Repeat Feud Problem

Same two stars wrestling every week with no escalation is detectable.
The `match_history` table tracks all historical matchups. The solver
flags cards where the same pairing appears more than the configured
threshold within a rolling window. The rematch clause prevents the same
stars from having a championship rematch within 6 weeks.

---

## Star Availability and Schedule Type

| Type | Description | Current examples |
|---|---|---|
| `full_time` | Available for all Raw and SmackDown bookings | Gunther, Cody Rhodes, Rhea Ripley |
| `part_time` | Contracted for select PLEs and limited TV dates | Roman Reigns (contract ends WrestleMania 42) |
| `special_appearance` | One-off bookings entered manually per event | The Rock (TKO board member) |

### Availability window modeling

A part-time star can have multiple availability windows per year. Roman
Reigns may be available Feb–Apr (WrestleMania season) and Jul–Aug
(SummerSlam season) but not in between.

This is modeled in the `star_availability` table — one row per window,
not a single date range on the star record.

The solver checks two conditions before considering a part-time star:
1. Show date falls within an active availability window
2. appearances_used < max_appearances for that window

If either fails the star is excluded from beam search entirely — they
never appear as an option in the card builder or solver output.

### Part-time risk flags

Part-timers carry higher scheduling risk. This surfaces as a warning
in any backup plan that relies on a part-time star, showing remaining
contracted appearances so the creative director can assess whether
using one here is worth it.

---

## Next-Show Todo List

Todos are computed by the Go API on every card load from rule checks
against the database. They are not produced by the solver.

**Blockers** — must resolve before card can finalize:
- Segment contains injured or unavailable star
- Championship match has no contendership reason
- Card exceeds hard broadcast window limit

**Warnings** — should resolve before show airs:
- Part-time star on card with limited appearances remaining
- Narrative thread has no segment on this card and target PLE is close
- Star approaching overexposure threshold

**Decisions** — creative director judgment only:
- Feud dark for X weeks with no target PLE assigned
- Championship reign approaching overexposure territory
- Part-time star availability window ending with no follow-up defined

Creative directors see all three tiers. Lead writers see blockers and
warnings only — decisions require creative director judgment.