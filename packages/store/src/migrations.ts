import { sha256Hex } from "./canonical.js";
import type { Db } from "./driver.js";
import { StoreError } from "./errors.js";

export interface Migration {
  readonly version: number;
  readonly name: string;
  readonly sql: string;
}

/**
 * Append-only protection that holds for ANY connection, whatever its pragmas:
 * UPDATE and DELETE are rejected, and so is INSERT OR REPLACE (SQLite's REPLACE deletes the old row
 * without firing delete triggers unless recursive triggers are on, so a BEFORE INSERT guard is needed).
 */
const appendOnly = (table: string, keys: readonly string[]): string => `
CREATE TRIGGER ${table}_no_update BEFORE UPDATE ON ${table} BEGIN SELECT RAISE(ABORT, '${table} is append-only'); END;
CREATE TRIGGER ${table}_no_delete BEFORE DELETE ON ${table} BEGIN SELECT RAISE(ABORT, '${table} is append-only'); END;
CREATE TRIGGER ${table}_no_replace BEFORE INSERT ON ${table}
  WHEN EXISTS (SELECT 1 FROM ${table} WHERE ${keys.map((k) => `${k} = NEW.${k}`).join(" OR ")})
  BEGIN SELECT RAISE(ABORT, '${table} is append-only: no replace'); END;`;

const BOOTSTRAP_SQL = `
CREATE TABLE schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  checksum TEXT NOT NULL,
  applied_at TEXT NOT NULL
) STRICT;
${appendOnly("schema_migrations", ["version"])}`;

const INITIAL_SQL = `
CREATE TABLE runs (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL CHECK (mode = 'audit'),
  guard_mode TEXT NOT NULL CHECK (guard_mode IN ('full', 'l1_only')),
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'partial', 'aborted', 'errored')),
  terminal_reason TEXT,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  data TEXT NOT NULL CHECK (json_valid(data)),
  CHECK (
    (status = 'running' AND terminal_reason IS NULL AND ended_at IS NULL) OR
    (status = 'completed' AND terminal_reason = 'completed' AND ended_at IS NOT NULL) OR
    (status = 'partial' AND terminal_reason = 'budget_exhausted' AND ended_at IS NOT NULL) OR
    (status = 'aborted' AND terminal_reason IN ('user_abort', 'crash_detected') AND ended_at IS NOT NULL) OR
    (status = 'errored' AND terminal_reason IN
      ('guard_unavailable', 'guard_probe_failed', 'browser_failure', 'store_failure', 'internal_error')
      AND ended_at IS NOT NULL)
  )
) STRICT;
CREATE TRIGGER runs_terminal_immutable BEFORE UPDATE ON runs WHEN OLD.status <> 'running'
  BEGIN SELECT RAISE(ABORT, 'terminal runs are immutable'); END;
CREATE TRIGGER runs_no_delete BEFORE DELETE ON runs BEGIN SELECT RAISE(ABORT, 'runs are never deleted'); END;
CREATE TRIGGER runs_no_replace BEFORE INSERT ON runs WHEN EXISTS (SELECT 1 FROM runs WHERE id = NEW.id)
  BEGIN SELECT RAISE(ABORT, 'runs: no replace'); END;

CREATE TABLE evidence (
  id TEXT PRIMARY KEY CHECK (length(id) = 64),
  kind TEXT NOT NULL CHECK (kind IN ('screenshot', 'trace', 'har', 'console', 'response', 'dom', 'axe', 'download')),
  class TEXT NOT NULL CHECK (class IN ('public', 'restricted')),
  encrypted INTEGER NOT NULL CHECK (encrypted IN (0, 1)),
  redaction_status TEXT NOT NULL CHECK (redaction_status IN ('redacted', 'partially_redacted', 'not_redacted')),
  expires_at TEXT NOT NULL,
  execution_record_id TEXT NOT NULL,
  data TEXT NOT NULL CHECK (json_valid(data)),
  CHECK (class <> 'restricted' OR encrypted = 1),
  CHECK (kind NOT IN ('trace', 'download') OR (class = 'restricted' AND redaction_status = 'not_redacted')),
  CHECK (kind <> 'screenshot' OR redaction_status <> 'redacted')
) STRICT;
${appendOnly("evidence", ["id"])}

CREATE TABLE evidence_events (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  id TEXT NOT NULL UNIQUE,
  evidence_id TEXT NOT NULL REFERENCES evidence (id),
  type TEXT NOT NULL CHECK (type IN ('created', 'accessed', 'exported', 'retention_extended', 'tombstoned')),
  at TEXT NOT NULL,
  prev_hash TEXT,
  hash TEXT NOT NULL,
  data TEXT NOT NULL CHECK (json_valid(data))
) STRICT;
CREATE INDEX evidence_events_chain ON evidence_events (evidence_id, seq);
${appendOnly("evidence_events", ["seq", "id"])}

CREATE TABLE policy_decisions (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  id TEXT NOT NULL UNIQUE,
  run_id TEXT NOT NULL REFERENCES runs (id),
  subject TEXT NOT NULL CHECK (subject IN ('spec', 'request', 'profile')),
  decision TEXT NOT NULL CHECK (decision IN ('allow', 'deny')),
  action_class TEXT NOT NULL CHECK (action_class IN ('A0', 'A1', 'A2', 'A3')),
  at TEXT NOT NULL,
  prev_hash TEXT,
  hash TEXT NOT NULL,
  data TEXT NOT NULL CHECK (json_valid(data)),
  CHECK (decision <> 'allow' OR action_class IN ('A0', 'A1'))
) STRICT;
CREATE INDEX policy_decisions_chain ON policy_decisions (run_id, seq);
${appendOnly("policy_decisions", ["seq", "id"])}`;

