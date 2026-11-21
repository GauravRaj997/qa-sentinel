import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import { MIGRATIONS, StoreError, canonicalJson, openStore, sha256Hex, type ChainProblem, type Store } from "@qa-sentinel/store";
import { cleanup, dbFile, decisionInput, eventInput, legacyV1Db as legacy, makeEvidence, makeRun } from "./helpers.js";

afterEach(cleanup);

// Table-wide row links (AC-43). Every row appended after migration 2 carries row_link = sha256 over the previous
// table row's stored link and its own hash, so removing any row, a tombstone included, breaks the NEXT row's link even
// when the removed row was the last of its own chain. Tampers run on a raw connection after dropping the guards, so
// they test detection, not prevention (same-user rewriting of everything is not claimed: GR-23).

const GENESIS = (table: string, boundarySeq: number): string => sha256Hex(`qa-sentinel/row-link-genesis/v1\n${table}\n${boundarySeq}`);
const LINK = (previous: string, hash: string): string => sha256Hex(`qa-sentinel/row-link/v1\n${previous}\n${hash}`);

const tamper = (path: string, sql: string): void => {
  const d = new Database(path);
  try {
    d.exec(sql);
  } finally {
    d.close();
  }
};
const query = (path: string, sql: string): Record<string, unknown>[] => {
  const d = new Database(path);
  try {
    return d.prepare(sql).all() as Record<string, unknown>[];
  } finally {
    d.close();
  }
};
const DROP_EVENTS = "drop trigger evidence_events_no_update; drop trigger evidence_events_no_delete;";
const DROP_DECISIONS = "drop trigger policy_decisions_no_update; drop trigger policy_decisions_no_delete;";
const DROP_BOUNDARY = "drop trigger row_link_boundaries_no_update; drop trigger row_link_boundaries_no_delete;";
const codeOf = (fn: () => unknown): string | undefined => {
  try {
    fn();
  } catch (e) {
    return e instanceof StoreError ? e.code : `other:${(e as Error).message}`;
  }
  return undefined;
};
const pick = (ps: ChainProblem[]): [number | null, string][] => ps.map((x) => [x.seq, x.problem]);
const opened = (p: string): Store => openStore(p);

/** Evidence A: created(1), tombstoned(2). Evidence B: created(3). A's chain ends in a tombstone that is not the table's last row. */
const seedTombstone = () => {
  const p = dbFile();
  const s = openStore(p);
  const a = makeEvidence("a");
  const b = makeEvidence("b");
  s.insertEvidence(a);
  s.insertEvidence(b);
  s.appendEvidenceEvent(eventInput(a.id, "created"));
  s.appendEvidenceEvent({
    ...eventInput(a.id, "tombstoned"),
    detail: { hash: a.id, kind: "console", size: 10, deletedAt: "2026-11-17T10:00:00.000Z", reason: "retention expired", method: "unlink" },
  });
  s.appendEvidenceEvent(eventInput(b.id, "created"));
  return { p, s, a, b };
};
/** Three events of one evidence item. */
const seedEvents = () => {
  const p = dbFile();
  const s = openStore(p);
  const ev = makeEvidence();
  s.insertEvidence(ev);
  for (let i = 0; i < 3; i++) s.appendEvidenceEvent(eventInput(ev.id));
  return { p, s, ev };
};
const seedDecisions = () => {
  const p = dbFile();
  const s = openStore(p);
  const run = makeRun(1);
  s.insertRun(run);
  for (let i = 0; i < 3; i++) s.appendPolicyDecision(decisionInput(run.id, `rule-${i}`, "A1"));
  return { p, s, run };
};

