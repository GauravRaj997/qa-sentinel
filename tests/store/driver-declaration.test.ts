import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";
import type { RunResult, SqliteError, Statement, TransactionFunction } from "better-sqlite3";
import { afterEach, describe, expect, expectTypeOf, it } from "vitest";
import { cleanup, dbFile, tmpDir } from "./helpers.js";

afterEach(cleanup);

const SRC = new URL("../../packages/store/src/", import.meta.url).pathname;

// Every member the local declaration may contain. Changing the declaration means changing this
// list, the declaration header, the README note and the store's driver usage together.
const APPROVED_MEMBERS = [
  "SqliteError", "all", "changes", "close", "code", "constructor", "exec", "fileMustExist", "get",
  "immediate", "inTransaction", "lastInsertRowid", "open", "pragma", "prepare", "readonly", "run",
  "timeout", "transaction",
];

describe("local better-sqlite3 declaration: scope", () => {
  it("declares exactly the approved members", () => {
    const text = readFileSync(join(SRC, "better-sqlite3.d.ts"), "utf8");
    const names = new Set<string>();
    for (const line of text.split("\n")) {
      const m = /^ {4}(?:static\s+)?(?:readonly\s+)?(\w+)\s*[?(<:]/.exec(line);
      if (m?.[1]) names.add(m[1]);
    }
    expect([...names].sort()).toEqual([...APPROVED_MEMBERS].sort());
  });
  it("documents that it is locally maintained", () => {
    const text = readFileSync(join(SRC, "better-sqlite3.d.ts"), "utf8");
    expect(text).toMatch(/LOCALLY MAINTAINED/);
    expect(text).toMatch(/Update this file whenever/);
  });
  it("is imported by driver.ts only, so no other file touches the raw driver", () => {
    for (const file of readdirSync(SRC).filter((n) => n.endsWith(".ts") && !n.endsWith(".d.ts"))) {
      const imports = /from\s+["']better-sqlite3["']/.test(readFileSync(join(SRC, file), "utf8"));
      expect(imports, file).toBe(file === "driver.ts");
    }
  });
});

describe("declared types", () => {
  it("have the declared shapes", () => {
    expectTypeOf<Database["prepare"]>().returns.toEqualTypeOf<Statement>();
    expectTypeOf<Statement["run"]>().returns.toEqualTypeOf<RunResult>();
    expectTypeOf<Statement["get"]>().returns.toEqualTypeOf<unknown>();
    expectTypeOf<Statement["all"]>().returns.toEqualTypeOf<unknown[]>();
    expectTypeOf<Database["open"]>().toEqualTypeOf<boolean>();
    expectTypeOf<Database["inTransaction"]>().toEqualTypeOf<boolean>();
    expectTypeOf<TransactionFunction<[number], string>["immediate"]>().returns.toEqualTypeOf<string>();
    expectTypeOf<SqliteError["code"]>().toEqualTypeOf<string>();
  });
});

describe("declared API behaves as declared on the real driver", () => {
  it("constructor and the open / inTransaction flags", () => {
    const db = new Database(":memory:");
    expect(db.open).toBe(true);
    expect(db.inTransaction).toBe(false);
    db.exec("begin");
    expect(db.inTransaction).toBe(true);
    db.exec("rollback");
    expect(db.close()).toBe(db);
    expect(db.open).toBe(false);
  });
  it("exec returns the connection; pragma has simple and array forms", () => {
    const db = new Database(":memory:");
    expect(db.exec("create table t(x)")).toBe(db);
    expect(db.pragma("user_version", { simple: true })).toBe(0);
    expect(db.pragma("user_version")).toEqual([{ user_version: 0 }]);
  });
  it("prepare gives run, get and all with the declared results", () => {
    const db = new Database(":memory:");
    db.exec("create table t(id integer primary key, v text)");
    const st: Statement = db.prepare("insert into t(v) values (?)");
    const r: RunResult = st.run("a");
    expect(r).toEqual({ changes: 1, lastInsertRowid: 1 });
    expect(typeof r.lastInsertRowid).toBe("number");
    expect(db.prepare("select * from t where id = ?").get(99)).toBeUndefined();
    expect(db.prepare("select v from t").all()).toEqual([{ v: "a" }]);
    expect(db.prepare("select v from t where id = :id").get({ id: 1 })).toEqual({ v: "a" });
  });
  it("transaction wraps a function, has .immediate, and rolls back when it throws", () => {
    const db = new Database(":memory:");
    db.exec("create table t(x)");
    const tx = db.transaction((n: number) => {
      db.prepare("insert into t values (?)").run(n);
      expect(db.inTransaction).toBe(true);
      return n * 2;
    });
    expect(typeof tx.immediate).toBe("function");
    expect(tx.immediate(3)).toBe(6);
    expect(tx(4)).toBe(8);
    const bad = db.transaction(() => {
      db.exec("insert into t values (99)");
      throw new Error("boom");
    });
    expect(() => bad.immediate()).toThrow("boom");
    expect(db.prepare("select count(*) c from t where x = 99").get()).toEqual({ c: 0 });
    expect(db.inTransaction).toBe(false);
  });
  it("options: readonly, fileMustExist and timeout are honoured", () => {
    const f = dbFile();
    const w = new Database(f);
    w.exec("create table t(x)");
    const ro = new Database(f, { readonly: true });
    expect(() => ro.exec("insert into t values (1)")).toThrow(/readonly/i);
    expect(() => new Database(join(tmpDir(), "missing.db"), { fileMustExist: true })).toThrow();
    w.exec("pragma journal_mode = wal");
    w.exec("begin immediate");
    const impatient = new Database(f, { timeout: 0 });
    const t0 = performance.now();
    expect(() => impatient.exec("begin immediate")).toThrow(/locked/i);
    expect(performance.now() - t0).toBeLessThan(250);
    const patient = new Database(f, { timeout: 300 });
    const t1 = performance.now();
    expect(() => patient.exec("begin immediate")).toThrow(/locked/i);
    expect(performance.now() - t1).toBeGreaterThanOrEqual(250);
    w.exec("rollback");
    for (const d of [w, ro, impatient, patient]) d.close();
  });
  it("SqliteError is exposed statically and carries a string code", () => {
    expect(typeof Database.SqliteError).toBe("function");
    const db = new Database(":memory:");
    db.exec("create table t(x integer primary key)");
    db.exec("insert into t values (1)");
    let err: unknown;
    try {
      db.exec("insert into t values (1)");
    } catch (e) {
      err = e;
    }
    expect(err instanceof Database.SqliteError).toBe(true);
    expect((err as SqliteError).code).toBe("SQLITE_CONSTRAINT_PRIMARYKEY");
    expect(err instanceof Error).toBe(true);
  });
});
