-- =============================================================================
-- BookerBoard — PostgreSQL Schema
-- Session 2 — verified March 2026
--
-- Dependency order:
--   Round 1: user, star, championship, ppv_event, broadcast_window
--   Round 2: narrative_thread, star_availability, backstage_score,
--            fan_score, draw_score, segment
--   Round 3: match_history, championship_match_history,
--            solver_run, backup_plan
-- =============================================================================


-- =============================================================================
-- EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS btree_gist;


-- =============================================================================
-- ENUMS
-- All enums defined before any table that references them
-- =============================================================================

CREATE TYPE schedule_type_enum AS ENUM (
  'full_time',
  'part_time',
  'special_appearance'
);

CREATE TYPE star_status_enum AS ENUM (
  'active',
  'injured',
  'suspended'
);

CREATE TYPE brand_enum AS ENUM (
  'raw',
  'smackdown'
);

CREATE TYPE prestige_tier_enum AS ENUM (
  'world',          -- WHC, Undisputed WWE Championship
  'secondary',      -- IC, US Championship
  'tag_team',       -- World Tag Team, WWE Tag Team
  'womens_world',   -- Women's World, WWE Women's Championship
  'womens_secondary' -- Women's IC, Women's US Championship
);

CREATE TYPE event_type_enum AS ENUM (
  'raw',
  'smackdown',
  'ple',
  'special'
);

CREATE TYPE prestige_tier_event_enum AS ENUM (
  'standard',
  'premium'
);

CREATE TYPE constraint_type_enum AS ENUM (
  'soft',
  'hard'
);

CREATE TYPE thread_status_enum AS ENUM (
  'on_track',
  'stalling',
  'abandoned'
);

CREATE TYPE heat_trajectory_enum AS ENUM (
  'rising',
  'falling',
  'stable'
);

CREATE TYPE data_source_enum AS ENUM (
  'reddit',
  'google_trends',
  'cagematch',
  'manual'
);

CREATE TYPE confidence_enum AS ENUM (
  'high',
  'medium',
  'low'
);

CREATE TYPE segment_type_enum AS ENUM (
  'match',
  'championship_match',
  'promo',
  'backstage',
  'video_package',
  'special_match'
);

CREATE TYPE segment_status_enum AS ENUM (
  'valid',
  'warning',
  'error'
);

CREATE TYPE contendership_reason_enum AS ENUM (
  'royal_rumble_win',
  'mitb_cashIn',
  'tournament_win',
  'number_one_contender',
  'gm_assigned'
);


-- =============================================================================
-- ROUND 1 TABLES — no foreign key dependencies
-- =============================================================================

