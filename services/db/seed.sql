-- =============================================================================
-- BookerBoard — Seed Data
-- Session 2 — verified March 2026
--
-- Run after schema.sql:
-- psql -h postgres -U bookerboard -d bookerboard -f services/db/seed.sql
-- =============================================================================


-- =============================================================================
-- system_config
-- Configurable thresholds read by Go API at startup.
-- Change values here — no code change or restart needed.
-- =============================================================================

INSERT INTO system_config (key, value, description) VALUES
  ('backstage_score_threshold', '60',
   'Composite score below which a star is flagged as a booking risk'),
  ('overexposure_threshold', '4',
   'Consecutive PLE main events before overexposure warning fires'),
  ('stalling_weeks_amber', '3',
   'Weeks without TV time before thread turns stalling'),
  ('stalling_weeks_red', '7',
   'Weeks without TV time before thread turns abandoned'),
  ('rematch_window_weeks', '6',
   'Minimum weeks before same championship rematch is permitted'),
  ('build_weeks_minimum_championship', '4',
   'Minimum build weeks required before a championship match is valid');


-- =============================================================================
-- broadcast_window
-- One row per active contract period per show type.
-- effective_to NULL means currently active.
-- =============================================================================

INSERT INTO broadcast_window
  (event_type, content_minutes, constraint_type, distributor_us, distributor_intl, effective_from)
VALUES
  ('raw',       150, 'soft', 'Netflix',     'Netflix', '2025-01-06'),
  ('smackdown', 140, 'hard', 'USA Network', 'Netflix', '2026-01-02'),
  ('ple',       180, 'hard', 'ESPN DTC',    'Netflix', '2025-09-20');


-- =============================================================================
-- ppv_event — upcoming PLEs (2026)
-- Weekly Raw and SmackDown events are created programmatically by the Go API.
-- Only PLEs and specials are seeded here.
-- =============================================================================

INSERT INTO ppv_event
  (name, event_type, event_date_start, event_date_end, location, distributor_us, distributor_intl, prestige_tier, brand)
VALUES
  ('Saturday Night''s Main Event XLIII', 'special',   '2026-01-24', NULL,          'Bell Centre, Montreal',          'ESPN DTC',   'Netflix', 'standard', NULL),
  ('Royal Rumble 2026',                  'ple',        '2026-01-31', NULL,          'Riyadh Season Stadium, Riyadh',  'ESPN DTC',   'Netflix', 'premium',  NULL),
  ('Elimination Chamber 2026',           'ple',        '2026-02-28', NULL,          'United Center, Chicago',         'ESPN DTC',   'Netflix', 'premium',  NULL),
  ('WrestleMania 42',                    'ple',        '2026-04-18', '2026-04-19',  'Allegiant Stadium, Las Vegas',   'ESPN DTC',   'Netflix', 'premium',  NULL),
  ('Backlash 2026',                      'ple',        '2026-05-01', NULL,          'Benchmark International Arena, Tampa', 'ESPN DTC', 'Netflix', 'premium', NULL),
  ('Saturday Night''s Main Event XLIV', 'special',    '2026-05-23', NULL,          'Allen County War Memorial Coliseum, Fort Wayne', 'ESPN DTC', 'Netflix', 'standard', NULL),
  ('SummerSlam 2026',                    'ple',        '2026-08-01', '2026-08-02',  'U.S. Bank Stadium, Minneapolis', 'ESPN DTC',   'Netflix', 'premium',  NULL),
  ('Money in the Bank 2026',             'ple',        '2026-09-06', NULL,          'Smoothie King Center, New Orleans', 'ESPN DTC', 'Netflix', 'premium',  NULL);


-- =============================================================================
-- championship
-- Current title holders as of March 31 2026.
-- current_holder_id is NULL — stars not seeded yet.
-- Update with real star IDs after seeding stars.
-- =============================================================================

INSERT INTO championship
  (name, brand, prestige_tier, reign_start)
