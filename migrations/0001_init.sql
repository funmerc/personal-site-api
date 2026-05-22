-- Migration: 0001_init
-- Initial schema for personal-site-api.
--
-- Two domains:
--   1. content_entries (projects/demos/notes) + tag/tech junctions
--   2. profile singletons (about, status, education, work, uses)

PRAGMA foreign_keys = ON;

-- =========================================================================
-- Content: projects, demos, notes (single discriminated table)
-- =========================================================================

CREATE TABLE content_entries (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  kind            TEXT    NOT NULL CHECK (kind IN ('project', 'demo', 'note')),
  slug            TEXT    NOT NULL,
  title           TEXT    NOT NULL,
  summary         TEXT    NOT NULL,
  body            TEXT,
  date            TEXT    NOT NULL,  -- ISO YYYY-MM-DD
  status          TEXT    NOT NULL CHECK (status IN ('draft', 'published')),
  cover           TEXT,

  -- project-only
  role            TEXT    CHECK (role IN ('solo', 'lead', 'contributor')),
  period          TEXT,
  featured        INTEGER CHECK (featured IN (0, 1)),

  -- demo-only
  embed           TEXT,

  -- note-only
  reading_minutes INTEGER,

  -- links (fixed set per type per types.ts)
  link_live       TEXT,
  link_repo       TEXT,
  link_demo       TEXT,

  created_at      INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at      INTEGER NOT NULL DEFAULT (unixepoch()),

  UNIQUE (kind, slug)
);

CREATE INDEX idx_content_kind_status_date
  ON content_entries (kind, status, date DESC);

CREATE INDEX idx_content_status_date
  ON content_entries (status, date DESC);

CREATE INDEX idx_content_featured
  ON content_entries (kind, featured)
  WHERE featured = 1;

-- Tags (topical: 'ai', 'opinions', 'embed', ...)
CREATE TABLE tags (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT    NOT NULL UNIQUE
);

CREATE TABLE entry_tags (
  entry_id INTEGER NOT NULL REFERENCES content_entries(id) ON DELETE CASCADE,
  tag_id   INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (entry_id, tag_id)
);

CREATE INDEX idx_entry_tags_tag ON entry_tags (tag_id);

-- Tech (languages/frameworks: 'TypeScript', 'Vue 3', ...)
CREATE TABLE tech (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT    NOT NULL UNIQUE
);

CREATE TABLE entry_tech (
  entry_id INTEGER NOT NULL REFERENCES content_entries(id) ON DELETE CASCADE,
  tech_id  INTEGER NOT NULL REFERENCES tech(id) ON DELETE CASCADE,
  PRIMARY KEY (entry_id, tech_id)
);

CREATE INDEX idx_entry_tech_tech ON entry_tech (tech_id);

-- =========================================================================
-- About (single row + ordered child lists)
-- =========================================================================

CREATE TABLE about (
  id         INTEGER PRIMARY KEY CHECK (id = 1),
  why        TEXT    NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE about_interests (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  value    TEXT    NOT NULL,
  position INTEGER NOT NULL
);

CREATE INDEX idx_about_interests_position ON about_interests (position);

CREATE TABLE about_goals (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  value    TEXT    NOT NULL,
  position INTEGER NOT NULL
);

CREATE INDEX idx_about_goals_position ON about_goals (position);

-- =========================================================================
-- Status (single row, three fields)
-- =========================================================================

CREATE TABLE status (
  id         INTEGER PRIMARY KEY CHECK (id = 1),
  currently  TEXT    NOT NULL,
  next       TEXT    NOT NULL,
  future     TEXT    NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- =========================================================================
-- Education
-- =========================================================================

CREATE TABLE education (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT    NOT NULL,
  graduation_date TEXT    NOT NULL,
  degree_title    TEXT    NOT NULL,
  position        INTEGER NOT NULL
);

CREATE INDEX idx_education_position ON education (position);

CREATE TABLE education_coursework (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  education_id INTEGER NOT NULL REFERENCES education(id) ON DELETE CASCADE,
  value        TEXT    NOT NULL,
  position     INTEGER NOT NULL
);

CREATE INDEX idx_education_coursework_parent
  ON education_coursework (education_id, position);

-- =========================================================================
-- Work experience (three-level nesting: role -> section -> values)
-- =========================================================================

CREATE TABLE work_experience (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  company_title   TEXT    NOT NULL,
  work_date_range TEXT    NOT NULL,
  job_title       TEXT    NOT NULL,
  job_location    TEXT    NOT NULL,
  position        INTEGER NOT NULL
);

CREATE INDEX idx_work_experience_position ON work_experience (position);

CREATE TABLE work_sections (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  work_id  INTEGER NOT NULL REFERENCES work_experience(id) ON DELETE CASCADE,
  label    TEXT    NOT NULL,
  position INTEGER NOT NULL
);

CREATE INDEX idx_work_sections_parent ON work_sections (work_id, position);

CREATE TABLE work_section_values (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  section_id INTEGER NOT NULL REFERENCES work_sections(id) ON DELETE CASCADE,
  value      TEXT    NOT NULL,
  position   INTEGER NOT NULL
);

CREATE INDEX idx_work_section_values_parent
  ON work_section_values (section_id, position);

-- =========================================================================
-- Uses
-- =========================================================================

CREATE TABLE uses_sections (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  label    TEXT    NOT NULL,
  position INTEGER NOT NULL
);

CREATE INDEX idx_uses_sections_position ON uses_sections (position);

CREATE TABLE uses_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  section_id INTEGER NOT NULL REFERENCES uses_sections(id) ON DELETE CASCADE,
  value      TEXT    NOT NULL,
  position   INTEGER NOT NULL
);

CREATE INDEX idx_uses_items_parent ON uses_items (section_id, position);
