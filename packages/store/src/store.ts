import { randomUUID } from "node:crypto";
import {
  SCHEMA_VERSION,
  evidenceEventSchema,
  evidenceSchema,
  policyDecisionSchema,
  runSchema,
  type Evidence,
  type EvidenceEvent,
  type PolicyDecision,
  type Run,
} from "@qa-sentinel/schema";
import { canonicalJson, sha256Hex } from "./canonical.js";
import { openDriver, type Db, type Statement } from "./driver.js";
import { StoreError } from "./errors.js";
import { MIGRATIONS, applyMigrations, type Migration } from "./migrations.js";

export interface StoreOptions {
  /** How long a write waits for another writer before SQLITE_BUSY. Default 5000 ms. */
  busyTimeoutMs?: number;
  /** Injectable clock, for tests. */
  now?: () => Date;
  /** Test hook: replaces the built-in migration list. */
  migrations?: readonly Migration[];
}

export type RunOutcome = Pick<Run, "status" | "terminalReason" | "endedAt">;
type Generated = "id" | "schemaVersion" | "createdAt" | "prevHash" | "hash";
export type NewEvidenceEvent = Omit<EvidenceEvent, Generated>;
export type NewPolicyDecision = Omit<PolicyDecision, Generated>;

export interface ChainProblem {
  table: "evidence_events" | "policy_decisions";
  seq: number | null;
  chain: string | null;
  problem: "prev_hash_mismatch" | "hash_mismatch" | "column_mismatch" | "invalid_record" | "rows_missing_at_end";
}
export interface SchemaProblem {
  object: string;
  type: string;
  problem: "missing" | "altered" | "unexpected";
}

export interface Store {
  readonly path: string;
  insertRun(run: Run): void;
  getRun(id: string): Run | undefined;
  finishRun(id: string, outcome: RunOutcome): Run;
  /** Marks every run still `running` as aborted/crash_detected. Call only at start-up, when no run is active. */
  recoverCrashedRuns(endedAt?: string): string[];
  insertEvidence(evidence: Evidence): void;
  getEvidence(id: string): Evidence | undefined;
  appendEvidenceEvent(input: NewEvidenceEvent): EvidenceEvent;
  listEvidenceEvents(evidenceId: string): EvidenceEvent[];
  appendPolicyDecision(input: NewPolicyDecision): PolicyDecision;
  listPolicyDecisions(runId: string): PolicyDecision[];
  /** Re-reads every chained row and checks links, hashes and columns. A removed last row is detected only
   *  through the AUTOINCREMENT counter; nothing outside the database anchors the chain, so a same-user
   *  attacker who rewrites everything consistently is not detected (GR-23 is not claimed). */
  verifyChains(): ChainProblem[];
  /** Compares the live tables, triggers and indexes with a freshly migrated database. */
  verifySchema(): SchemaProblem[];
  diagnostics(): { journalMode: string; foreignKeys: boolean; recursiveTriggers: boolean; schemaVersion: number };
  close(): void;
}

const CHAINS = [
  { table: "evidence_events", col: "evidence_id", field: "evidenceId", schema: evidenceEventSchema },
  { table: "policy_decisions", col: "run_id", field: "runId", schema: policyDecisionSchema },
] as const;

const parseRun = (text: string): Run => runSchema.parse(JSON.parse(text));
const dataOf = (row: unknown): string => (row as { data: string }).data;

function schemaObjects(db: Db): Map<string, { object: string; type: string; sql: string }> {
  const rows = db
    .prepare("SELECT type, name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND sql IS NOT NULL")
    .all() as { type: string; name: string; sql: string }[];
  return new Map(rows.map((r) => [`${r.type}:${r.name}`, { object: r.name, type: r.type, sql: r.sql }]));
}

