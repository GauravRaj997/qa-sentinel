import { spawnSync } from "node:child_process";
import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import { StoreError, canonicalJson, openStore, sha256Hex, type Store } from "@qa-sentinel/store";
import * as f from "../schema/factories.js";
import { cleanup, dbFile, decisionInput, eventInput, makeEvidence, makeRun } from "./helpers.js";

afterEach(cleanup);

const END = "2026-11-17T10:05:00.000Z";
const codeOf = (fn: () => unknown): string | undefined => {
  try {
    fn();
  } catch (e) {
    return e instanceof StoreError ? e.code : `other:${(e as Error).message}`;
  }
  return undefined;
};
const tamper = (path: string, sql: string): void => {
  const d = new Database(path);
  try {
    d.exec(sql);
  } finally {
    d.close();
  }
};
const withEvidence = (s: Store, digit = "f") => {
  const ev = makeEvidence(digit);
  s.insertEvidence(ev);
  return ev;
};

describe("run lifecycle", () => {
  it("stores a running run and reads it back unchanged", () => {
    const s = openStore(dbFile());
    const run = makeRun(1);
    s.insertRun(run);
    expect(s.getRun(run.id)).toEqual(run);
    expect(s.getRun(f.uuid(999))).toBeUndefined();
    s.close();
  });
  it("accepts only running runs at creation", () => {
    const s = openStore(dbFile());
    const done = makeRun(1, { status: "completed", terminalReason: "completed", endedAt: END });
    expect(codeOf(() => s.insertRun(done))).toBe("invalid_record");
    s.close();
  });
  it("moves a run to exactly one terminal status", () => {
    const s = openStore(dbFile());
    const run = makeRun(1);
    s.insertRun(run);
    const done = s.finishRun(run.id, { status: "completed", terminalReason: "completed", endedAt: END });
    expect(done).toMatchObject({ status: "completed", terminalReason: "completed", endedAt: END });
    expect(s.getRun(run.id)).toEqual(done);
    expect(codeOf(() => s.finishRun(run.id, { status: "errored", terminalReason: "internal_error", endedAt: END }))).toBe("invalid_transition");
    expect(s.getRun(run.id)?.status).toBe("completed");
    s.close();
  });
  it("rejects an unknown run, a non-terminal outcome and an inconsistent reason", () => {
    const s = openStore(dbFile());
    const run = makeRun(1);
    s.insertRun(run);
    expect(codeOf(() => s.finishRun(f.uuid(999), { status: "completed", terminalReason: "completed", endedAt: END }))).toBe("not_found");
    expect(() => s.finishRun(run.id, { status: "running", terminalReason: undefined, endedAt: undefined })).toThrow();
    expect(() => s.finishRun(run.id, { status: "completed", terminalReason: "budget_exhausted", endedAt: END })).toThrow();
    expect(s.getRun(run.id)?.status).toBe("running");
    s.close();
  });
});

describe("crash recovery (store level only: no runner exists yet)", () => {
  it("marks a run left running by a killed process as aborted / crash_detected, once", () => {
    const p = dbFile();
    const s = openStore(p);
    const crashed = makeRun(1);
    const finished = makeRun(2);
    s.insertRun(crashed);
    s.insertRun(finished);
    s.finishRun(finished.id, { status: "completed", terminalReason: "completed", endedAt: END });
    s.close();

    const child = spawnSync(process.execPath, [new URL("./crash-child.mjs", import.meta.url).pathname, p]);
    expect(child.signal).toBe("SIGKILL");

    const s2 = openStore(p, { now: () => new Date("2026-11-17T11:00:00.000Z") });
    expect(s2.getRun(crashed.id)).toEqual(crashed); // the uncommitted write is gone, the run still says running
    expect(s2.recoverCrashedRuns()).toEqual([crashed.id]);
    expect(s2.getRun(crashed.id)).toMatchObject({ status: "aborted", terminalReason: "crash_detected", endedAt: "2026-11-17T11:00:00.000Z" });
    expect(s2.getRun(finished.id)?.status).toBe("completed");
    expect(s2.recoverCrashedRuns()).toEqual([]);
    expect(codeOf(() => s2.finishRun(crashed.id, { status: "completed", terminalReason: "completed", endedAt: END }))).toBe("invalid_transition");
    expect(s2.verifyChains()).toEqual([]);
    s2.close();
  });
});

