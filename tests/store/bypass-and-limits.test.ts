import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import { canonicalJson, openStore, sha256Hex } from "@qa-sentinel/store";
import * as f from "../schema/factories.js";
import { cleanup, dbFile, decisionInput, eventInput, makeEvidence, makeRun } from "./helpers.js";

afterEach(cleanup);

const TRIGGER = "SQLITE_CONSTRAINT_TRIGGER";
const TABLES = ["runs", "evidence", "evidence_events", "policy_decisions", "schema_migrations"] as const;

/** A store file with one row in every table, then closed. Raw connections below use DEFAULT pragmas. */
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

// ---------------------------------------------------------------------------------------------- UPSERT

describe("UPSERT and OR IGNORE cannot get around the append-only tables", () => {
  const KEYS: Record<(typeof TABLES)[number], [key: string, setCol: string]> = {
    runs: ["id", "data"],
    evidence: ["id", "data"],
    evidence_events: ["id", "data"],
    policy_decisions: ["id", "data"],
    schema_migrations: ["version", "name"],
  };
  it.each(TABLES)("%s: ON CONFLICT DO UPDATE, DO NOTHING and INSERT OR IGNORE on an existing key all fail, rows unchanged", (table) => {
    const [key, col] = KEYS[table];
    const db = new Database(seeded());
    const before = db.prepare(`select * from ${table}`).all();
    expect(codeOf(db, `insert into ${table} select * from ${table} where true on conflict(${key}) do update set ${col} = excluded.${col}`)).toBe(TRIGGER);
    expect(codeOf(db, `insert into ${table} select * from ${table} where true on conflict do nothing`)).toBe(TRIGGER);
    expect(codeOf(db, `insert or ignore into ${table} select * from ${table}`)).toBe(TRIGGER);
    expect(db.prepare(`select * from ${table}`).all()).toEqual(before);
    db.close();
  });
});

// ------------------------------------------------------------- unique keys, guards and partial-key REPLACE

type Key = string[];
const norm = (keys: Key[]): string[] => keys.map((k) => [...k].sort().join("+")).sort();

/** Every unique key of a table, read from the live schema: the primary key plus each UNIQUE index (composite keys included). */
function uniqueKeys(db: Database, table: string): Key[] {
  const cols = db.prepare(`pragma table_info(${table})`).all() as { name: string; pk: number }[];
  const keys = new Map<string, Key>();
  const add = (k: Key): void => void keys.set([...k].sort().join("+"), k);
  const pk = cols.filter((c) => c.pk > 0).sort((a, b) => a.pk - b.pk).map((c) => c.name);
  if (pk.length > 0) add(pk);
  for (const ix of db.prepare(`pragma index_list(${table})`).all() as { name: string; unique: number }[]) {
    if (!ix.unique) continue;
    const info = db.prepare(`pragma index_info(${ix.name})`).all() as { seqno: number; name: string | null }[];
    if (info.some((c) => c.name === null)) throw new Error(`index ${ix.name} on ${table} is an expression index; not supported by this check`);
    add(info.sort((a, b) => a.seqno - b.seqno).map((c) => c.name as string));
  }
  return [...keys.values()];
}

/** The key sets a table's `<table>_no_replace` guard blocks. Fails closed if the trigger text is not the expected shape. */
function guardKeys(db: Database, table: string): Key[] {
  const row = db.prepare("select sql from sqlite_master where type = 'trigger' and name = ?").get(`${table}_no_replace`) as { sql: string } | undefined;
  if (row === undefined) throw new Error(`${table} has no ${table}_no_replace guard`);
  const m = /WHEN EXISTS \(SELECT 1 FROM \w+ WHERE (.+)\)\s*BEGIN/is.exec(row.sql);
  if (m?.[1] === undefined) throw new Error(`cannot read the guard condition of ${table}`);
  return m[1].split(/\s+OR\s+/i).map((alt) =>
    alt
      .trim()
      .replace(/^\(+|\)+$/g, "")
      .split(/\s+AND\s+/i)
      .map((term) => {
        const t = /^\s*(\w+)\s*=\s*NEW\.(\w+)\s*$/i.exec(term);
        if (t?.[1] === undefined || t[1] !== t[2]) throw new Error(`unreadable guard term "${term}" on ${table}`);
        return t[1];
      }),
  );
}

