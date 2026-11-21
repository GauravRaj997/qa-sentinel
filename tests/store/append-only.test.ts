import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import { openStore } from "@qa-sentinel/store";
import * as f from "../schema/factories.js";
import { cleanup, dbFile, decisionInput, eventInput, makeEvidence, makeRun } from "./helpers.js";

afterEach(cleanup);

/** A store file with one row in every table, then closed. Raw connections below use DEFAULT pragmas,
 *  so these tests prove the schema protects itself and does not rely on the store's own settings. */
const seeded = (): string => {
  const p = dbFile();
  const s = openStore(p);
  const run = makeRun(1);
  s.insertRun(run);
  const ev = makeEvidence();
  s.insertEvidence(ev);
  s.appendEvidenceEvent(eventInput(ev.id));
  s.appendPolicyDecision(decisionInput(run.id));
  s.close();
  return p;
};
const codeOf = (db: Database, sql: string, ...params: unknown[]): string => {
  try {
    db.prepare(sql).run(...params);
  } catch (e) {
    return (e as { code: string }).code;
  }
  return "no error";
};
const count = (db: Database, table: string): unknown => db.prepare(`select count(*) c from ${table}`).get();
const TRIGGER = "SQLITE_CONSTRAINT_TRIGGER";
const CHECK = "SQLITE_CONSTRAINT_CHECK";

describe.each([
  ["evidence", "kind = 'dom'"],
  ["evidence_events", "type = 'created'"],
  ["policy_decisions", "subject = 'spec'"],
  ["schema_migrations", "name = 'changed'"],
  ["row_link_boundaries", "boundary_seq = 99"],
])("%s is append-only for any connection", (table, set) => {
  it("rejects UPDATE, DELETE, INSERT OR REPLACE and REPLACE INTO, and keeps its rows", () => {
    const db = new Database(seeded());
    const before = db.prepare(`select * from ${table}`).all();
    expect(codeOf(db, `update ${table} set ${set}`)).toBe(TRIGGER);
    expect(codeOf(db, `delete from ${table}`)).toBe(TRIGGER);
    expect(codeOf(db, `insert or replace into ${table} select * from ${table}`)).toBe(TRIGGER);
    expect(codeOf(db, `replace into ${table} select * from ${table}`)).toBe(TRIGGER);
    expect(db.prepare(`select * from ${table}`).all()).toEqual(before);
    db.close();
  });
});

describe("runs", () => {
  const insertRaw = `insert into runs (id, mode, guard_mode, status, terminal_reason, started_at, ended_at, data)
                     values (?, ?, ?, ?, ?, ?, ?, '{}')`;
  it("cannot be deleted or replaced, and a running run can still be updated", () => {
    const db = new Database(seeded());
    expect(codeOf(db, "delete from runs")).toBe(TRIGGER);
    expect(codeOf(db, "insert or replace into runs select * from runs")).toBe(TRIGGER);
    expect(codeOf(db, "update runs set data = '{}'")).toBe("no error");
    db.close();
  });
  it("accepts only audit mode and only consistent status, reason and end time", () => {
    const db = new Database(seeded());
    const t = f.NOW;
    expect(codeOf(db, insertRaw, f.uuid(1), "authorized", "full", "running", null, t, null)).toBe(CHECK);
    expect(codeOf(db, insertRaw, f.uuid(2), "audit", "none", "running", null, t, null)).toBe(CHECK);
    expect(codeOf(db, insertRaw, f.uuid(3), "audit", "full", "running", "completed", t, null)).toBe(CHECK);
    expect(codeOf(db, insertRaw, f.uuid(4), "audit", "full", "completed", "budget_exhausted", t, t)).toBe(CHECK);
    expect(codeOf(db, insertRaw, f.uuid(5), "audit", "full", "completed", "completed", t, null)).toBe(CHECK);
    expect(codeOf(db, insertRaw, f.uuid(6), "audit", "full", "errored", "user_abort", t, t)).toBe(CHECK);
    expect(codeOf(db, insertRaw, f.uuid(7), "audit", "full", "aborted", "crash_detected", t, t)).toBe("no error");
    db.close();
  });
});