describe("row links: format and clean stores", () => {
  it("a clean store of both tables reports nothing", () => {
    const e = seedTombstone();
    const d = seedDecisions();
    expect(e.s.verifyChains()).toEqual([]);
    expect(d.s.verifyChains()).toEqual([]);
    expect(e.s.verifySchema()).toEqual([]);
    e.s.close();
    d.s.close();
  });

  it("links are pinned: genesis from table and boundary, then previous stored link plus own hash", () => {
    for (const [table, seed] of [["evidence_events", seedEvents], ["policy_decisions", seedDecisions]] as const) {
      const { p, s } = seed();
      const rows = query(p, `select seq, hash, row_link from ${table} order by seq`);
      let prev = GENESIS(table, 0);
      for (const r of rows) {
        expect(r["row_link"]).toBe(LINK(prev, r["hash"] as string));
        prev = r["row_link"] as string;
      }
      expect(rows).toHaveLength(3);
      s.close();
    }
  });

  it("a fresh database records boundary 0 with no legacy rows, once per table", () => {
    const { p, s } = seedEvents();
    expect(query(p, "select table_name, boundary_seq, legacy_rows from row_link_boundaries order by table_name")).toEqual([
      { table_name: "evidence_events", boundary_seq: 0, legacy_rows: 0 },
      { table_name: "policy_decisions", boundary_seq: 0, legacy_rows: 0 },
    ]);
    s.close();
  });

  it("migration 1 is unchanged, byte for byte (pinned checksum)", () => {
    expect(sha256Hex(MIGRATIONS[0]!.sql)).toBe("104331dc6b30e41dff091fec5e29097abd3192762c16ca4046756fc5070745e4");
    expect(MIGRATIONS.map((m) => m.version)).toEqual([1, 2]);
  });
});

describe("AC-43: a removed or altered tombstone is detected", () => {
  it("removing a tombstone that ends its chain but is not the table's last row is reported", () => {
    const { p, s } = seedTombstone();
    tamper(p, `${DROP_EVENTS} DELETE FROM evidence_events WHERE seq = 2`);
    // The per-chain check and the AUTOINCREMENT counter check both pass here; only the link of the next row notices.
    expect(pick(s.verifyChains())).toEqual([[3, "row_link_mismatch"]]);
    s.close();
  });

  it("removing the table's last row is reported by the counter check", () => {
    const { p, s } = seedTombstone();
    tamper(p, `${DROP_EVENTS} DELETE FROM evidence_events WHERE seq = 3`);
    expect(pick(s.verifyChains())).toEqual([[null, "rows_missing_at_end"]]);
    s.close();
  });

  it("the same holds for a non-tombstone chain tail", () => {
    const { p, s } = seedEvents();
    const other = makeEvidence("c");
    s.insertEvidence(other);
    s.appendEvidenceEvent(eventInput(other.id));
    tamper(p, `${DROP_EVENTS} DELETE FROM evidence_events WHERE seq = 3`);
    expect(pick(s.verifyChains())).toEqual([[4, "row_link_mismatch"]]);
    s.close();
  });

  it("removing a whole chain from the middle of the table is reported", () => {
    const { p, s, a } = seedTombstone();
    tamper(p, `${DROP_EVENTS} DELETE FROM evidence_events WHERE evidence_id = '${a.id}'`);
    expect(pick(s.verifyChains())).toEqual([[3, "row_link_mismatch"]]);
    s.close();
  });

  it("altering a tombstone's data is a hash mismatch; its hash or type column, a column mismatch", () => {
    for (const [sql, expected] of [
      [`UPDATE evidence_events SET data = replace(data, '"label":"runner"', '"label":"intruder"') WHERE seq = 2`, "hash_mismatch"],
      [`UPDATE evidence_events SET hash = '${"0".repeat(64)}' WHERE seq = 2`, "column_mismatch"],
      [`UPDATE evidence_events SET type = 'created' WHERE seq = 2`, "column_mismatch"],
    ] as const) {
      const { p, s } = seedTombstone();
      tamper(p, `${DROP_EVENTS} ${sql}`);
      expect(pick(s.verifyChains())).toContainEqual([2, expected]);
      s.close();
    }
  });

  it("altering a tombstone's link is reported at that row and the next", () => {
    const { p, s } = seedTombstone();
    tamper(p, `${DROP_EVENTS} UPDATE evidence_events SET row_link = '${"0".repeat(64)}' WHERE seq = 2`);
    expect(pick(s.verifyChains())).toEqual([[2, "row_link_mismatch"], [3, "row_link_mismatch"]]);
    s.close();
  });

  /** Rewrites row `seq` so that its record, hash column and type column agree again (a consistent edit of the row). */
  const rewriteConsistently = (p: string, seq: number, relink: boolean): void => {
    const d = new Database(p);
    const row = d.prepare("SELECT data, row_link FROM evidence_events WHERE seq = ?").get(seq) as { data: string; row_link: string };
    const rec = JSON.parse(row.data) as Record<string, unknown>;
    rec["type"] = "accessed"; // the tombstone is quietly turned into an ordinary access
    const { hash: _old, ...rest } = rec;
    const hash = sha256Hex(canonicalJson(rest));
    rec["hash"] = hash;
    const prevLink = (d.prepare("SELECT row_link FROM evidence_events WHERE seq = ?").get(seq - 1) as { row_link: string }).row_link;
    d.exec(DROP_EVENTS);
    d.prepare("UPDATE evidence_events SET data = ?, hash = ?, type = 'accessed', row_link = ? WHERE seq = ?").run(
      JSON.stringify(rec),
      hash,
      relink ? LINK(prevLink, hash) : row.row_link,
      seq,
    );
    d.close();
  };

  it("a consistent rewrite of a non-final tombstone is caught by its stale link", () => {
    const { p, s } = seedTombstone();
    rewriteConsistently(p, 2, false);
    expect(pick(s.verifyChains())).toEqual([[2, "row_link_mismatch"]]);
    s.close();
  });

  it("a consistent rewrite that also recomputes that row's link is caught at the next row", () => {
    const { p, s } = seedTombstone();
    rewriteConsistently(p, 2, true);
    expect(pick(s.verifyChains())).toEqual([[3, "row_link_mismatch"]]);
    s.close();
  });
});