export function openStore(path: string, options: StoreOptions = {}): Store {
  const now = options.now ?? (() => new Date());
  const migrations = options.migrations ?? MIGRATIONS;
  const db = openDriver(path, options.busyTimeoutMs ?? 5000);
  try {
    applyMigrations(db, migrations, now);
  } catch (e) {
    db.close();
    throw e;
  }

  const insertRunRow = db.prepare(
    "INSERT INTO runs (id, mode, guard_mode, status, terminal_reason, started_at, ended_at, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  );
  const selectRun = db.prepare("SELECT data FROM runs WHERE id = ?");
  const updateRun = db.prepare("UPDATE runs SET status = ?, terminal_reason = ?, ended_at = ?, data = ? WHERE id = ?");
  const selectRunning = db.prepare("SELECT data FROM runs WHERE status = 'running' ORDER BY started_at, id");
  const insertEvidenceRow = db.prepare(
    "INSERT INTO evidence (id, kind, class, encrypted, redaction_status, expires_at, execution_record_id, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  );
  const selectEvidence = db.prepare("SELECT data FROM evidence WHERE id = ?");
  const insertEventRow = db.prepare(
    "INSERT INTO evidence_events (id, evidence_id, type, at, prev_hash, hash, data) VALUES (?, ?, ?, ?, ?, ?, ?)",
  );
  const insertDecisionRow = db.prepare(
    "INSERT INTO policy_decisions (id, run_id, subject, decision, action_class, at, prev_hash, hash, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  );
  const headEvent = db.prepare("SELECT hash FROM evidence_events WHERE evidence_id = ? ORDER BY seq DESC LIMIT 1");
  const headDecision = db.prepare("SELECT hash FROM policy_decisions WHERE run_id = ? ORDER BY seq DESC LIMIT 1");
  const listEvents = db.prepare("SELECT data FROM evidence_events WHERE evidence_id = ? ORDER BY seq");
  const listDecisions = db.prepare("SELECT data FROM policy_decisions WHERE run_id = ? ORDER BY seq");

  const headOf = (stmt: Statement, key: string): string | null => (stmt.get(key) as { hash: string } | undefined)?.hash ?? null;
  const toIso = (): string => now().toISOString();

  return {
    path,

    insertRun(input) {
      const run = runSchema.parse(input);
      if (run.status !== "running") throw new StoreError("invalid_record", "a run is created in status running");
      insertRunRow.run(run.id, run.mode, run.guardMode, run.status, null, run.startedAt, null, JSON.stringify(run));
    },

    getRun(id) {
      const row = selectRun.get(id);
      return row === undefined ? undefined : parseRun(dataOf(row));
    },

    finishRun(id, outcome) {
      if (outcome.status === "running") throw new StoreError("invalid_record", "finishRun needs a terminal status");
      return db
        .transaction(() => {
          const row = selectRun.get(id);
          if (row === undefined) throw new StoreError("not_found", `no run ${id}`);
          const run = parseRun(dataOf(row));
          if (run.status !== "running") throw new StoreError("invalid_transition", `run ${id} is already ${run.status}`);
          const next = runSchema.parse({ ...run, ...outcome });
          updateRun.run(next.status, next.terminalReason ?? null, next.endedAt ?? null, JSON.stringify(next), id);
          return next;
        })
        .immediate();
    },

    recoverCrashedRuns(endedAt = toIso()) {
      return db
        .transaction(() => {
          const recovered: string[] = [];
          for (const row of selectRunning.all()) {
            const run = parseRun(dataOf(row));
            const next = runSchema.parse({ ...run, status: "aborted", terminalReason: "crash_detected", endedAt });
            updateRun.run(next.status, next.terminalReason ?? null, next.endedAt ?? null, JSON.stringify(next), next.id);
            recovered.push(next.id);
          }
          return recovered;
        })
        .immediate();
    },

    insertEvidence(input) {
      const e = evidenceSchema.parse(input);
      insertEvidenceRow.run(e.id, e.kind, e.class, e.encrypted ? 1 : 0, e.redactionStatus, e.expiresAt, e.executionRecordId, JSON.stringify(e));
    },

    getEvidence(id) {
      const row = selectEvidence.get(id);
      return row === undefined ? undefined : evidenceSchema.parse(JSON.parse(dataOf(row)));
    },

    appendEvidenceEvent(input) {
      return db
        .transaction(() => {
          const base = { ...input, id: randomUUID(), schemaVersion: SCHEMA_VERSION, createdAt: toIso(), prevHash: headOf(headEvent, input.evidenceId) };
          const full = evidenceEventSchema.parse({ ...base, hash: sha256Hex(canonicalJson(base)) });
          insertEventRow.run(full.id, full.evidenceId, full.type, full.at, full.prevHash, full.hash, JSON.stringify(full));
          return full;
        })
        .immediate();
    },

    listEvidenceEvents: (evidenceId) => listEvents.all(evidenceId).map((r) => evidenceEventSchema.parse(JSON.parse(dataOf(r)))),

    appendPolicyDecision(input) {
      return db
        .transaction(() => {
          const base = { ...input, id: randomUUID(), schemaVersion: SCHEMA_VERSION, createdAt: toIso(), prevHash: headOf(headDecision, input.runId) };
          const full = policyDecisionSchema.parse({ ...base, hash: sha256Hex(canonicalJson(base)) });
          insertDecisionRow.run(full.id, full.runId, full.subject, full.decision, full.actionClass, full.at, full.prevHash, full.hash, JSON.stringify(full));
          return full;
        })
        .immediate();
    },

    listPolicyDecisions: (runId) => listDecisions.all(runId).map((r) => policyDecisionSchema.parse(JSON.parse(dataOf(r)))),

    verifyChains() {
      const problems: ChainProblem[] = [];
      for (const { table, col, field, schema } of CHAINS) {
        const rows = db
          .prepare(`SELECT seq, ${col} AS chain, prev_hash, hash, data FROM ${table} ORDER BY ${col}, seq`)
          .all() as { seq: number; chain: string; prev_hash: string | null; hash: string; data: string }[];
        let currentChain: string | null = null;
        let expectedPrev: string | null = null;
        for (const row of rows) {
          if (row.chain !== currentChain) {
            currentChain = row.chain;
            expectedPrev = null;
          }
          const report = (problem: ChainProblem["problem"]): void => void problems.push({ table, seq: row.seq, chain: row.chain, problem });
          let rec: Record<string, unknown>;
          try {
            rec = schema.parse(JSON.parse(row.data)) as Record<string, unknown>;
          } catch {
            report("invalid_record");
            expectedPrev = row.hash;
            continue;
          }
          if (row.hash !== rec["hash"] || row.prev_hash !== rec["prevHash"] || row.chain !== rec[field]) report("column_mismatch");
          if (rec["prevHash"] !== expectedPrev) report("prev_hash_mismatch");
          const { hash, ...rest } = rec;
          if (sha256Hex(canonicalJson(rest)) !== hash) report("hash_mismatch");
          expectedPrev = typeof hash === "string" ? hash : row.hash;
        }
        // AUTOINCREMENT never reuses a number, so a counter above the highest row means rows were removed at the end.
        const counter = db.prepare("SELECT seq FROM sqlite_sequence WHERE name = ?").get(table) as { seq: number } | undefined;
        const max = db.prepare(`SELECT max(seq) AS m FROM ${table}`).get() as { m: number | null };
        if (counter !== undefined && counter.seq > (max.m ?? 0)) problems.push({ table, seq: null, chain: null, problem: "rows_missing_at_end" });
      }
      return problems;
    },

    verifySchema() {
      const fresh = openDriver(":memory:", 0);
      let expected: ReturnType<typeof schemaObjects>;
      try {
        applyMigrations(fresh, migrations, now);
        expected = schemaObjects(fresh);
      } finally {
        fresh.close();
      }
      const live = schemaObjects(db);
      const problems: SchemaProblem[] = [];
      for (const [key, want] of expected) {
        const have = live.get(key);
        if (have === undefined) problems.push({ object: want.object, type: want.type, problem: "missing" });
        else if (have.sql !== want.sql) problems.push({ object: want.object, type: want.type, problem: "altered" });
      }
      for (const [key, have] of live) {
        if (!expected.has(key)) problems.push({ object: have.object, type: have.type, problem: "unexpected" });
      }
      return problems;
    },

    diagnostics() {
      const version = db.prepare("SELECT max(version) AS v FROM schema_migrations").get() as { v: number };
      return {
        journalMode: String(db.pragma("journal_mode", { simple: true })),
        foreignKeys: db.pragma("foreign_keys", { simple: true }) === 1,
        recursiveTriggers: db.pragma("recursive_triggers", { simple: true }) === 1,
        schemaVersion: version.v,
      };
    },

    close() {
      db.close();
    },
  };
}
