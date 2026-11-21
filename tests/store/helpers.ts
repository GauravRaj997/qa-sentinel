import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { evidenceSchema, runSchema, type Evidence, type Run } from "@qa-sentinel/schema";
import * as f from "../schema/factories.js";
import { openStore } from "@qa-sentinel/store";
// Internals, imported by path on purpose (not part of the package surface): a raw version-1 database is needed.
import { openDriver } from "../../packages/store/src/driver.js";
import { MIGRATIONS, applyMigrations } from "../../packages/store/src/migrations.js";

const dirs: string[] = [];
export const tmpDir = (): string => {
  const d = mkdtempSync(join(tmpdir(), "qa-store-"));
  dirs.push(d);
  return d;
};
export const dbFile = (): string => join(tmpDir(), "store.db");
export const cleanup = (): void => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
};

/** A valid running Run with a distinct id per n. */
export const makeRun = (n: number, over: Record<string, unknown> = {}): Run =>
  runSchema.parse({ ...f.validRun(), id: f.uuid(100 + n), ...over });

/** A valid Evidence row; the id (sha256) differs per hex digit. */
export const makeEvidence = (digit = "f", over: Record<string, unknown> = {}): Evidence =>
  evidenceSchema.parse({ ...f.validEvidence(), id: f.hex(digit), ...over });

export const eventInput = (evidenceId: string, type = "accessed") => ({
  evidenceId,
  type: type as "accessed",
  actor: { label: "runner", osUser: "someuser", method: "cli" },
  at: f.NOW,
});

export const decisionInput = (runId: string, rule = "non-safe-method", actionClass: "A0" | "A1" | "A2" | "A3" = "A2") => ({
  runId,
  subject: "request" as const,
  decision: "deny" as const,
  actionClass,
  rule,
  reason: "POST is not a safe method",
  at: f.NOW,
});

/**
 * A database at schema version 1 (no link column) holding 3 events and 2 decisions. Built by migrating a raw
 * connection to version 1 only, then copying rows from a scratch current-version store, because the store itself
 * only opens current-version databases.
 */
export const legacyV1Db = () => {
  const src = legacySource();
  const p = dbFile();
  const db = openDriver(p, 1000);
  applyMigrations(db, [MIGRATIONS[0]!], () => new Date("2026-11-17T10:00:00.000Z"));
  db.exec(`ATTACH DATABASE '${src.p}' AS src;
    INSERT INTO runs SELECT * FROM src.runs;
    INSERT INTO evidence SELECT * FROM src.evidence;
    INSERT INTO evidence_events (id, evidence_id, type, at, prev_hash, hash, data) SELECT id, evidence_id, type, at, prev_hash, hash, data FROM src.evidence_events ORDER BY seq;
    INSERT INTO policy_decisions (id, run_id, subject, decision, action_class, at, prev_hash, hash, data) SELECT id, run_id, subject, decision, action_class, at, prev_hash, hash, data FROM src.policy_decisions ORDER BY seq;`);
  db.exec("DETACH DATABASE src");
  db.close();
  return { p, a: src.a, b: src.b, run: src.run };
};
const legacySource = () => {
  const p = dbFile();
  const s = openStore(p);
  const a = makeEvidence("a");
  const b = makeEvidence("b");
  const run = makeRun(1);
  s.insertEvidence(a);
  s.insertEvidence(b);
  s.insertRun(run);
  s.appendEvidenceEvent(eventInput(a.id));
  s.appendEvidenceEvent(eventInput(b.id));
  s.appendEvidenceEvent(eventInput(a.id));
  s.appendPolicyDecision(decisionInput(run.id, "r1", "A1"));
  s.appendPolicyDecision(decisionInput(run.id, "r2", "A1"));
  s.close();
  return { p, a, b, run };
};