describe("row links: which rows each tamper is reported on", () => {
  it("emptying every link reports every row", () => {
    const { p, s } = seedEvents();
    tamper(p, `${DROP_EVENTS} UPDATE evidence_events SET row_link = ''`);
    expect(pick(s.verifyChains())).toEqual([[1, "row_link_mismatch"], [2, "row_link_mismatch"], [3, "row_link_mismatch"]]);
    s.close();
  });
  it("emptying a middle link reports that row and the next; the last link, only itself; the first, rows 1 and 2", () => {
    for (const [seq, expected] of [[2, [2, 3]], [3, [3]], [1, [1, 2]]] as const) {
      const { p, s } = seedEvents();
      tamper(p, `${DROP_EVENTS} UPDATE evidence_events SET row_link = '' WHERE seq = ${seq}`);
      expect(pick(s.verifyChains())).toEqual(expected.map((q) => [q, "row_link_mismatch"]));
      s.close();
    }
  });
  it("a removed middle row reports the next row's link as well as its prev_hash", () => {
    const { p, s } = seedEvents();
    tamper(p, `${DROP_EVENTS} DELETE FROM evidence_events WHERE seq = 2`);
    expect(pick(s.verifyChains()).sort()).toEqual([[3, "prev_hash_mismatch"], [3, "row_link_mismatch"]].sort());
    s.close();
  });
  it("policy_decisions: removing a chain's tail while another run has later rows is reported", () => {
    const { p, s, run } = seedDecisions();
    const other = makeRun(2);
    s.insertRun(other);
    s.appendPolicyDecision(decisionInput(other.id, "later", "A1"));
    tamper(p, `${DROP_DECISIONS} DELETE FROM policy_decisions WHERE run_id = '${run.id}' AND seq = 3`);
    expect(pick(s.verifyChains())).toEqual([[4, "row_link_mismatch"]]);
    s.close();
  });
});