VALUES
  -- Raw championships
  ('World Heavyweight Championship',          'raw',        'world',            '2025-11-01'),
  ('Intercontinental Championship',           'raw',        'secondary',        '2026-03-02'),
  ('World Tag Team Championship',             'raw',        'tag_team',         '2026-03-30'),
  ('Women''s World Championship',             'raw',        'womens_world',     '2025-01-01'),
  ('Women''s Intercontinental Championship',  'raw',        'womens_secondary', '2026-02-28'),

  -- SmackDown championships
  ('Undisputed WWE Championship',             'smackdown',  'world',            '2026-03-06'),
  ('United States Championship',              'smackdown',  'secondary',        '2026-03-27'),
  ('WWE Tag Team Championship',               'smackdown',  'tag_team',         '2026-03-20'),
  ('WWE Women''s Championship',               'smackdown',  'womens_world',     '2025-01-01'),
  ('Women''s United States Championship',     'smackdown',  'womens_secondary', '2026-01-02'),

  -- Shared championship (cross-brand, brand is NULL)
  ('WWE Women''s Tag Team Championship',      NULL,         'tag_team',         '2026-02-27');


-- =============================================================================
-- star — current main roster (Raw and SmackDown only, NXT out of scope)
-- Backstage scores and draw scores are entered manually by creative director
-- after setup — not seeded here.
-- fan_score rows are populated by the Go Lambda pipeline — not seeded here.
-- =============================================================================

INSERT INTO star
  (name, brand, alignment, status, schedule_type, injury_risk, elevation_trajectory)
VALUES
  -- Raw roster
  ('CM Punk',           'raw',        'face',   'active',  'full_time',         20, 'stable'),
  ('Gunther',           'raw',        'heel',   'active',  'full_time',         15, 'stable'),
  ('Jey Uso',           'raw',        'face',   'active',  'full_time',         25, 'rising'),
  ('Seth Rollins',      'raw',        'heel',   'injured', 'full_time',         45, 'stable'),
  ('Penta',             'raw',        'face',   'active',  'full_time',         30, 'rising'),
  ('Roman Reigns',      'raw',        'face',   'active',  'part_time',         30, 'stable'),
  ('Bron Breakker',     'raw',        'face',   'injured', 'full_time',         50, 'rising'),
  ('Dominik Mysterio',  'raw',        'heel',   'injured', 'full_time',         40, 'falling'),
  ('Rhea Ripley',       'raw',        'face',   'active',  'full_time',         20, 'stable'),
  ('Becky Lynch',       'raw',        'face',   'active',  'full_time',         20, 'stable'),
  ('AJ Lee',            'raw',        'face',   'active',  'full_time',         25, 'rising'),
  ('Iyo Sky',           'raw',        'heel',   'active',  'full_time',         30, 'stable'),

  -- SmackDown roster
  ('Cody Rhodes',       'smackdown',  'face',   'active',  'full_time',         20, 'stable'),
  ('Drew McIntyre',     'smackdown',  'heel',   'active',  'full_time',         25, 'falling'),
  ('Jacob Fatu',        'smackdown',  'heel',   'active',  'full_time',         35, 'rising'),
  ('Sami Zayn',         'smackdown',  'face',   'active',  'full_time',         20, 'stable'),
  ('Carmelo Hayes',     'smackdown',  'heel',   'active',  'full_time',         25, 'falling'),
  ('LA Knight',         'smackdown',  'face',   'active',  'full_time',         20, 'rising'),
  ('Randy Orton',       'smackdown',  'heel',   'active',  'full_time',         30, 'rising'),
  ('Jade Cargill',      'smackdown',  'face',   'active',  'full_time',         25, 'rising'),
  ('Nia Jax',           'smackdown',  'heel',   'active',  'full_time',         30, 'stable'),
  ('Giulia',            'smackdown',  'heel',   'active',  'full_time',         20, 'rising'),

  -- Part-time and special appearance
  ('The Rock',          'raw',        'heel',   'active',  'special_appearance', 15, 'stable'),
  ('Brock Lesnar',      'raw',        'face',   'active',  'part_time',          35, 'stable');


-- =============================================================================
-- star_availability — part-time and special appearance windows
-- =============================================================================

INSERT INTO star_availability
  (star_id, available_from, available_to, max_appearances, notes)
VALUES
  -- Roman Reigns — WrestleMania 42 season
  (
    (SELECT id FROM star WHERE name = 'Roman Reigns'),
    '2026-02-01', '2026-04-30', 4,
    'WrestleMania 42 season — contract ends after WrestleMania 42'
  ),
  -- The Rock — WrestleMania 42 only
  (
    (SELECT id FROM star WHERE name = 'The Rock'),
    '2026-04-18', '2026-04-19', 1,
    'WrestleMania 42 special appearance only'
  ),
  -- Brock Lesnar — SummerSlam season
  (
    (SELECT id FROM star WHERE name = 'Brock Lesnar'),
    '2026-07-01', '2026-08-31', 3,
    'SummerSlam 2026 season'
  );