-- -----------------------------------------------------------------------------
-- user
-- Stores creative directors and lead writers.
-- email UNIQUE automatically creates an index — no manual index needed.
-- -----------------------------------------------------------------------------
CREATE TABLE "user" (
  id            BIGSERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  user_role     TEXT NOT NULL CHECK (user_role IN ('creative_director', 'lead_writer')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- system_config
-- Key-value store for configurable thresholds read by the Go API at startup.
-- Avoids hardcoding business rules in application code.
-- Examples: backstage_score_threshold, overexposure_threshold
-- -----------------------------------------------------------------------------
CREATE TABLE system_config (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- star
-- Core roster table. Referenced by almost every other table.
-- workload_this_month and consecutive_appearances are denormalized counters
-- updated by the Go API — avoids recomputing from segment on every solver run.
-- -----------------------------------------------------------------------------
CREATE TABLE star (
  id                               BIGSERIAL PRIMARY KEY,
  name                             TEXT NOT NULL,
  brand                            brand_enum NOT NULL,
  alignment                        TEXT NOT NULL CHECK (alignment IN ('face', 'heel', 'neutral')),
  status                           star_status_enum NOT NULL DEFAULT 'active',
  schedule_type                    schedule_type_enum NOT NULL DEFAULT 'full_time',
  contracted_appearances_remaining INTEGER,
  workload_this_month              INTEGER NOT NULL DEFAULT 0,
  consecutive_appearances          INTEGER NOT NULL DEFAULT 0,
  injury_risk                      INTEGER CHECK (injury_risk BETWEEN 1 AND 100),
  elevation_trajectory             TEXT CHECK (elevation_trajectory IN ('rising', 'falling', 'stable')),
  created_at                       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ON star (brand, status);
CREATE INDEX ON star (status, schedule_type);

-- -----------------------------------------------------------------------------
-- championship
-- ~10 rows total — small table, minimal indexing needed.
-- current_holder_id nullable — title can be vacant.
-- -----------------------------------------------------------------------------
CREATE TABLE championship (
  id                BIGSERIAL PRIMARY KEY,
  name              TEXT NOT NULL UNIQUE,
  brand             brand_enum,
  prestige_tier     prestige_tier_enum NOT NULL,
  current_holder_id BIGINT REFERENCES star(id) ON DELETE SET NULL,
  reign_start       DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ON championship (brand);
CREATE INDEX ON championship (current_holder_id);

-- -----------------------------------------------------------------------------
-- ppv_event
-- Stores every event: weekly Raw/SmackDown shows and PLEs.
-- event_date_end is NULL for single-night events.
-- Partial unique index prevents two PLEs on the same start date.
-- -----------------------------------------------------------------------------
CREATE TABLE ppv_event (
  id               BIGSERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  event_type       event_type_enum NOT NULL,
  event_date_start DATE NOT NULL,
  event_date_end   DATE,
  location         TEXT,
  distributor_us   TEXT,
  distributor_intl TEXT,
  prestige_tier    prestige_tier_event_enum NOT NULL DEFAULT 'standard',
  brand            brand_enum,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX ON ppv_event (event_date_start)
  WHERE event_type = 'ple';
CREATE INDEX ON ppv_event (event_type, event_date_start);
CREATE INDEX ON ppv_event (brand, event_date_start);

-- -----------------------------------------------------------------------------
-- broadcast_window
-- One row per contract period per show type.
-- EXCLUDE constraint prevents overlapping active windows for the same show.
-- Solver reads this to determine content budget and constraint behavior.
-- -----------------------------------------------------------------------------
CREATE TABLE broadcast_window (
  id               BIGSERIAL PRIMARY KEY,
  event_type       event_type_enum NOT NULL,
  content_minutes  INTEGER NOT NULL,
  constraint_type  constraint_type_enum NOT NULL,
  distributor_us   TEXT NOT NULL,
  distributor_intl TEXT NOT NULL,
  effective_from   DATE NOT NULL,
  effective_to     DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT one_active_window EXCLUDE USING gist (
    event_type WITH =,
    daterange(effective_from, effective_to, '[)') WITH &&
  )
);




-- =============================================================================
-- ROUND 2 TABLES — depend on Round 1
-- =============================================================================

-- -----------------------------------------------------------------------------
-- narrative_thread
-- Active storylines. Status and heat_trajectory are system-derived and stored
-- here to avoid recomputation on every dashboard load.
-- last_segment_date stored directly — avoids 14 subqueries per page load.
-- -----------------------------------------------------------------------------
CREATE TABLE narrative_thread (
  id                    BIGSERIAL PRIMARY KEY,
  name                  TEXT NOT NULL,
  brand                 brand_enum NOT NULL,
  status                thread_status_enum NOT NULL DEFAULT 'on_track',
  heat_trajectory       heat_trajectory_enum NOT NULL DEFAULT 'stable',
  target_ple_id         BIGINT REFERENCES ppv_event(id) ON DELETE SET NULL,
  build_weeks_target    INTEGER NOT NULL DEFAULT 10,
  build_weeks_completed INTEGER NOT NULL DEFAULT 0,
  last_segment_date     DATE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Junction table: many stars per thread, many threads per star
CREATE TABLE narrative_thread_star (
  narrative_thread_id BIGINT NOT NULL REFERENCES narrative_thread(id) ON DELETE CASCADE,
  star_id             BIGINT NOT NULL REFERENCES star(id) ON DELETE CASCADE,
  role                TEXT CHECK (role IN ('protagonist', 'antagonist', 'supporting')),
  PRIMARY KEY (narrative_thread_id, star_id)
);

CREATE INDEX ON narrative_thread (brand, status);
CREATE INDEX ON narrative_thread (target_ple_id);
CREATE INDEX ON narrative_thread (status, last_segment_date);
CREATE INDEX ON narrative_thread_star (star_id);
-- -----------------------------------------------------------------------------
-- star_availability
-- One row per availability window per part-time star.
-- Solver checks: show date within window AND appearances_used < max.
-- EXCLUDE prevents overlapping windows for the same star.
-- -----------------------------------------------------------------------------
CREATE TABLE star_availability (
  id               BIGSERIAL PRIMARY KEY,
  star_id          BIGINT NOT NULL REFERENCES star(id) ON DELETE CASCADE,
  available_from   DATE NOT NULL,
  available_to     DATE NOT NULL,
  max_appearances  INTEGER NOT NULL,
  appearances_used INTEGER NOT NULL DEFAULT 0,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT appearances_within_limit
    CHECK (appearances_used <= max_appearances),

  CONSTRAINT one_window_per_period EXCLUDE USING gist (
    star_id WITH =,
    daterange(available_from, available_to, '[)') WITH &&
  )
);

CREATE INDEX ON star_availability (star_id, available_from, available_to);
CREATE INDEX ON star_availability (available_from, available_to);

-- -----------------------------------------------------------------------------
-- backstage_score
-- One row per star. Manual entry by creative director only.
-- composite_score = average of four signals, stored not computed.
-- below_threshold = composite < system_config backstage_score_threshold.
-- entered_by ON DELETE RESTRICT — protects audit trail.
-- -----------------------------------------------------------------------------
CREATE TABLE backstage_score (
  id                     BIGSERIAL PRIMARY KEY,
  star_id                BIGINT NOT NULL REFERENCES star(id) ON DELETE CASCADE,
  professionalism        INTEGER NOT NULL CHECK (professionalism BETWEEN 1 AND 100),
  locker_room_reputation INTEGER NOT NULL CHECK (locker_room_reputation BETWEEN 1 AND 100),
  creative_cooperation   INTEGER NOT NULL CHECK (creative_cooperation BETWEEN 1 AND 100),
  injury_reliability     INTEGER NOT NULL CHECK (injury_reliability BETWEEN 1 AND 100),
  composite_score        INTEGER NOT NULL CHECK (composite_score BETWEEN 1 AND 100),
  below_threshold        BOOLEAN NOT NULL DEFAULT false,
  entered_by             BIGINT NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  notes                  TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT one_score_per_star UNIQUE (star_id)
);


CREATE INDEX ON backstage_score (star_id);
CREATE INDEX ON backstage_score (below_threshold);

-- -----------------------------------------------------------------------------
-- fan_score
-- Temporal — one row per star per week per source.
-- This is what enables trend detection, not just point-in-time scores.
-- week_start is always the Monday of that week by pipeline convention.
-- -----------------------------------------------------------------------------
CREATE TABLE fan_score (
  id          BIGSERIAL PRIMARY KEY,
  star_id     BIGINT NOT NULL REFERENCES star(id) ON DELETE CASCADE,
  week_start  DATE NOT NULL,
  pro_score   INTEGER NOT NULL CHECK (pro_score BETWEEN 0 AND 100),
  anti_score  INTEGER NOT NULL CHECK (anti_score BETWEEN 0 AND 100),
  controversy INTEGER NOT NULL CHECK (controversy BETWEEN 0 AND 100),
  data_source data_source_enum NOT NULL,
  confidence  confidence_enum NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT one_score_per_star_per_week
    UNIQUE (star_id, week_start, data_source)
);


CREATE INDEX ON fan_score (star_id, week_start DESC);
CREATE INDEX ON fan_score (week_start);

-- -----------------------------------------------------------------------------
-- draw_score
-- One row per star. Partially manual (merch, crowd) partially automated
-- (social). Each signal has its own confidence level — manual = lower.
-- entered_by ON DELETE SET NULL — less sensitive than backstage_score.
-- -----------------------------------------------------------------------------
CREATE TABLE draw_score (
  id               BIGSERIAL PRIMARY KEY,
  star_id          BIGINT NOT NULL REFERENCES star(id) ON DELETE CASCADE,
  merch_score      INTEGER CHECK (merch_score BETWEEN 0 AND 100),
  merch_confidence confidence_enum NOT NULL DEFAULT 'low',
  crowd_reaction   INTEGER CHECK (crowd_reaction BETWEEN 0 AND 100),
  crowd_confidence confidence_enum NOT NULL DEFAULT 'medium',
  social_following INTEGER CHECK (social_following BETWEEN 0 AND 100),
  social_confidence confidence_enum NOT NULL DEFAULT 'high',
  entered_by       BIGINT REFERENCES "user"(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT one_draw_score_per_star UNIQUE (star_id)
);

CREATE INDEX ON draw_score (star_id);

-- -----------------------------------------------------------------------------
-- segment
-- One row per segment per show card.
-- Stars are stored in segment_star junction table — many stars per segment.
-- contendership_reason only required for championship_match type.
-- status is system-derived and stored — avoids recomputation on load.
-- segment_order tracks card position — updated when writer reorders.
-- -----------------------------------------------------------------------------
CREATE TABLE segment (
    id                      BIGSERIAL PRIMARY KEY,
    ppv_event_id            BIGINT NOT NULL REFERENCES ppv_event(id) ON DELETE CASCADE,
    narrative_thread_id     BIGINT REFERENCES narrative_thread(id) ON DELETE SET NULL,
    segment_type            segment_type_enum NOT NULL,
    segment_order           INTEGER NOT NULL,
    duration_minutes        INTEGER NOT NULL CHECK (duration_minutes > 0),
    status                  segment_status_enum NOT NULL DEFAULT 'valid',
    contendership_reason    contendership_reason_enum,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- No two segments can have the same order position on the same show
    CONSTRAINT unique_segment_order
     UNIQUE (ppv_event_id, segment_order),

     -- Championship matches must have a contendership reason
     CONSTRAINT championship_requires_contendership CHECK (
        segment_type != 'championship_match'
        OR contendership_reason IS NOT NULL
     )
);

CREATE TABLE segment_star(
  segment_id BIGINT NOT NULL REFERENCES segment(id) ON DELETE CASCADE,
  star_id    BIGINT NOT NULL REFERENCES star(id) ON DELETE CASCADE,
  PRIMARY KEY (segment_id, star_id)
);

CREATE INDEX ON segment (ppv_event_id, segment_order);
CREATE INDEX ON segment (narrative_thread_id);
CREATE INDEX ON segment_star (star_id);


-- -----------------------------------------------------------------------------
-- match_history
-- Append-only. One row per match aired.
-- Used by solver for repeat-feud detection and CAGEMATCH quality scores.
-- Never updated — historical record.
-- -----------------------------------------------------------------------------
CREATE TABLE match_history (
  id                BIGSERIAL PRIMARY KEY,
  ppv_event_id      BIGINT NOT NULL REFERENCES ppv_event(id) ON DELETE RESTRICT,
  winner_id         BIGINT REFERENCES star(id) ON DELETE SET NULL,
  loser_id          BIGINT REFERENCES star(id) ON DELETE SET NULL,
  match_type        segment_type_enum NOT NULL,
  duration_mins     INTEGER,
  cagematch_score   DECIMAL(4,2),
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ON match_history (ppv_event_id);
CREATE INDEX ON match_history (winner_id);
CREATE INDEX ON match_history (loser_id);
-- ppv_event_id: load all matchers from specific row
-- winner_id + loser_id: find all mathces involving a specific star


-- -----------------------------------------------------------------------------
-- championship_match_history
-- Append-only. One row per championship match.
-- Separate from match_history — different queries, different constraints.
-- Solver uses this for rematch clause and reign validation.
-- Never updated — historical record.
-- -----------------------------------------------------------------------------
CREATE TABLE championship_match_history (
  id                        BIGSERIAL PRIMARY KEY,
  ppv_event_id              BIGINT NOT NULL REFERENCES ppv_event(id) ON DELETE RESTRICT,
  championship_id           BIGINT NOT NULL REFERENCES championship(id) ON DELETE RESTRICT,
  champion_id               BIGINT REFERENCES star(id) ON DELETE SET NULL,
  challenger_id             BIGINT REFERENCES star(id) ON DELETE SET NULL,
  title_changed             BOOLEAN NOT NULL DEFAULT false,
  contendership_reason      contendership_reason_enum NOT NULL,
  match_duration_mins       INTEGER,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ON championship_match_history (championship_id, created_at DESC);
CREATE INDEX ON championship_match_history (champion_id);
CREATE INDEX ON championship_match_history (challenger_id);
CREATE INDEX ON championship_match_history (ppv_event_id);
-- championship_id + created_at DESC: get most recent title match for a championship
-- champion_id + challenger_id: rematch clause check - same two stars recently?


-- -----------------------------------------------------------------------------
-- solver_run
-- Append-only. One row per solver invocation.
-- Stores full input and output JSON for debugging and auditing.
-- latency_ms lets us monitor solver performance over time.
-- Never updated — historical record.
-- -----------------------------------------------------------------------------
CREATE TABLE solver_run (
  id                BIGSERIAL PRIMARY KEY,
  ppv_event_id      BIGINT REFERENCES ppv_event(id) ON DELETE SET NULL,
  triggered_by      BIGINT REFERENCES "user"(id) ON DELETE SET NULL,   
  input_json        JSONB NOT NULL, 
  output_json       JSONB,
  latency_ms       INTEGER,
  status            TEXT NOT NULL CHECK (status IN ('success','failed','timeout')),
  error_message     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ON solver_run (ppv_event_id, created_at DESC);
CREATE INDEX ON solver_run (created_at DESC);
-- ppv_event_id + created_at DESC: load latest solver run for specific show
-- created_at DESC: monitor recent solver performance across all runs


-- -----------------------------------------------------------------------------
-- backup_plan
-- Append-only. One row per ranked plan per solver run.
-- Creative director accepts a plan — Go API applies it to the card.
-- Never updated after creation — accepted flag set instead.
-- -----------------------------------------------------------------------------
CREATE TABLE backup_plan (
  id                BIGSERIAL PRIMARY KEY,
  solver_run_id     BIGINT NOT NULL REFERENCES solver_run(id) ON DELETE CASCADE,
  rank              INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 10),
  score             DECIMAL(5,4) NOT NULL CHECK (score BETWEEN 0 AND 1),
  plan_json         JSONB NOT NULL,
  reasoning         TEXT NOT NULL,
  warnings          TEXT[],
  accepted          BOOLEAN NOT NULL DEFAULT false,
  accepted_by       BIGINT REFERENCES "user"(id) ON DELETE SET NULL,
  accepted_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Only one plan per rank per solver run
    CONSTRAINT unique_rank_per_run UNIQUE (solver_run_id, rank),

    -- accepted_at must be set if accepted is true
    CONSTRAINT accepted_requires_timestamp CHECK (
      accepted = false
      OR accepted_at IS NOT NULL
    )
  );

  CREATE INDEX ON backup_plan (solver_run_id, rank);
  CREATE INDEX ON backup_plan (accepted) WHERE accepted = false;
  -- solver_run_id + rank: load all plans for a solver run in ranked order
  -- accepted WHERE false: find all pending plans needing a decision