describe("row links: a database upgraded from migration 1 with existing rows", () => {
  const first = MIGRATIONS[0]!;
  /** Upgraded to version 2 and closed. */
  const upgraded = (): { p: string; a: { id: string } } => {
    const { p, a } = legacy();
    opened(p).close();
    return { p, a };
  };

  it("upgrades cleanly: nothing reported, boundary and counts recorded, new appends are linked from the boundary", () => {
    const { p, a } = legacy();
    const s = opened(p);
    expect(s.diagnostics().schemaVersion).toBe(2);
    expect(s.verifyChains()).toEqual([]);
    expect(s.verifySchema()).toEqual([]);
    expect(query(p, "select table_name, boundary_seq, legacy_rows from row_link_boundaries order by table_name")).toEqual([
      { table_name: "evidence_events", boundary_seq: 3, legacy_rows: 3 },
      { table_name: "policy_decisions", boundary_seq: 2, legacy_rows: 2 },
    ]);
    expect(query(p, "select row_link from evidence_events order by seq").map((r) => r["row_link"])).toEqual(["", "", ""]);
    const added = s.appendEvidenceEvent(eventInput(a.id));
    const row = query(p, `select seq, row_link from evidence_events where id = '${added.id}'`)[0]!;
    expect(row).toEqual({ seq: 4, row_link: LINK(GENESIS("evidence_events", 3), added.hash) });
    s.appendEvidenceEvent(eventInput(a.id));
    expect(s.verifyChains()).toEqual([]);
    s.close();
  });

  it("legacy rows are still verified by the per-chain checks: an edit is a hash mismatch", () => {
    const { p } = upgraded();
    tamper(p, `${DROP_EVENTS} UPDATE evidence_events SET data = replace(data, '"label":"runner"', '"label":"intruder"') WHERE seq = 2`);
    const s = opened(p);
    expect(pick(s.verifyChains())).toEqual([[2, "hash_mismatch"]]);
    s.close();
  });

  it("a mid-chain removal in the legacy range is a prev_hash mismatch (and the legacy count changes)", () => {
    const { p } = upgraded();
    tamper(p, `${DROP_EVENTS} DELETE FROM evidence_events WHERE seq = 1`); // first of A's chain; A's second is seq 3
    const s = opened(p);
    const found = pick(s.verifyChains());
    expect(found).toContainEqual([3, "prev_hash_mismatch"]);
    expect(found).toContainEqual([null, "legacy_boundary_mismatch"]);
    s.close();
  });

  it("a changed legacy count is reported", () => {
    const { p } = upgraded();
    tamper(p, `${DROP_EVENTS} DELETE FROM evidence_events WHERE seq = 2`);
    const s = opened(p);
    expect(pick(s.verifyChains())).toContainEqual([null, "legacy_boundary_mismatch"]);
    s.close();
  });

  it("a linked row inside the legacy range is reported", () => {
    const { p } = upgraded();
    tamper(p, `${DROP_EVENTS} UPDATE evidence_events SET row_link = '${"1".repeat(64)}' WHERE seq = 2`);
    const s = opened(p);
    expect(pick(s.verifyChains())).toEqual([[2, "legacy_boundary_mismatch"]]);
    s.close();
  });

  it.each([
    ["raised boundary", "UPDATE row_link_boundaries SET boundary_seq = boundary_seq + 5 WHERE table_name = 'evidence_events'"],
    ["lowered boundary", "UPDATE row_link_boundaries SET boundary_seq = 1 WHERE table_name = 'evidence_events'"],
    ["edited legacy_rows", "UPDATE row_link_boundaries SET legacy_rows = 1 WHERE table_name = 'evidence_events'"],
  ])("an edited boundary record is reported once rows follow it: %s", (_name, sql) => {
    const { p, a } = upgraded();
    const more = opened(p);
    more.appendEvidenceEvent(eventInput(a.id));
    more.appendEvidenceEvent(eventInput(a.id));
    more.close();
    tamper(p, `${DROP_BOUNDARY} ${sql}`);
    const s = opened(p);
    const found = pick(s.verifyChains()).map((x) => x[1]);
    expect(found.some((x) => x === "legacy_boundary_mismatch" || x === "row_link_mismatch")).toBe(true);
    s.close();
  });

  it("a deleted boundary record is reported, and appends to that table are refused with integrity_error", () => {
    const { p, a } = upgraded();
    tamper(p, `${DROP_BOUNDARY} DELETE FROM row_link_boundaries WHERE table_name = 'evidence_events'`);
    const s = opened(p);
    expect(pick(s.verifyChains())).toContainEqual([null, "legacy_boundary_mismatch"]);
    const before = query(p, "select count(*) c from evidence_events");
    expect(codeOf(() => s.appendEvidenceEvent(eventInput(a.id)))).toBe("integrity_error");
    expect(query(p, "select count(*) c from evidence_events")).toEqual(before);
    s.close();
  });

  it("a legacy row removed after migration is reported through the count", () => {
    const { p } = upgraded();
    tamper(p, `${DROP_EVENTS} DELETE FROM evidence_events WHERE seq = 3`); // last row: counter check too
    const s = opened(p);
    const found = pick(s.verifyChains());
    expect(found).toContainEqual([null, "legacy_boundary_mismatch"]);
    expect(found).toContainEqual([null, "rows_missing_at_end"]);
    s.close();
  });
});

