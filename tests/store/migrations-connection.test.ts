import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import { MIGRATIONS, StoreError, openStore, sha256Hex } from "@qa-sentinel/store";
import * as f from "../schema/factories.js";
import { cleanup, dbFile, eventInput, makeEvidence, makeRun } from "./helpers.js";

afterEach(cleanup);

const rows = (path: string, sql: string): unknown[] => {
  const d = new Database(path);
  try {
    return d.prepare(sql).all();
  } finally {
    d.close();
  }
};
const exec = (path: string, sql: string): void => {
  const d = new Database(path);
  try {
    d.exec(sql);
  } finally {
    d.close();
  }
};
const codeOf = (fn: () => unknown): string | undefined => {
  try {
    fn();
  } catch (e) {
    return e instanceof StoreError ? e.code : `other:${(e as Error).message}`;
  }
  return undefined;
};
const first = MIGRATIONS[0]!;

describe("migrations", () => {
  it("applies the initial migration to a fresh database and records its checksum", () => {
    const p = dbFile();
    openStore(p).close();
    expect(rows(p, "select version, name, checksum from schema_migrations")).toEqual([
      { version: 1, name: first.name, checksum: sha256Hex(first.sql) },
      { version: 2, name: MIGRATIONS[1]!.name, checksum: sha256Hex(MIGRATIONS[1]!.sql) },
    ]);
  });
  it("is idempotent when the database is reopened", () => {
    const p = dbFile();
    openStore(p).close();
    openStore(p).close();
    expect(rows(p, "select count(*) c from schema_migrations")).toEqual([{ c: 2 }]);
  });
  it("refuses a database whose recorded checksum differs from the code (edited migration)", () => {
    const p = dbFile();
    openStore(p).close();
    exec(p, "drop trigger schema_migrations_no_update; update schema_migrations set checksum = 'x'");
    expect(codeOf(() => openStore(p))).toBe("migration_mismatch");
  });
  it("refuses a database that is newer than the code", () => {
    const p = dbFile();
    openStore(p).close();
    exec(p, "insert into schema_migrations values (3, 'future', 'x', 'now')");
    expect(codeOf(() => openStore(p))).toBe("migration_mismatch");
  });
  it("rolls a failing migration back as a unit", () => {
    const p = dbFile();
    const bad = { version: 2, name: "bad", sql: "create table half_done(x); this is not sql" };
    expect(codeOf(() => openStore(p, { migrations: [first, bad] }))).toMatch(/^other:/);
    expect(rows(p, "select name from sqlite_master where name = 'half_done'")).toEqual([]);
    expect(rows(p, "select version from schema_migrations")).toEqual([{ version: 1 }]);
    openStore(p).close();
  });
  it("rejects a migration list with a gap or duplicate version", () => {
    expect(codeOf(() => openStore(":memory:", { migrations: [{ ...first, version: 2 }] }))).toBe("invalid_migrations");
    expect(codeOf(() => openStore(":memory:", { migrations: [first, first] }))).toBe("invalid_migrations");
  });
});

describe("connection settings", () => {
  it("uses WAL, enforces foreign keys and turns recursive triggers on", () => {
    const s = openStore(dbFile());
    expect(s.diagnostics()).toEqual({ journalMode: "wal", foreignKeys: true, recursiveTriggers: true, schemaVersion: 2 });
    s.close();
  });
  it("works in memory", () => {
    const s = openStore(":memory:");
    expect(s.diagnostics().foreignKeys).toBe(true);
    s.insertRun(makeRun(1));
    expect(s.getRun(makeRun(1).id)?.status).toBe("running");
    s.close();
  });
  it("rejects a row that points at a missing parent", () => {
    const s = openStore(dbFile());
    let code: string | undefined;
    try {
      s.appendEvidenceEvent(eventInput(f.hex("9")));
    } catch (e) {
      code = (e as { code?: string }).code;
    }
    expect(code).toBe("SQLITE_CONSTRAINT_FOREIGNKEY");
    s.insertEvidence(makeEvidence("9"));
    s.close();
  });
  it("reports a busy database after the configured wait, not forever", () => {
    const p = dbFile();
    const s = openStore(p, { busyTimeoutMs: 0 });
    const holder = new Database(p);
    holder.exec("begin immediate");
    let code: string | undefined;
    try {
      s.insertRun(makeRun(1));
    } catch (e) {
      code = (e as { code?: string }).code;
    }
    expect(code).toBe("SQLITE_BUSY");
    holder.exec("rollback");
    holder.close();
    s.close();

    const slow = openStore(p, { busyTimeoutMs: 300 });
    const h2 = new Database(p);
    h2.exec("begin immediate");
    const t0 = performance.now();
    expect(() => slow.insertRun(makeRun(2))).toThrow();
    expect(performance.now() - t0).toBeGreaterThanOrEqual(250);
    h2.exec("rollback");
    h2.close();
    slow.close();
  });
});