// Migration 2: table-wide row links (AC-43). Migration 1 above must never change: its checksum is in every ledger.
// row_link chains every row of a hash-chained table to the previous row of the TABLE (not of its own chain), so removing
// a row, including a chain's last event such as a tombstone, breaks the next row's link. Rows that exist when this
// migration runs are "legacy": they are not backfilled (their link stays ''), and row_link_boundaries records, filled by
// this SQL itself, the table's AUTOINCREMENT counter (boundary_seq) and row count (legacy_rows) at that moment.
// Link format: first row after the boundary  sha256("qa-sentinel/row-link-genesis/v1\n" + table + "\n" + boundary_seq)
// is the "previous link"; every row stores sha256("qa-sentinel/row-link/v1\n" + previous stored link + "\n" + its hash).
const ROW_LINKS_SQL = `
ALTER TABLE evidence_events ADD COLUMN row_link TEXT NOT NULL DEFAULT '';
ALTER TABLE policy_decisions ADD COLUMN row_link TEXT NOT NULL DEFAULT '';
CREATE TABLE row_link_boundaries (
  table_name TEXT PRIMARY KEY CHECK (table_name IN ('evidence_events', 'policy_decisions')),
  boundary_seq INTEGER NOT NULL CHECK (boundary_seq >= 0),
  legacy_rows INTEGER NOT NULL CHECK (legacy_rows >= 0)
) STRICT;
${appendOnly("row_link_boundaries", ["table_name"])}
INSERT INTO row_link_boundaries (table_name, boundary_seq, legacy_rows) VALUES
  ('evidence_events', COALESCE((SELECT seq FROM sqlite_sequence WHERE name = 'evidence_events'), 0), (SELECT COUNT(*) FROM evidence_events)),
  ('policy_decisions', COALESCE((SELECT seq FROM sqlite_sequence WHERE name = 'policy_decisions'), 0), (SELECT COUNT(*) FROM policy_decisions));`;

export const MIGRATIONS: readonly Migration[] = [
  { version: 1, name: "initial", sql: INITIAL_SQL },
  { version: 2, name: "row_links", sql: ROW_LINKS_SQL },
];

/** Reads the ledger and refuses one that is newer than this code or was edited. Returns the applied versions. */
function checkLedger(db: Db, migrations: readonly Migration[]): Set<number> {
  const applied = db.prepare("SELECT version, checksum FROM schema_migrations ORDER BY version").all() as {
    version: number;
    checksum: string;
  }[];
  for (const a of applied) {
    const m = migrations.find((x) => x.version === a.version);
    if (!m) throw new StoreError("migration_mismatch", `the database has migration ${a.version}, which this version does not know (database is newer)`);
    if (sha256Hex(m.sql) !== a.checksum) throw new StoreError("migration_mismatch", `migration ${a.version} was changed after it was applied`);
  }
  return new Set(applied.map((a) => a.version));
}

/** Brings a database to the latest version, refusing one that was edited, is newer, or fails a migration. */
export function applyMigrations(db: Db, migrations: readonly Migration[], now: () => Date): void {
  migrations.forEach((m, i) => {
    if (m.version !== i + 1) {
      throw new StoreError("invalid_migrations", `migration versions must be 1, 2, 3, ... without gaps (got ${m.version} at position ${i + 1})`);
    }
  });
  db.transaction(() => {
    const has = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'").get();
    if (!has) db.exec(BOOTSTRAP_SQL);
  }).immediate();

  // Fast path: an up-to-date database never takes the write lock.
  const done = checkLedger(db, migrations);
  for (const m of migrations) {
    if (done.has(m.version)) continue;
    db.transaction(() => {
      // Another opener may have applied this migration since the read above, so look again under the write lock.
      if (checkLedger(db, migrations).has(m.version)) return;
      db.exec(m.sql);
      db.prepare("INSERT INTO schema_migrations (version, name, checksum, applied_at) VALUES (?, ?, ?, ?)").run(
        m.version,
        m.name,
        sha256Hex(m.sql),
        now().toISOString(),
      );
    }).immediate();
  }
}