describe("row_link_boundaries is append-only for any connection", () => {
  it("rejects update, delete and replace, and keeps its rows", () => {
    const { p, s } = seedEvents();
    s.close();
    const d = new Database(p);
    const before = d.prepare("select * from row_link_boundaries").all();
    for (const sql of [
      "UPDATE row_link_boundaries SET boundary_seq = 9",
      "DELETE FROM row_link_boundaries",
      "INSERT OR REPLACE INTO row_link_boundaries SELECT * FROM row_link_boundaries",
      "REPLACE INTO row_link_boundaries SELECT * FROM row_link_boundaries",
    ]) {
      expect(() => d.exec(sql), sql).toThrow();
    }
    expect(d.prepare("select * from row_link_boundaries").all()).toEqual(before);
    d.close();
  });
});

// Final-row deletion followed by an append (D3 review finding). AUTOINCREMENT keeps counting past a removed final row, so
// without a tail check the new row would link over the gap and verifyChains would see a clean chain. Two guards close it:
// the append refuses an inconsistent tail, and verifyChains requires consecutive seq numbers after the boundary.
type Ctx = { ev?: { id: string }; run?: { id: string } };
const TABLES = [
  {
    table: "evidence_events",
    drop: DROP_EVENTS,
    seed: seedEvents,
    append: (s: Store, ctx: Ctx) => s.appendEvidenceEvent(eventInput(ctx.ev!.id)),
  },
  {
    table: "policy_decisions",
    drop: DROP_DECISIONS,
    seed: seedDecisions,
    append: (s: Store, ctx: Ctx) => s.appendPolicyDecision(decisionInput(ctx.run!.id, "later", "A1")),
  },
] as const;
const count = (p: string, table: string): number => query(p, `select count(*) c from ${table}`)[0]!["c"] as number;
const counterOf = (p: string, table: string): unknown => query(p, `select seq from sqlite_sequence where name = '${table}'`)[0]?.["seq"];