const compareGuard = (unique: Key[], guard: Key[]) => {
  const u = new Set(norm(unique));
  const g = new Set(norm(guard));
  return { incomplete: [...u].filter((k) => !g.has(k)), overBroad: [...g].filter((k) => !u.has(k)) };
};

describe("replace guards cover the complete unique keys of every guarded table", () => {
  it("reads the expected unique keys from the live schema", () => {
    const db = new Database(seeded());
    expect(Object.fromEntries(TABLES.map((t) => [t, norm(uniqueKeys(db, t))]))).toEqual({
      runs: ["id"],
      evidence: ["id"],
      evidence_events: ["id", "seq"],
      policy_decisions: ["id", "seq"],
      schema_migrations: ["version"],
    });
    db.close();
  });
  it.each(TABLES)("%s: the guard blocks exactly the unique keys, no fewer and no broader", (table) => {
    const db = new Database(seeded());
    expect(compareGuard(uniqueKeys(db, table), guardKeys(db, table))).toEqual({ incomplete: [], overBroad: [] });
    db.close();
  });

  it.each(TABLES)("%s: REPLACE that conflicts on only one unique key is rejected, rows unchanged", (table) => {
    const db = new Database(seeded());
    const keys = uniqueKeys(db, table);
    const cols = (db.prepare(`pragma table_info(${table})`).all() as { name: string }[]).map((c) => c.name);
    const before = db.prepare(`select * from ${table}`).all();
    for (const key of keys) {
      // Change every column that belongs only to the OTHER keys, so the new row collides on this key alone.
      const others = new Set(keys.filter((k) => k !== key).flat().filter((c) => !key.includes(c)));
      const select = cols.map((c) => (others.has(c) ? `case typeof(${c}) when 'integer' then ${c} + 1000 else ${c} || 'x' end` : c)).join(", ");
      for (const verb of ["insert or replace into", "replace into"]) {
        expect(codeOf(db, `${verb} ${table} select ${select} from ${table}`), `${table}: ${verb} colliding on ${key.join("+")}`).toBe(TRIGGER);
      }
    }
    expect(db.prepare(`select * from ${table}`).all()).toEqual(before);
    db.close();
  });

  // The generator in migrations.ts only emits per-column guards, so a composite UNIQUE key has no real example in
  // the schema. The checker itself is therefore proven on a synthetic table.
  describe("the checker understands composite keys (synthetic table)", () => {
    const synthetic = (guardWhere: string, extra = ""): Database => {
      const db = new Database(":memory:");
      db.exec(`create table t (a text, b text, c text, unique (a, b)${extra});
        create trigger t_no_replace before insert on t when exists (select 1 from t where ${guardWhere})
        begin select raise(abort, 'no replace'); end;`);
      return db;
    };
    it("accepts a guard on the whole composite key", () => {
      const db = synthetic("(a = NEW.a AND b = NEW.b)");
      expect(compareGuard(uniqueKeys(db, "t"), guardKeys(db, "t"))).toEqual({ incomplete: [], overBroad: [] });
      expect(codeOf(db, "insert into t values ('1', 'x', 'c')")).toBe("no error");
      expect(codeOf(db, "insert into t values ('1', 'y', 'c')")).toBe("no error"); // shares only a: no conflict, not blocked
      expect(codeOf(db, "insert or replace into t values ('1', 'x', 'z')")).toBe(TRIGGER); // the full key collides
    });
    it("reports a per-column guard as both incomplete and over-broad", () => {
      const db = synthetic("a = NEW.a OR b = NEW.b");
      expect(compareGuard(uniqueKeys(db, "t"), guardKeys(db, "t"))).toEqual({ incomplete: ["a+b"], overBroad: ["a", "b"] });
      codeOf(db, "insert into t values ('1', 'x', 'c')");
      expect(codeOf(db, "insert into t values ('1', 'y', 'c')")).toBe(TRIGGER); // wrongly blocked
    });
    it("reports a unique key that no guard covers", () => {
      const db = synthetic("(a = NEW.a AND b = NEW.b)", ", unique (c)");
      expect(compareGuard(uniqueKeys(db, "t"), guardKeys(db, "t"))).toEqual({ incomplete: ["c"], overBroad: [] });
    });
  });
});