describe("hash chains", () => {
  it("links each event to the previous one and hashes the canonical record", () => {
    const s = openStore(dbFile());
    const ev = withEvidence(s);
    const a = s.appendEvidenceEvent(eventInput(ev.id, "created"));
    const b = s.appendEvidenceEvent(eventInput(ev.id, "accessed"));
    expect(a.prevHash).toBeNull();
    expect(b.prevHash).toBe(a.hash);
    const { hash, ...rest } = b;
    expect(hash).toBe(sha256Hex(canonicalJson(rest)));
    expect(s.listEvidenceEvents(ev.id)).toEqual([a, b]);
    s.close();
  });
  it("keeps one independent chain per evidence item and per run", () => {
    const s = openStore(dbFile());
    const e1 = withEvidence(s, "1");
    const e2 = withEvidence(s, "2");
    s.appendEvidenceEvent(eventInput(e1.id));
    expect(s.appendEvidenceEvent(eventInput(e2.id)).prevHash).toBeNull();
    const r1 = makeRun(1);
    const r2 = makeRun(2);
    s.insertRun(r1);
    s.insertRun(r2);
    const d1 = s.appendPolicyDecision(decisionInput(r1.id));
    expect(s.appendPolicyDecision(decisionInput(r2.id)).prevHash).toBeNull();
    expect(s.appendPolicyDecision(decisionInput(r1.id, "second")).prevHash).toBe(d1.hash);
    expect(s.listPolicyDecisions(r1.id)).toHaveLength(2);
    expect(s.verifyChains()).toEqual([]);
    s.close();
  });
  it("stays valid when two connections append to the same chain alternately", () => {
    const p = dbFile();
    const s1 = openStore(p);
    const ev = withEvidence(s1);
    const s2 = openStore(p);
    for (let i = 0; i < 3; i++) {
      s1.appendEvidenceEvent(eventInput(ev.id));
      s2.appendEvidenceEvent(eventInput(ev.id));
    }
    expect(s1.listEvidenceEvents(ev.id)).toHaveLength(6);
    expect(s1.verifyChains()).toEqual([]);
    s1.close();
    s2.close();
  });
  it("does not report a false problem after a failed append", () => {
    const s = openStore(dbFile());
    const ev = withEvidence(s);
    s.appendEvidenceEvent(eventInput(ev.id));
    expect(() => s.appendEvidenceEvent(eventInput(f.hex("9")))).toThrow();
    s.appendEvidenceEvent(eventInput(ev.id));
    expect(s.verifyChains()).toEqual([]);
    s.close();
  });

  const seededChain = () => {
    const p = dbFile();
    const s = openStore(p);
    const ev = withEvidence(s);
    for (let i = 0; i < 3; i++) s.appendEvidenceEvent(eventInput(ev.id));
    return { p, s };
  };
  const dropGuards = "drop trigger evidence_events_no_update; drop trigger evidence_events_no_delete;";
  it("detects an edited record", () => {
    const { p, s } = seededChain();
    // actor.label has no column of its own, so this isolates the hash check from the column check.
    tamper(p, `${dropGuards} update evidence_events set data = replace(data, '"label":"runner"', '"label":"intruder"') where seq = 2`);
    expect(s.verifyChains()).toEqual([expect.objectContaining({ table: "evidence_events", seq: 2, problem: "hash_mismatch" })]);
    s.close();
  });
  it("detects a removed middle row", () => {
    const { p, s } = seededChain();
    tamper(p, `${dropGuards} delete from evidence_events where seq = 2`);
    expect(s.verifyChains()).toEqual([expect.objectContaining({ seq: 3, problem: "prev_hash_mismatch" })]);
    s.close();
  });
  it("detects a removed last row", () => {
    const { p, s } = seededChain();
    tamper(p, `${dropGuards} delete from evidence_events where seq = 3`);
    expect(s.verifyChains()).toEqual([expect.objectContaining({ table: "evidence_events", problem: "rows_missing_at_end" })]);
    s.close();
  });
  it("detects a column that disagrees with the stored record, and unreadable records", () => {
    const { p, s } = seededChain();
    tamper(p, `${dropGuards} update evidence_events set prev_hash = '${f.hex("0")}' where seq = 2`);
    expect(s.verifyChains().map((x) => x.problem)).toContain("column_mismatch");
    tamper(p, "update evidence_events set data = '{}' where seq = 1");
    expect(s.verifyChains().map((x) => x.problem)).toContain("invalid_record");
    s.close();
  });
});

