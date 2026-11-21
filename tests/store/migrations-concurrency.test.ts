import type { Statement } from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import { MIGRATIONS, StoreError, openStore, sha256Hex, type Migration, type Store } from "@qa-sentinel/store";
// Internals, imported by path on purpose: neither is part of the package's public surface, and this test
// needs to run applyMigrations on a connection it controls.
import { openDriver, type Db } from "../../packages/store/src/driver.js";
import { applyMigrations } from "../../packages/store/src/migrations.js";
import { cleanup, dbFile, legacyV1Db } from "./helpers.js";

afterEach(cleanup);

const NOW = (): Date => new Date("2026-11-17T10:00:00.000Z");
const first = MIGRATIONS[0]!;
const LEDGER_READ = /^\s*SELECT version, checksum FROM schema_migrations/i;

/**
 * Deterministic interleaving without timing: wraps a connection so that, the first time the migration
 * ledger is read, `peer` runs to completion (on its own connection) before the read returns its rows.
 * The caller therefore continues with a stale view of the ledger, exactly as if another process had
 * finished migrating between its read and its write transaction.
 */
function withPeerAfterFirstLedgerRead(db: Db, peer: () => void): { db: Db; fired: () => number } {
  let fired = 0;
  const wrapStatement = (st: Statement): Statement =>
    new Proxy(st, {
      get(target, key) {
        const value: unknown = Reflect.get(target, key, target);
        if (key === "all") {
          return (...params: unknown[]): unknown[] => {
            const rows = target.all(...params);
            if (fired === 0) {
              fired++;
              peer();
            }
            return rows;
          };
        }
        return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(target) : value;
      },
    });
  const wrapped = new Proxy(db, {
    get(target, key) {
      const value: unknown = Reflect.get(target, key, target);
      if (key === "prepare") {
        return (sql: string): Statement => {
          const st = target.prepare(sql);
          return LEDGER_READ.test(sql) ? wrapStatement(st) : st;
        };
      }
      return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(target) : value;
    },
  });
  return { db: wrapped, fired: () => fired };
}

const rows = (db: Db, sql: string): unknown[] => db.prepare(sql).all();
const codeOf = (fn: () => unknown): string | undefined => {
  try {
    fn();
  } catch (e) {
    return e instanceof StoreError ? e.code : `other:${(e as Error).message}`;
  }
  return undefined;
};

describe("migrations when another opener finishes inside the read-to-write window", () => {
  it("fresh database: the late opener skips what the peer already applied", () => {
    const p = dbFile();
    const b = openDriver(p, 1000);
    let a: Store | undefined;
    const race = withPeerAfterFirstLedgerRead(b, () => {
      a = openStore(p);
    });
    expect(() => applyMigrations(race.db, MIGRATIONS, NOW)).not.toThrow();
    expect(race.fired()).toBe(1);
    expect(rows(b, "select version, name, checksum from schema_migrations")).toEqual([
      { version: 1, name: first.name, checksum: sha256Hex(first.sql) },
      { version: 2, name: MIGRATIONS[1]!.name, checksum: sha256Hex(MIGRATIONS[1]!.sql) },
    ]);
    expect(a?.verifySchema()).toEqual([]);
    a?.close();
    b.close();
  });

  it("upgrade: two openers of the same new version apply it exactly once", () => {
    const extra: Migration = { version: 3, name: "extra", sql: "CREATE TABLE extra_t (x INTEGER) STRICT;" };
    const both = [...MIGRATIONS, extra];
    const p = dbFile();
    openStore(p).close(); // the database is at the latest built-in version (2)

    const b = openDriver(p, 1000);
    let a: Store | undefined;
    const race = withPeerAfterFirstLedgerRead(b, () => {
      a = openStore(p, { migrations: both });
    });
    expect(() => applyMigrations(race.db, both, NOW)).not.toThrow();
    expect(race.fired()).toBe(1);
    expect(rows(b, "select version, name, checksum from schema_migrations order by version")).toEqual([
      { version: 1, name: first.name, checksum: sha256Hex(first.sql) },
      { version: 2, name: MIGRATIONS[1]!.name, checksum: sha256Hex(MIGRATIONS[1]!.sql) },
      { version: 3, name: "extra", checksum: sha256Hex(extra.sql) },
    ]);
    expect(rows(b, "select name from sqlite_master where name = 'extra_t'")).toEqual([{ name: "extra_t" }]);
    a?.close();
    b.close();
  });

  it("divergent peer: a ledger entry with a different checksum is refused, and the opener applies nothing", () => {
    // Same schema plus one extra table: a different checksum, but the peer's own openStore still works.
    const divergent: Migration = { ...first, sql: `${first.sql}\nCREATE TABLE other_t (x INTEGER) STRICT;` };
    const p = dbFile();
    const b = openDriver(p, 1000);
    let a: Store | undefined;
    const race = withPeerAfterFirstLedgerRead(b, () => {
      a = openStore(p, { migrations: [divergent, MIGRATIONS[1]!] });
    });
    expect(codeOf(() => applyMigrations(race.db, MIGRATIONS, NOW))).toBe("migration_mismatch");
    expect(race.fired()).toBe(1);
    // Only the peer's migrations are recorded; the late opener added no ledger row and ran none of its own SQL.
    expect(rows(b, "select version, checksum from schema_migrations")).toEqual([
      { version: 1, checksum: sha256Hex(divergent.sql) },
      { version: 2, checksum: sha256Hex(MIGRATIONS[1]!.sql) },
    ]);
    a?.close();
    b.close();
  });

  it("populated version-1 database: two openers upgrade it once and the boundary is recorded once with the legacy counts", () => {
    const { p } = legacyV1Db(); // 3 events and 2 decisions, no link column
    const b = openDriver(p, 1000);
    let a: Store | undefined;
    const race = withPeerAfterFirstLedgerRead(b, () => {
      a = openStore(p);
    });
    expect(() => applyMigrations(race.db, MIGRATIONS, NOW)).not.toThrow();
    expect(race.fired()).toBe(1);
    expect(rows(b, "select version from schema_migrations order by version")).toEqual([{ version: 1 }, { version: 2 }]);
    expect(rows(b, "select table_name, boundary_seq, legacy_rows from row_link_boundaries order by table_name")).toEqual([
      { table_name: "evidence_events", boundary_seq: 3, legacy_rows: 3 },
      { table_name: "policy_decisions", boundary_seq: 2, legacy_rows: 2 },
    ]);
    expect(a?.verifyChains()).toEqual([]);
    expect(a?.verifySchema()).toEqual([]);
    a?.close();
    b.close();
  });
});