// ------------------------------------------------------------------- PRAGMA ignore_check_constraints

// A same-user connection can switch CHECK enforcement off for itself. This documents what that does and does not
// open up; it is a limit of the design (GR-23 is not claimed), not something the store can prevent.
describe("same-user bypass: PRAGMA ignore_check_constraints", () => {
  const bypassed = (path: string): Database => {
    const db = new Database(path);
    db.pragma("ignore_check_constraints = ON");
    expect(db.pragma("ignore_check_constraints", { simple: true })).toBe(1); // the pragma really took effect
    return db;
  };

  it("lets rows that violate the table CHECKs be inserted", () => {
    const db = bypassed(seeded());
    expect(codeOf(db, `insert into runs (id, mode, guard_mode, status, terminal_reason, started_at, ended_at, data)
                       values (?, 'authorized', 'full', 'running', null, ?, null, '{}')`, f.uuid(9), f.NOW)).toBe("no error");
    expect(codeOf(db, `insert into evidence (id, kind, class, encrypted, redaction_status, expires_at, execution_record_id, data)
                       values (?, 'console', 'restricted', 0, 'redacted', ?, ?, '{}')`, f.hex("1"), f.NOW, f.uuid(5))).toBe("no error");
    expect(codeOf(db, `insert into policy_decisions (id, run_id, subject, decision, action_class, at, prev_hash, hash, data)
                       values (?, ?, 'request', 'allow', 'A3', ?, null, ?, '{}')`, f.uuid(40), makeRun(1).id, f.NOW, f.hex("a"))).toBe("no error");
    db.close();
  });

  it("does not switch the append-only triggers off", () => {
    const db = bypassed(seeded());
    for (const table of ["evidence", "evidence_events", "policy_decisions", "schema_migrations"]) {
      expect(codeOf(db, `delete from ${table}`), `${table} delete`).toBe(TRIGGER);
      expect(codeOf(db, `insert or replace into ${table} select * from ${table}`), `${table} replace`).toBe(TRIGGER);
    }
    expect(codeOf(db, "update evidence_events set type = 'created'")).toBe(TRIGGER);
    db.close();
  });

  it("a bypass-inserted allow/A3 decision is reported by verifyChains as an invalid record", () => {
    const p = seeded();
    const s = openStore(p);
    const last = s.listPolicyDecisions(makeRun(1).id).at(-1)!;
    const forged: Record<string, unknown> = { ...last, id: f.uuid(900), prevHash: last.hash, decision: "allow", actionClass: "A3" };
    delete forged["hash"];
    const hash = sha256Hex(canonicalJson(forged));
    const data = JSON.stringify({ ...forged, hash });
    const db = bypassed(p);
    expect(codeOf(db, `insert into policy_decisions (id, run_id, subject, decision, action_class, at, prev_hash, hash, data)
                       values (?, ?, ?, 'allow', 'A3', ?, ?, ?, ?)`, f.uuid(900), last.runId, last.subject, last.at, last.hash, hash, data)).toBe("no error");
    db.close();
    // The raw insert also carries no row link (the column default), so the row is reported twice.
    expect(s.verifyChains()).toEqual([
      expect.objectContaining({ table: "policy_decisions", problem: "invalid_record" }),
      expect.objectContaining({ table: "policy_decisions", problem: "row_link_mismatch" }),
    ]);
    s.close();
  });

  it("a bypass-inserted run that does not match the record schema cannot be read back", () => {
    const p = seeded();
    const db = bypassed(p);
    expect(codeOf(db, `insert into runs (id, mode, guard_mode, status, terminal_reason, started_at, ended_at, data)
                       values (?, 'authorized', 'full', 'running', null, ?, null, '{}')`, f.uuid(9), f.NOW)).toBe("no error");
    db.close();
    const s = openStore(p);
    expect(() => s.getRun(f.uuid(9))).toThrow();
    s.close();
  });
});