// Each duplicated column of the two chained tables must agree with the hashed record. The columns are what
// SQL (CHECKs, indexes, queries by type or decision) sees, so editing one without touching `data` must not
// go unnoticed. These tampers run on a raw connection after dropping the update guard, so they test
// detection, not prevention (same-user tampering is not claimed: GR-23).
describe("duplicated columns must match the record", () => {
  const seedEvents = () => {
    const p = dbFile();
    const s = openStore(p);
    const ev = withEvidence(s);
    for (let i = 0; i < 3; i++) s.appendEvidenceEvent(eventInput(ev.id));
    return { p, s };
  };
  // deny / A1 so that a flip to allow (A0/A1 only) still satisfies the table CHECK.
  const seedDecisions = () => {
    const p = dbFile();
    const s = openStore(p);
    const run = makeRun(1);
    s.insertRun(run);
    for (let i = 0; i < 3; i++) s.appendPolicyDecision(decisionInput(run.id, `rule-${i}`, "A1"));
    return { p, s };
  };
  const LATER = "'2030-01-01T00:00:00.000Z'";
  const OTHER_HASH = `'${f.hex("0")}'`;

  it("a clean store reports nothing", () => {
    const e = seedEvents();
    const d = seedDecisions();
    expect(e.s.verifyChains()).toEqual([]);
    expect(d.s.verifyChains()).toEqual([]);
    e.s.close();
    d.s.close();
  });

  it.each([
    ["id", "'forged-id'"],
    ["type", "'exported'"],
    ["at", LATER],
    ["hash", OTHER_HASH],
    ["prev_hash", OTHER_HASH],
  ])("evidence_events.%s edited on its own is reported once, as column_mismatch", (col, value) => {
    const { p, s } = seedEvents();
    tamper(p, `drop trigger evidence_events_no_update; update evidence_events set ${col} = ${value} where seq = 2`);
    expect(s.verifyChains()).toEqual([expect.objectContaining({ table: "evidence_events", seq: 2, problem: "column_mismatch" })]);
    s.close();
  });

  it.each([
    ["id", "'forged-id'"],
    ["subject", "'spec'"],
    ["decision", "'allow'"],
    ["action_class", "'A0'"],
    ["at", LATER],
    ["hash", OTHER_HASH],
    ["prev_hash", OTHER_HASH],
  ])("policy_decisions.%s edited on its own is reported once, as column_mismatch", (col, value) => {
    const { p, s } = seedDecisions();
    tamper(p, `drop trigger policy_decisions_no_update; update policy_decisions set ${col} = ${value} where seq = 2`);
    expect(s.verifyChains()).toEqual([expect.objectContaining({ table: "policy_decisions", seq: 2, problem: "column_mismatch" })]);
    s.close();
  });

  it("moving a row to another chain by its key column is reported as column_mismatch", () => {
    // The new parent must exist: foreign keys are enforced even on a raw connection with default pragmas.
    const e = seedEvents();
    const otherEvidence = withEvidence(e.s, "2");
    tamper(e.p, `drop trigger evidence_events_no_update; update evidence_events set evidence_id = '${otherEvidence.id}' where seq = 2`);
    expect(e.s.verifyChains()).toContainEqual(expect.objectContaining({ table: "evidence_events", seq: 2, problem: "column_mismatch" }));
    e.s.close();
    const d = seedDecisions();
    const otherRun = makeRun(2);
    d.s.insertRun(otherRun);
    tamper(d.p, `drop trigger policy_decisions_no_update; update policy_decisions set run_id = '${otherRun.id}' where seq = 2`);
    expect(d.s.verifyChains()).toContainEqual(expect.objectContaining({ table: "policy_decisions", seq: 2, problem: "column_mismatch" }));
    d.s.close();
  });

  it("editing a duplicated field inside data is reported twice: the hash and the column", () => {
    const { p, s } = seedEvents();
    tamper(p, `drop trigger evidence_events_no_update; update evidence_events set data = replace(data, '"type":"accessed"', '"type":"exported"') where seq = 2`);
    const found = s.verifyChains().filter((x) => x.seq === 2).map((x) => x.problem).sort();
    expect(found).toEqual(["column_mismatch", "hash_mismatch"]);
    s.close();
  });
});

describe("schema drift", () => {
  it("reports nothing on a fresh store", () => {
    const s = openStore(dbFile());
    expect(s.verifySchema()).toEqual([]);
    s.close();
  });
  it("reports a missing, altered and unexpected object", () => {
    const p = dbFile();
    const s = openStore(p);
    tamper(p, "drop trigger evidence_no_update");
    tamper(p, "drop trigger evidence_no_delete; create trigger evidence_no_delete before delete on evidence begin select 1; end");
    tamper(p, "create index sneaky on evidence(kind)");
    expect(s.verifySchema()).toEqual(
      expect.arrayContaining([
        { object: "evidence_no_update", type: "trigger", problem: "missing" },
        { object: "evidence_no_delete", type: "trigger", problem: "altered" },
        { object: "sneaky", type: "index", problem: "unexpected" },
      ]),
    );
    s.close();
  });
});