/** Reproduces what an append did before the guard: the row `seq` moves to `newSeq` with a link computed over the survivor before it. */
const reinsertAt = (p: string, table: string, seq: number, newSeq: number): void => {
  const d = new Database(p);
  try {
    const row = d.prepare(`select * from ${table} where seq = ?`).get(seq) as Record<string, unknown>;
    const prev = d.prepare(`select row_link from ${table} where seq < ? order by seq desc limit 1`).get(seq) as { row_link: string };
    d.exec(`${table === "evidence_events" ? DROP_EVENTS : DROP_DECISIONS} DELETE FROM ${table} WHERE seq = ${seq}`);
    const cols = Object.keys(row);
    d.prepare(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${cols.map((c) => "@" + c).join(", ")})`).run({
      ...row,
      seq: newSeq,
      row_link: LINK(prev.row_link, row["hash"] as string),
    });
  } finally {
    d.close();
  }
};

describe.each(TABLES)("final-row deletion then append: $table", ({ table, drop, seed, append }) => {
  it("deleting the final row and appending is refused with integrity_error, and nothing is written", () => {
    const { p, s, ...ctx } = seed();
    tamper(p, `${drop} DELETE FROM ${table} WHERE seq = 3`);
    expect(codeOf(() => append(s, ctx))).toBe("integrity_error");
    expect(count(p, table)).toBe(2);
    expect(counterOf(p, table)).toBe(3);
    expect(pick(s.verifyChains())).toEqual([[null, "rows_missing_at_end"]]);
    s.close();
  });

  it("a counter below the surviving tail (counter edited down, no row removed) is refused too", () => {
    const { p, s, ...ctx } = seed();
    tamper(p, `UPDATE sqlite_sequence SET seq = 2 WHERE name = '${table}'`);
    expect(codeOf(() => append(s, ctx))).toBe("integrity_error");
    expect(count(p, table)).toBe(3);
    s.close();
  });

  it("a multi-row gap (the last two rows deleted) is refused too, and stays refused on every retry", () => {
    const { p, s, ...ctx } = seed();
    tamper(p, `${drop} DELETE FROM ${table} WHERE seq >= 2`);
    expect(codeOf(() => append(s, ctx))).toBe("integrity_error");
    expect(codeOf(() => append(s, ctx))).toBe("integrity_error");
    expect(count(p, table)).toBe(1);
    s.close();
  });

  it("every row deleted: the counter is above an empty table, so the append is refused", () => {
    const { p, s, ...ctx } = seed();
    tamper(p, `${drop} DELETE FROM ${table}`);
    expect(codeOf(() => append(s, ctx))).toBe("integrity_error");
    expect(count(p, table)).toBe(0);
    s.close();
  });

  it("a gap that is already in the database (a row linked over a removed one) is reported at the row after it", () => {
    const { p, s } = seed();
    reinsertAt(p, table, 3, 4); // rows 1, 2, 4: links valid, seq 3 missing
    expect(pick(s.verifyChains())).toEqual([[4, "row_link_mismatch"]]);
    s.close();
  });

  it("a gap of several numbers is reported once, and a later consistent append does not add reports", () => {
    const { p, s, ...ctx } = seed();
    reinsertAt(p, table, 3, 6); // rows 1, 2, 6
    expect(pick(s.verifyChains())).toEqual([[6, "row_link_mismatch"]]);
    append(s, ctx); // seq 7 follows 6 and the counter is consistent
    expect(pick(s.verifyChains())).toEqual([[6, "row_link_mismatch"]]);
    s.close();
  });

  it("a clean store keeps appending and verifying, and its seq numbers are consecutive", () => {
    const { p, s, ...ctx } = seed();
    append(s, ctx);
    append(s, ctx);
    expect(s.verifyChains()).toEqual([]);
    expect(query(p, `select seq from ${table} order by seq`).map((r) => r["seq"])).toEqual([1, 2, 3, 4, 5]);
    s.close();
  });

  it("a failed append leaves no gap: the counter rolls back with the transaction", () => {
    const { p, s, ...ctx } = seed();
    expect(() => s.appendEvidenceEvent(eventInput(makeEvidence("9").id))).toThrow(); // unknown evidence: foreign key
    expect(counterOf(p, table)).toBe(3);
    append(s, ctx);
    expect(s.verifyChains()).toEqual([]);
    s.close();
  });
});

describe("final-row deletion: a tombstone", () => {
  it("deleting the final tombstone and appending an event for another item is refused, and the deletion stays reported", () => {
    const p = dbFile();
    const s = openStore(p);
    const a = makeEvidence("a");
    const b = makeEvidence("b");
    s.insertEvidence(a);
    s.insertEvidence(b);
    s.appendEvidenceEvent(eventInput(b.id, "created"));
    s.appendEvidenceEvent(eventInput(a.id, "created"));
    s.appendEvidenceEvent({
      ...eventInput(a.id, "tombstoned"),
      detail: { hash: a.id, kind: "console", size: 10, deletedAt: "2026-11-17T10:00:00.000Z", reason: "retention expired", method: "unlink" },
    });
    tamper(p, `${DROP_EVENTS} DELETE FROM evidence_events WHERE seq = 3`);
    expect(codeOf(() => s.appendEvidenceEvent(eventInput(b.id, "accessed")))).toBe("integrity_error");
    expect(query(p, "select count(*) c from evidence_events where type = 'tombstoned'")).toEqual([{ c: 0 }]);
    expect(pick(s.verifyChains())).toEqual([[null, "rows_missing_at_end"]]);
    s.close();
  });

  it("a final tombstone already replaced by a row linked over the gap is reported (AC-43)", () => {
    const { p, s } = seedTombstone(); // A created(1), A tombstoned(2), B created(3)
    reinsertAt(p, "evidence_events", 3, 4); // B's row moves to seq 4: the tail no longer follows the tombstone
    expect(pick(s.verifyChains())).toEqual([[4, "row_link_mismatch"]]);
    s.close();
  });
});

describe("final-row deletion: databases upgraded from migration 1", () => {
  const upgraded = () => {
    const l = legacy();
    opened(l.p).close();
    return l;
  };

  it("control: a nonzero boundary with no post-migration rows verifies clean, and the first append is boundary + 1", () => {
    const { p, a, run } = upgraded();
    const s = opened(p);
    expect(s.verifyChains()).toEqual([]);
    const e = s.appendEvidenceEvent(eventInput(a.id));
    const d = s.appendPolicyDecision(decisionInput(run.id, "after", "A1"));
    expect(query(p, `select seq from evidence_events where id = '${e.id}'`)).toEqual([{ seq: 4 }]);
    expect(query(p, `select seq from policy_decisions where id = '${d.id}'`)).toEqual([{ seq: 3 }]);
    expect(s.verifyChains()).toEqual([]);
    s.close();
  });

  it("control: appends after the boundary stay consecutive and clean", () => {
    const { p, a } = upgraded();
    const s = opened(p);
    for (let i = 0; i < 4; i++) s.appendEvidenceEvent(eventInput(a.id));
    expect(query(p, "select seq from evidence_events order by seq").map((r) => r["seq"])).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(s.verifyChains()).toEqual([]);
    s.close();
  });

  it("deleting the last legacy row (counter above the surviving tail) refuses the append", () => {
    const { p, a } = upgraded();
    tamper(p, `${DROP_EVENTS} DELETE FROM evidence_events WHERE seq = 3`);
    const s = opened(p);
    expect(codeOf(() => s.appendEvidenceEvent(eventInput(a.id)))).toBe("integrity_error");
    expect(pick(s.verifyChains())).toContainEqual([null, "legacy_boundary_mismatch"]);
    s.close();
  });

  it("deleting the only post-migration row and appending is refused", () => {
    const { p, a } = upgraded();
    const s = opened(p);
    s.appendEvidenceEvent(eventInput(a.id));
    tamper(p, `${DROP_EVENTS} DELETE FROM evidence_events WHERE seq = 4`);
    expect(codeOf(() => s.appendEvidenceEvent(eventInput(a.id)))).toBe("integrity_error");
    expect(pick(s.verifyChains())).toEqual([[null, "rows_missing_at_end"]]);
    s.close();
  });

  it("a first post-migration row that is not boundary + 1 is reported", () => {
    const { p, a } = upgraded();
    const s = opened(p);
    s.appendEvidenceEvent(eventInput(a.id));
    reinsertAt(p, "evidence_events", 4, 5);
    expect(pick(s.verifyChains())).toEqual([[5, "row_link_mismatch"]]);
    s.close();
  });

  it("a counter below the boundary is reported, and the append is refused even when the counter matches the surviving tail", () => {
    const { p, a } = upgraded();
    // Legacy row 3 removed and the counter lowered to match the surviving tail (2): equality holds, the boundary (3) is above it.
    tamper(p, `${DROP_EVENTS} DELETE FROM evidence_events WHERE seq = 3; UPDATE sqlite_sequence SET seq = 2 WHERE name = 'evidence_events'`);
    const s = opened(p);
    expect(pick(s.verifyChains())).toContainEqual([null, "legacy_boundary_mismatch"]);
    expect(codeOf(() => s.appendEvidenceEvent(eventInput(a.id)))).toBe("integrity_error");
    s.close();
  });

  it("a missing sqlite_sequence row over an empty table below a nonzero boundary is refused and reported", () => {
    const { p, a } = upgraded();
    tamper(p, `${DROP_EVENTS} DELETE FROM evidence_events; DELETE FROM sqlite_sequence WHERE name = 'evidence_events'`);
    const s = opened(p);
    expect(pick(s.verifyChains())).toContainEqual([null, "legacy_boundary_mismatch"]);
    expect(codeOf(() => s.appendEvidenceEvent(eventInput(a.id)))).toBe("integrity_error");
    s.close();
  });

  it("a counter lowered below an intact table is reported on its own, and the append is refused", () => {
    const { p, a } = upgraded();
    tamper(p, "UPDATE sqlite_sequence SET seq = 1 WHERE name = 'evidence_events'"); // no row removed: only the counter is wrong
    const s = opened(p);
    expect(pick(s.verifyChains())).toEqual([[null, "legacy_boundary_mismatch"]]);
    expect(codeOf(() => s.appendEvidenceEvent(eventInput(a.id)))).toBe("integrity_error");
    s.close();
  });

  it("policy_decisions: deleting the last legacy decision refuses the append", () => {
    const { p, run } = upgraded();
    tamper(p, `${DROP_DECISIONS} DELETE FROM policy_decisions WHERE seq = 2`);
    const s = opened(p);
    expect(codeOf(() => s.appendPolicyDecision(decisionInput(run.id, "x", "A1")))).toBe("integrity_error");
    s.close();
  });
});