// Terminal runs are immutable (AC-47, store level). Two kinds of case are kept apart on purpose:
//  A. changes that also violate a table CHECK. They show what the CHECKs do on their own and say nothing about the trigger.
//  B. changes that satisfy every CHECK, so only runs_terminal_immutable can stop them. Each B case is proven on a
//     disposable comparison database with the trigger dropped (the change succeeds) and then on the normal database
//     (the same change fails with the trigger's own error and leaves the row unchanged).
// Every case is a separate test, so one failing assertion cannot hide another.
describe("terminal runs: what the CHECKs reject, and what only the trigger rejects", () => {
  const END = "2026-11-17T10:05:00.000Z";
  const C = makeRun(1).id; // finished as completed
  const D = makeRun(2).id; // finished as aborted / user_abort
  const terminalDb = (): string => {
    const p = dbFile();
    const s = openStore(p);
    s.insertRun(makeRun(1));
    s.insertRun(makeRun(2));
    s.finishRun(C, { status: "completed", terminalReason: "completed", endedAt: END });
    s.finishRun(D, { status: "aborted", terminalReason: "user_abort", endedAt: END });
    s.close();
    return p;
  };
  // "if exists": the comparison database must still be built when the trigger is missing from the schema, so that a
  // missing trigger fails the assertion on the normal database and not this setup step.
  const withoutTrigger = (): Database => {
    const db = new Database(terminalDb());
    db.exec("drop trigger if exists runs_terminal_immutable");
    return db;
  };
  const rowOf = (db: Database, id: string): Record<string, unknown> =>
    db.prepare("select * from runs where id = ?").get(id) as Record<string, unknown>;

  const CHECK_INVALID: [string, string][] = [
    ["status errored while terminal_reason stays completed", "update runs set status = 'errored' where id = ?"],
    ["ended_at removed from a terminal run", "update runs set ended_at = null where id = ?"],
  ];
  it.each(CHECK_INVALID)("A1 (trigger dropped): the CHECK rejects: %s", (_name, sql) => {
    const db = withoutTrigger();
    expect(codeOf(db, sql, C)).toBe(CHECK);
    db.close();
  });
  it.each(CHECK_INVALID)("A2 (normal database): rejected by some constraint, row unchanged (defence in depth, not trigger proof): %s", (_name, sql) => {
    const db = new Database(terminalDb());
    const before = rowOf(db, C);
    expect([TRIGGER, CHECK]).toContain(codeOf(db, sql, C));
    expect(rowOf(db, C)).toEqual(before);
    db.close();
  });

  // [name, run to change, statement, columns expected to differ afterwards]. Every statement satisfies all CHECKs.
  const TRIGGER_ONLY: [string, string, string, Record<string, unknown>][] = [
    ["status and reason flipped consistently (completed to aborted/user_abort)", C,
      "update runs set status = 'aborted', terminal_reason = 'user_abort' where id = ?", { status: "aborted", terminal_reason: "user_abort" }],
    ["terminal_reason changed within aborted (user_abort to crash_detected)", D,
      "update runs set terminal_reason = 'crash_detected' where id = ?", { terminal_reason: "crash_detected" }],
    ["ended_at changed", C, "update runs set ended_at = '2026-11-17T10:06:00.000Z' where id = ?", { ended_at: "2026-11-17T10:06:00.000Z" }],
    ["no-op status write", C, "update runs set status = status where id = ?", {}],
    ["data rewritten", C, "update runs set data = '{}' where id = ?", { data: "{}" }],
  ];
  it.each(TRIGGER_ONLY)("B: only the trigger stops: %s", (_name, id, sql, changed) => {
    // Comparison database, trigger dropped: the change must succeed, so no CHECK or other trigger is in the way.
    const cmp = withoutTrigger();
    const pre = rowOf(cmp, id);
    expect(cmp.prepare(sql).run(id).changes).toBe(1);
    expect(rowOf(cmp, id)).toEqual({ ...pre, ...changed });
    cmp.close();
    // Normal database: the same change fails with the trigger's own error and the row is untouched.
    const db = new Database(terminalDb());
    const before = rowOf(db, id);
    expect(codeOf(db, sql, id)).toBe(TRIGGER);
    expect(rowOf(db, id)).toEqual(before);
    db.close();
  });
});

describe("evidence and decisions: audit-only and labelling rules in the schema", () => {
  const insertEvidence = `insert into evidence (id, kind, class, encrypted, redaction_status, expires_at, execution_record_id, data)
                          values (?, ?, ?, ?, ?, ?, ?, '{}')`;
  it("rejects restricted evidence that is not encrypted", () => {
    const db = new Database(seeded());
    const args = (id: string, kind: string, cls: string, enc: number, red: string) =>
      [id, kind, cls, enc, red, f.NOW, f.uuid(5)] as const;
    expect(codeOf(db, insertEvidence, ...args(f.hex("1"), "console", "restricted", 0, "redacted"))).toBe(CHECK);
    expect(codeOf(db, insertEvidence, ...args(f.hex("2"), "trace", "public", 0, "not_redacted"))).toBe(CHECK);
    expect(codeOf(db, insertEvidence, ...args(f.hex("3"), "trace", "restricted", 1, "redacted"))).toBe(CHECK);
    expect(codeOf(db, insertEvidence, ...args(f.hex("4"), "screenshot", "public", 0, "redacted"))).toBe(CHECK);
    expect(codeOf(db, insertEvidence, ...args("short", "console", "public", 0, "redacted"))).toBe(CHECK);
    expect(codeOf(db, insertEvidence, ...args(f.hex("5"), "trace", "restricted", 1, "not_redacted"))).toBe("no error");
    db.close();
  });
  it("rejects an allow decision for A2 or A3", () => {
    const db = new Database(seeded());
    const ins = `insert into policy_decisions (id, run_id, subject, decision, action_class, at, prev_hash, hash, data)
                 values (?, ?, 'request', ?, ?, ?, null, ?, '{}')`;
    expect(codeOf(db, ins, f.uuid(40), makeRun(1).id, "allow", "A2", f.NOW, f.hex("a"))).toBe(CHECK);
    expect(codeOf(db, ins, f.uuid(41), makeRun(1).id, "allow", "A3", f.NOW, f.hex("a"))).toBe(CHECK);
    expect(codeOf(db, ins, f.uuid(42), makeRun(1).id, "allow", "A1", f.NOW, f.hex("a"))).toBe("no error");
    expect(count(db, "policy_decisions")).toEqual({ c: 2 });
    db.close();
  });
});
