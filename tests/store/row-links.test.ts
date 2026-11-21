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
