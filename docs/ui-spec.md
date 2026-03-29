# BookerBoard — UI Specification
# (Session 1 complete — verified March 2026)

## Guiding principles

**Structure before pixels.** This document defines data requirements
and user actions per view. Visual design details (colors, spacing,
fonts) are captured in the mockups built during Session 1 and will
be implemented in Session 8.

**Role determines access.** Every view and every action is gated by
the user's JWT role claim. Two roles: creative_director and
lead_writer. Where behavior differs it is called out explicitly.

**Data drives the UI.** Every element visible in the dashboard must
trace back to a database table or a derived computation. If a field
has no table, it has no place in the spec.

**Constraint visibility over constraint hiding.** The system never
silently blocks. Every constraint failure is visible to the user
with a specific explanation of what is wrong and what action will
fix it.

---

## Global

**Platform:** Web app, browser-based, any device. No mobile-specific
design in scope for Session 8 — responsive behavior is a future
extension.

**Theme:** Dark default, light toggle. WWE branded — BB mark in red
(#CE1126), gold tagline (#B8962E).

**Export:** PDF, Word, Excel, CSV available on every view.

**Auth:** JWT issued on login containing role claim. Session expires
after 8 hours of inactivity. No public access — all views require
auth.

**Navigation:**
- Creative director: Year overview · Card builder · Narrative threads
  · Star roster · Injury alerts
- Lead writer: Card builder · Narrative threads · Star roster ·
  Injury alerts (read-only)

**Default landing page:**
- Creative director → Year overview
- Lead writer → Card builder (next upcoming show pre-loaded)

**Error display:** Inline on the broken segment AND in the constraint
summary panel. Critical errors block the Finalize button. Warnings
allow save with acknowledgment.

---

## View 1 — Year overview

**Who sees it:** Creative director only. Lead writer has no access.

**Purpose:** The creative director's Monday morning command center.
See the full year at a glance. Know what needs attention before the
next show airs.

### Data required

**Metric cards (4):**

| Metric | Source table | Computation |
|---|---|---|
| Active feuds | `narrative_thread` | COUNT WHERE status != 'abandoned' |
| Injured stars | `star` | COUNT WHERE status = 'injured' |
| PLEs remaining | `ppv_event` | COUNT WHERE date > today AND type = 'ple' |
| Avg fan score | `fan_score` | AVG of most recent week's scores across all active stars |

**Metric card inline expand — data per card:**

Active feuds expand:
- Thread name, stars involved, target PLE, build weeks progress,
  status pill (green/amber/red)
- Source: `narrative_thread` JOIN `star` JOIN `ppv_event`
- Shows top 5 by urgency — most stalling first
- Link to full list in Narrative threads view

Injured stars expand:
- Star name, injury type, date flagged, estimated return, PLE impact
- Source: `star` WHERE status = 'injured'
- Severity: critical (active PLE build impacted) vs warning (no
  active build)
- Link to Injury alerts view

PLEs remaining expand:
- Event name, date, location, US distributor, international
  distributor, status pill
- Source: `ppv_event` JOIN `broadcast_window`
- Ordered chronologically

Avg fan score expand:
- Top 5 performers: star name, brand, score, trend arrow
- Bottom 5 needing attention: star name, brand, score, trend arrow,
  reason flag
- Source: `fan_score` most recent week JOIN `star`
- Backstage risk badge shown inline for stars below threshold

**Next-show todo list:**

Source: Go API rule checks computed on card load — not the solver.

Todo item fields:
- type: 'blocker' | 'warning' | 'decision'
- title: short description of the issue
- detail: specific explanation — which star, which segment, which rule
- action_label: button text
- action_target: which view or endpoint the action navigates to
- resolved: boolean — toggled by user, persisted in session only

Todo ordering: blockers first (red) → warnings second (amber) →
decisions last (gray, creative director only)

Lead writers see blockers and warnings. Decisions are hidden for
lead_writer role.

Progress bar: count of resolved / total items for current show.

Show header: show name, date, venue, US network, days until show.
Updates automatically — always reflects the next upcoming show.

**PLE timeline (right column):**
- Event name, date, location, US distributor, status pill
- Source: `ppv_event` ordered by date
- Shows next 4 upcoming PLEs
- Status derived from narrative threads targeting each PLE

### Actions available

| Action | Role | What happens |
|---|---|---|
| Click metric card | Creative director | Inline expand opens below card, red border activates, click again to close, only one open at a time |
| Click todo item | Creative director | Marks resolved (session only) — progress bar updates |
| Click todo action button | Creative director | Navigates to relevant view or triggers relevant endpoint |
| Export | Creative director | Generates PDF/Word/Excel/CSV of current year overview state |

---

## View 2 — Card builder

**Who sees it:** Both roles. Lead writer's primary workspace.
Creative director uses it to review and adjust.

**Purpose:** Build a valid Raw or SmackDown card segment by segment.
All constraints checked live. Card cannot be finalized with unresolved
blockers.

### Data required

**Show selector:**
- Available shows: Raw and SmackDown only (NXT out of scope)
- Source: `ppv_event` WHERE type = 'weekly' AND date >= today
- Default: next upcoming show for the selected brand
- Switching show reloads the broadcast window, roster pool, and
  constraint mode

**Broadcast budget bar:**
- current_minutes: SUM of segment.duration for all segments on card
- limit_minutes: `broadcast_window`.content_minutes
- constraint_type: `broadcast_window`.constraint_type
- Display: current / limit in minutes
- Color: green (under 80% of limit) → amber (80–100%) → red (over)
- Behavior: soft constraint → warns, allows save. Hard constraint →
  blocks Finalize button until resolved

**Segment list:**
Each segment row displays:
- Segment number (order on card)
- Segment type (from enum: match, championship_match, promo,
  backstage, video_package, special_match)
- Star name(s) involved
- Duration (minutes)
- Status: valid (no border) · warning (amber left border) ·
  error (red left border)
- Inline badges: star tier, narrative thread served,
  contendership reason (championship matches), part-time flag,
  availability warning

Source: `segment` JOIN `star` JOIN `narrative_thread`
JOIN `broadcast_window`

**Add segment modal — data required:**
- Segment type selector: 6 types with suggested duration range per type
- Star search: filtered roster showing only stars available for this
  show and brand
- Star list fields per result:
  - name, schedule_type, brand, fan_score (latest week), trend
  - availability status: available / part-time (N appearances left) /
    injured (locked) / unavailable (locked)
  - backstage risk badge — creative director only
- Duration input: integer minutes, validated against suggested range
  for segment type and star tier
- Live constraint panel updates on every selection:
  - Broadcast budget after adding this segment
  - Star availability check result
  - Narrative thread served (if any)
  - Overexposure risk check

Source for star search: `star` JOIN `fan_score` (latest week)
JOIN `star_availability` JOIN `backstage_score` (creative director
only)

**Star search sidebar (persistent, right panel):**
- Search input: filters by name in real time
- Results: same fields as add segment modal star list
- Click a star to see detail: fan score trend, draw score, workload
  (appearances this month), brand, current narrative thread,
  availability status, remaining contracted appearances (part-time)
- Backstage score visible to creative director only

**Constraint panel (persistent, left below segments):**
Summary of all active constraint violations for the current card:
- Critical errors: list with specific description per error
- Warnings: list with specific description per warning
- Finalize button: disabled until all critical errors resolved

### Actions available

| Action | Role | What happens |
|---|---|---|
| Select show (Raw / SmackDown) | Both | Reloads broadcast window, roster pool, constraint mode |
| Add segment | Both | Opens add segment modal |
| Select segment type in modal | Both | Updates suggested duration range, shows contendership notice if championship match |
| Select star in modal | Both | Updates live constraint panel in modal |
| Confirm add segment | Both | Segment added to card, constraint panel updates, budget bar updates |
| Reorder segments (drag) | Both | Updates segment order, re-evaluates card number sequence |
| Edit segment | Both | Opens segment in edit mode (same modal, fields pre-filled) |
| Remove segment | Both | Segment removed, budget bar updates, constraint panel updates |
| Finalize card | Both | Disabled until all blockers resolved. On click: writes card to DB, triggers todo list recompute |
| Export | Both | PDF/Word/Excel/CSV of current card state |

---

## View 3 — Narrative threads

**Who sees it:** Both roles. Read-only for both — thread status is
derived automatically by the system, not manually edited here.

**Purpose:** See all active storylines, their health, and what the
system has flagged. Used by creative director for strategic planning
and by lead writer to understand context when building a card.

### Data required

**Thread list — all info visible without clicking:**

Per thread row:
- Thread name (stars involved)
- Brand (Raw / SmackDown)
- Status pill: green (on track) · amber (stalling) · red (abandoned)
- Build weeks progress bar: weeks_built / target_build_weeks
- Target PLE: event name and date
- Fan score trend for involved stars: score and direction arrow
- Last segment: date of most recent TV appearance
- Flag message: specific text explaining what is wrong (amber/red only)
  and what action would fix it

Source: `narrative_thread` JOIN `star` JOIN `ppv_event`
JOIN `fan_score` (latest week) JOIN `segment` (most recent per thread)

**Status derivation rules:**
- Green: last segment within X weeks AND build weeks on pace for
  target PLE AND fan scores trending flat or up
- Amber: last segment > X weeks ago OR same matchup repeated > Y times
  with no escalation OR big moment aired with no follow-up next week
- Red: last segment > Z weeks ago OR target PLE passed with no
  resolution OR stars reassigned to unrelated segments

X, Y, Z are configurable thresholds stored in system config.

**Flag messages — specific, not generic:**
- "No TV segment in 3 weeks — feud stalling before WrestleMania 42"
- "Same match repeated 3 times with no escalation — consider a stipulation"
- "Dark for 7 weeks — recommend assigning a target PLE or parking the feud"
- "Target PLE (WrestleMania 42) in 3 weeks — only 4 of 10 build weeks complete"

**Filters:**
- Brand: All / Raw / SmackDown
- Status: All / On track / Stalling / Abandoned
- Target PLE: dropdown of upcoming PLEs

### Actions available

| Action | Role | What happens |
|---|---|---|
| Filter by brand / status / PLE | Both | Filters thread list in real time, no page reload |
| Export | Both | PDF/Word/Excel/CSV of current thread list |

No edit actions in this view for either role. Thread data is
system-derived. Changes happen through the card builder (adding
segments that serve threads) or through the solver (accepting backup
plans that affect threads).

---

## View 4 — Star roster

**Who sees it:** Both roles. Backstage score visible to creative
director only — stripped from API response for lead_writer tokens.

**Purpose:** Full roster overview. Sortable table with expandable
rows. Used to assess star health, workload, and availability before
building a card.

### Data required

**Table columns (all sortable):**

| Column | Source | Notes |
|---|---|---|
| Star name | `star`.name | Click row to expand |
| Status | `star`.status | Active / Injured / Suspended |
| Schedule | `star`.schedule_type | Full-time / Part-time / Special |
| Brand | `star`.brand | Raw / SmackDown |
| Fan score | `fan_score` latest week | Value + trend arrow |
| Backstage score | `backstage_score`.composite | Creative director only · badge: High / Medium / Low / Risk |
| Workload | `segment` count this month | N of max appearances |

**Filters:**
- Search by name (real time)
- Brand: All / Raw / SmackDown
- Status: All / Active / Injured
- Schedule type: All / Full-time / Part-time

**Expanded row — click any row to open inline:**

Fields shown in expanded row:
- Fan score: current value, trend, 4-week sparkline
- Draw score: merch, crowd reaction, social following, confidence
  per signal
- Backstage score (creative director only): professionalism,
  locker_room_reputation, creative_cooperation, injury_reliability,
  composite, below_threshold flag with warning text if flagged
- Availability: schedule_type, contracted_appearances_remaining,
  next availability window dates (part-time only)
- Current narrative thread: thread name, target PLE, build weeks,
  status
- Recent match record: last 5 matches — opponent, event, result,
  date
- Workload: segments this month, consecutive appearances,
  overexposure flag if triggered
- Injury detail (if injured): injury type, date flagged, estimated
  return, which segments impacted

Source: `star` JOIN `fan_score` JOIN `draw_score`
JOIN `backstage_score` (creative director only)
JOIN `star_availability` JOIN `narrative_thread`
JOIN `match_history` JOIN `segment`

### Actions available

| Action | Role | What happens |
|---|---|---|
| Click column header | Both | Sorts table by that column ascending / descending toggle |
| Filter | Both | Filters roster list in real time |
| Click row | Both | Expands inline detail · click again to close · only one row open at a time |
| Export | Both | PDF/Word/Excel/CSV of current roster view state |

No edit actions in this view. Star data is updated through manual
input forms (backstage scores, draw scores) accessed separately —
not in scope for the roster view itself.

---

## View 5 — Injury alerts

**Who sees it:** Both roles. Actions differ by role.

**Purpose:** Triage active injuries. See solver backup plans. Take
action or escalate.

### Data required

**Alert cards — one per injured star:**

Alert severity:
- Critical (red left border): injured star has an active segment on
  the next show's card AND/OR an active PLE build is impacted
- Warning (amber left border): injured star has no immediate card
  impact but is monitored

Per alert card fields:
- Star name
- Injury type and body part
- Date flagged
- Estimated return (weeks)
- Severity pill: Critical / Warning
- Impacted segments: list of segment names on upcoming cards that
  feature this star
- Impacted PLE builds: list of narrative threads targeting PLEs that
  this star is part of

Source: `star` WHERE status = 'injured' JOIN `segment`
JOIN `narrative_thread` JOIN `ppv_event`

**Solver backup plans (per critical alert):**

Plans shown: top 3 ranked alternatives returned by last solver run
for this injury.

Per plan fields:
- Rank (1 / 2 / 3)
- Replacement segment description (who replaces whom in which segment)
- Contendership reason (if championship match)
- Fan score of replacement stars
- Backstage risk badge (if any replacement star below threshold) —
  creative director sees badge · lead writer does not see score value
- Confidence score (0–100%)
- Reasoning: plain English explanation of why this plan was ranked
  here and what constraint violations it resolves

Source: `backup_plan` JOIN `solver_run` JOIN `star`
JOIN `backstage_score` (creative director only)

### Actions available

**Creative director:**

| Action | What happens |
|---|---|
| Accept backup plan | Applies the plan to the card — updates segments in DB, triggers todo list recompute, marks alert as resolved |
| Mark as storyline | Overrides constraint violations — marks the injury as a creative decision, removes alert, requires a note |
| Run solver again | Re-runs solver with current card state — replaces existing backup plans with new ranked results |
| Dismiss warning | Marks warning-severity alert as acknowledged — remains visible but de-prioritized |
| Export | PDF/Word/Excel/CSV of current alerts and backup plans |

**Lead writer:**

| Action | What happens |
|---|---|
| Escalate to creative director | Sends a notification to all creative director accounts flagging this alert as requiring a decision — no card changes made |
| Export | PDF/Word/Excel/CSV of current alerts |

Lead writer cannot accept plans, mark as storyline, or run the solver.
All solver action buttons are replaced with a single "Escalate to
creative director" button.

---

## Add segment modal (shared component)

Used from the card builder view. Detailed spec:

**Step 1 — Segment type selection (required first)**
- 6 options displayed as selectable cards in a 2-column grid
- Each option shows: type name, suggested duration range
- Championship match selected → shows contendership notice:
  "Contendership reason required — solver will verify build weeks
  and challenger eligibility automatically"
- Selection is required before star search is enabled

**Step 2 — Star selection (required)**
- Search input: filters roster in real time by name
- Results show: available stars for this show's brand only
- Per result: name, schedule_type, fan_score (latest), trend,
  availability status badge
- Unavailable stars (injured, availability window closed) shown
  grayed out with lock icon — not selectable
- Part-time stars show remaining appearances badge
- Backstage risk badge visible to creative director only
- Click to select — row highlights green
- Selection updates live constraint panel in Step 3

**Step 3 — Duration input**
- Integer minutes input
- Suggested range shown based on segment type + star tier
- Validates against suggested range — warns if outside but does not
  block

**Live constraint panel (updates on every selection change):**
- Broadcast budget after adding: current + new duration vs limit
- Star availability result: pass / part-time warning / fail
- Narrative thread served: thread name if applicable, none if not
- Overexposure risk: pass / warning with consecutive count

**Add button:**
- Disabled until segment type AND at least one star selected
- Label updates: "Add [Star name] — [segment type]"
- On confirm: closes modal, segment added to card, card constraint
  panel refreshes, budget bar updates

---

## Constraint error messages — exact text

The system never shows a generic error. Every constraint failure has
a specific message.

| Constraint | Error text |
|---|---|
| Injured star in segment | "[Star name] is flagged injured — remove from this segment or accept a backup plan in Injury alerts" |
| Part-time star outside window | "[Star name] is not available for this show — availability window closed" |
| Part-time appearances exhausted | "[Star name] has 0 contracted appearances remaining this month" |
| Hard broadcast window exceeded | "Card exceeds SmackDown's 140-minute limit by [N] minutes — remove or shorten segments before finalizing" |
| Soft broadcast window exceeded | "Card is [N] minutes over Raw's 150-minute target — confirm or adjust before finalizing" |
| Championship match no contendership | "Championship match requires a contendership reason — set via [Star name]'s profile or mark as storyline override" |
| Championship match insufficient build | "Championship match requires [N] more build weeks — [X] weeks booked of [Y] minimum" |
| Rematch clause | "Same championship rematch within 6 weeks — not permitted unless marked as storyline override" |
| Overexposure warning | "[Star name] has appeared in [N] consecutive main events — consider rotating" |
| Thread not serviced | "[Feud name] has not appeared on TV in [N] weeks and targets [PLE] in [X] weeks — consider adding a segment" |
| Backstage risk | "[Star name] backstage score below threshold ([score]) — confirm this booking or consider alternatives" |

---

## Data not in scope for Session 8

The following are noted for future sessions and should not be
implemented in Session 8:

- Mobile responsive layout
- Auth / login screen design (auth logic is Session 4 — Go API)
- Live show execution tools (Gorilla Position equivalent)
- Promo script drafting
- NXT card builder
- Fan-facing public dashboard
- Direct edit of narrative threads (system-derived only)
- Direct edit of fan scores (automated pipeline only)