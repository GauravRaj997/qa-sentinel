import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import { openStore } from "@qa-sentinel/store";
// Internals, imported by path on purpose: the seam is not part of the package's public surface.
import { openDriver, openDriverWith, realSeams, type Db, type DriverSeams } from "../../packages/store/src/driver.js";
import { cleanup, dbFile } from "./helpers.js";

afterEach(cleanup);

// ---- A simulated clock and a scripted fake connection -------------------------------------------------------------

const busy = (code = "SQLITE_BUSY"): Error => new Database.SqliteError("database is locked", code);
interface Beh {
  cost?: number;
  value?: unknown;
  error?: Error;
}
interface Call {
  sql: string;
  start: number;
  end: number;
}

/** `script(sql, n)` answers the n-th (0-based) journal_mode pragma; every other pragma behaves normally and is free. */
function sim(script: (sql: string, n: number) => Beh, o: { openCost?: number; closeFails?: boolean; openThrows?: Error } = {}) {
  const s = {
    t: 0,
    calls: [] as Call[],
    sleeps: [] as { start: number; ms: number }[],
    closes: 0,
    opened: [] as [string, number][],
    db: undefined as { open: boolean } | undefined,
    journal: (): Call[] => s.calls.filter((c) => c.sql.startsWith("journal_mode")),
  };
  let journalN = 0;
  let busyTimeout = 0;
  const seams: DriverSeams = {
    now: () => s.t,
    sleep: (ms) => {
      s.sleeps.push({ start: s.t, ms });
      s.t += ms;
    },
    random: () => 0.5,
    open: (p, timeout) => {
      s.opened.push([p, timeout]);
      s.t += o.openCost ?? 0;
      if (o.openThrows) throw o.openThrows;
      busyTimeout = timeout;
      const db = {
        open: true,
        pragma(sql: string): unknown {
          const start = s.t;
          let beh: Beh = {};
          if (sql.startsWith("journal_mode")) beh = script(sql, journalN++);
          s.t += beh.cost ?? 0;
          s.calls.push({ sql, start, end: s.t });
          if (beh.error) throw beh.error;
          if (sql.startsWith("journal_mode")) return beh.value;
          if (sql.startsWith("busy_timeout =")) busyTimeout = Number(sql.split("=")[1]);
          if (sql === "busy_timeout") return busyTimeout;
          return 1;
        },
        close() {
          s.closes++;
          if (o.closeFails) throw new Error("close failed");
          db.open = false;
          return db;
        },
      };
      s.db = db;
      return db as unknown as Db;
    },
  };
  return { s, seams, busyTimeout: () => busyTimeout };
}
const run = (e: ReturnType<typeof sim>, budget: number): { db?: Db; err?: unknown } => {
  try {
    return { db: openDriverWith("x.db", budget, e.seams) };
  } catch (err) {
    return { err };
  }
};
const wal: Beh = { value: "wal" };
const del: Beh = { value: "delete" };
const stuck = (cost = 0): Beh => ({ cost, error: busy() });

describe("WAL initialization, simulated clock", () => {
  it("opens with SQLite's own waiting off and restores it afterwards", () => {
    const e = sim(() => wal);
    expect(run(e, 5000).db).toBeDefined();
    expect(e.s.opened).toEqual([["x.db", 0]]);
    expect(e.busyTimeout()).toBe(5000);
  });

  it("an already-WAL database is only read, never written", () => {
    const e = sim(() => wal);
    expect(run(e, 5000).err).toBeUndefined();
    expect(e.s.journal().map((c) => c.sql)).toEqual(["journal_mode"]);
  });

  it("switches a rollback-mode database and accepts it", () => {
    const e = sim((_sql, n) => (n === 0 ? del : wal));
    expect(run(e, 5000).err).toBeUndefined();
    expect(e.s.journal().map((c) => c.sql)).toEqual(["journal_mode", "journal_mode = WAL"]);
  });

  it("retries busy attempts with sleeps and then succeeds", () => {
    const e = sim((_sql, n) => (n < 3 ? stuck(1) : wal));
    expect(run(e, 5000).err).toBeUndefined();
    expect(e.s.sleeps).toHaveLength(3);
    expect(e.s.sleeps.map((x) => x.ms)).toEqual([2, 3, 6]); // jitter 0.75 x doubling delay 2, 4, 8
  });

  it.each(["SQLITE_BUSY", "SQLITE_BUSY_SNAPSHOT", "SQLITE_BUSY_RECOVERY"])("treats %s as retryable", (code) => {
    const e = sim((_sql, n) => (n === 0 ? { error: busy(code) } : wal));
    expect(run(e, 5000).err).toBeUndefined();
    expect(e.s.sleeps).toHaveLength(1);
  });

  it("does not retry other errors, and rethrows the same object", () => {
    for (const err of [busy("SQLITE_LOCKED"), new Error("disk I/O error")]) {
      const e = sim(() => ({ error: err }));
      expect(run(e, 5000).err).toBe(err);
      expect(e.s.journal()).toHaveLength(1);
      expect(e.s.sleeps).toHaveLength(0);
      expect(e.s.closes).toBe(1);
    }
  });

  it("an unexpected mode fails after one confirming read and never falls back to another mode", () => {
    const e = sim(() => del);
    const { err } = run(e, 5000);
    expect((err as Error).message).toBe("could not enable WAL (journal_mode is delete)");
    expect(e.s.journal().map((c) => c.sql)).toEqual(["journal_mode", "journal_mode = WAL", "journal_mode"]);
    expect(e.s.sleeps).toHaveLength(0);
    expect(e.s.closes).toBe(1);
    expect(e.s.db?.open).toBe(false);
  });

  describe("a connection that stays locked", () => {
    const budget = 100;
    it("terminates, throws the latest busy error object, and starts nothing after the deadline", () => {
      const errors: Error[] = [];
      const e = sim(() => {
        const x = busy();
        errors.push(x);
        return { cost: 3, error: x };
      });
      const { err } = run(e, budget);
      expect(err).toBe(errors[errors.length - 1]);
      expect(sqliteCode(err)).toBe("SQLITE_BUSY");
      const firstSleep = e.s.sleeps[0]!.start;
      for (const c of e.s.calls) if (c.start >= firstSleep) expect(c.start).toBeLessThan(budget);
      for (const sl of e.s.sleeps) expect(sl.start + sl.ms).toBeLessThanOrEqual(budget);
      for (const sl of e.s.sleeps) expect(sl.ms).toBeLessThanOrEqual(50);
      expect(e.s.closes).toBe(1);
      expect(e.s.db?.open).toBe(false);
      // The last sleep is clamped to the remaining time, so a sleep ends exactly at the deadline and nothing else runs.
      expect(e.s.t).toBeLessThan(budget + 4);
    });

    it("a budget of 0 makes exactly one attempt and no sleep", () => {
      const e = sim(() => stuck());
      const { err } = run(e, 0);
      expect(sqliteCode(err)).toBe("SQLITE_BUSY");
      expect(e.s.journal()).toHaveLength(1);
      expect(e.s.sleeps).toHaveLength(0);
    });

    it("sleeps are clamped to the time that remains", () => {
      const e = sim(() => stuck());
      run(e, 5); // doubling delay would be 2, 4, 8: the second sleep is clamped
      for (const sl of e.s.sleeps) expect(sl.start + sl.ms).toBeLessThanOrEqual(5);
      expect(e.s.t).toBe(5);
    });
  });

  describe("overshoot of the deadline (budget 100)", () => {
    it("T1: the read starts before the deadline and returns busy after it: one call, no sleep, no retry", () => {
      const first = busy();
      const e = sim(() => ({ cost: 150, error: first }));
      const { err } = run(e, 100);
      expect(err).toBe(first);
      expect(e.s.journal()).toHaveLength(1);
      expect(e.s.sleeps).toHaveLength(0);
      expect(e.s.t).toBe(150);
      expect(e.s.closes).toBe(1);
      expect(e.s.db?.open).toBe(false);
    });

    it("T2a: the read crosses the deadline and returns delete; the exempt switch runs and a late wal is accepted", () => {
      const e = sim((_sql, n) => (n === 0 ? { cost: 150, value: "delete" } : { cost: 10, value: "wal" }));
      expect(run(e, 100).err).toBeUndefined();
      expect(e.s.journal()).toHaveLength(2);
      expect(e.s.sleeps).toHaveLength(0);
      expect(e.s.t).toBe(160);
    });

    it("T2b: ... and a busy switch is thrown with exactly two calls, no sleep, no retry", () => {
      const sw = busy();
      const e = sim((_sql, n) => (n === 0 ? { cost: 150, value: "delete" } : { cost: 10, error: sw }));
      expect(run(e, 100).err).toBe(sw);
      expect(e.s.journal()).toHaveLength(2);
      expect(e.s.sleeps).toHaveLength(0);
    });

    it("T2c: ... and a switch that returns delete runs the confirming read: three calls, unexpected-mode error", () => {
      const e = sim((_sql, n) => (n === 0 ? { cost: 150, value: "delete" } : { cost: 10, value: "delete" }));
      expect(((run(e, 100).err) as Error).message).toBe("could not enable WAL (journal_mode is delete)");
      expect(e.s.journal()).toHaveLength(3);
      expect(e.s.sleeps).toHaveLength(0);
    });

    it("A: a construction that crosses the deadline still gets its first attempt, and none after it", () => {
      const ok = sim((_sql, n) => (n === 0 ? del : wal), { openCost: 150 });
      expect(run(ok, 100).err).toBeUndefined();
      expect(ok.s.journal()).toHaveLength(2);
      const first = busy();
      const bad = sim(() => ({ error: first }), { openCost: 150 });
      expect(run(bad, 100).err).toBe(first);
      expect(bad.s.journal()).toHaveLength(1);
      expect(bad.s.sleeps).toHaveLength(0);
      expect(bad.s.closes).toBe(1);
    });

    it("a switch that starts before the deadline and returns wal after it is accepted (later attempt)", () => {
      const e = sim((_sql, n) => (n === 0 ? stuck(1) : n === 1 ? del : { cost: 500, value: "wal" }));
      expect(run(e, 100).err).toBeUndefined();
      expect(e.s.sleeps).toHaveLength(1);
      expect(e.s.t).toBeGreaterThan(100);
    });

    it("C: in a later attempt a call that would start at or after the deadline does not run", () => {
      // Attempt 1 busy (cost 1) then a sleep of 2; attempt 2 read costs 200 and returns delete, so the switch is past the deadline.
      const e = sim((_sql, n) => (n === 0 ? stuck(1) : { cost: 200, value: "delete" }));
      const { err } = run(e, 100);
      expect(sqliteCode(err)).toBe("SQLITE_BUSY");
      expect(e.s.journal()).toHaveLength(2); // the first busy read and the late second-attempt read; no switch
    });
  });

  describe("cleanup", () => {
    it("normal failure: closes exactly once and rethrows the original error", () => {
      const original = new Error("disk I/O error");
      const e = sim(() => ({ error: original }));
      expect(run(e, 100).err).toBe(original);
      expect(e.s.closes).toBe(1);
      expect(e.s.db?.open).toBe(false);
    });

    it("close failure: the original error is preserved untouched and close is not retried (db.open is not asserted)", () => {
      const original = busy();
      const e = sim(() => ({ error: original }), { closeFails: true });
      const { err } = run(e, 0);
      expect(err).toBe(original);
      expect(Object.keys(original)).toEqual(Object.keys(busy())); // nothing attached
      expect(e.s.closes).toBe(1);
      console.info(`observed db.open after a failing close(): ${String(e.s.db?.open)} (information only)`);
    });

    it("construction failure: nothing to close, the error propagates unchanged", () => {
      const original = new Error("unable to open database file");
      const e = sim(() => wal, { openThrows: original });
      expect(run(e, 100).err).toBe(original);
      expect(e.s.closes).toBe(0);
      expect(e.s.calls).toHaveLength(0);
    });

    it("a connection that fails after WAL (a later step) is also closed once", () => {
      const e = sim(() => wal);
      const seams: DriverSeams = {
        ...e.seams,
        open: (p, t) => {
          const db = e.seams.open(p, t) as unknown as { pragma: (s: string) => unknown };
          const inner = db.pragma.bind(db);
          db.pragma = (sql: string) => (sql === "foreign_keys" ? 0 : inner(sql));
          return db as unknown as Db;
        },
      };
      expect(() => openDriverWith("x.db", 100, seams)).toThrow("foreign keys are not enforced");
      expect(e.s.closes).toBe(1);
    });
  });
});

function sqliteCode(e: unknown): string | undefined {
  return (e as { code?: string }).code;
}

// ---- Real SQLite ---------------------------------------------------------------------------------------------------

const HOLDER = fileURLToPath(new URL("./fixtures/lock-holder.mjs", import.meta.url));
const rollbackDb = (): string => {
  const p = dbFile();
  const d = new Database(p);
  d.exec("create table t (x integer)");
  d.close(); // a populated database in rollback-journal mode
  return p;
};

async function holdInOtherProcess(path: string, ms: number): Promise<{ done: Promise<void> }> {
  const child = spawn(process.execPath, [HOLDER, path, String(ms)], { stdio: ["ignore", "pipe", "inherit"] });
  await new Promise<void>((resolve, reject) => {
    child.once("error", reject);
    child.stdout.once("data", () => resolve());
  });
  return { done: new Promise<void>((resolve) => child.once("exit", () => resolve())) };
}

describe("WAL initialization against real SQLite", () => {
  it("regression: another process holding the write-intent lock for a while no longer fails the open", async () => {
    const p = rollbackDb();
    const holder = await holdInOtherProcess(p, 300);
    const t0 = performance.now();
    const db = openDriver(p, 5000); // original code: SQLITE_BUSY at once, despite the 5 s timeout
    const elapsed = performance.now() - t0;
    expect(db.pragma("journal_mode", { simple: true })).toBe("wal");
    expect(elapsed).toBeLessThan(4000);
    db.close();
    await holder.done;
  });

  it("two stores opening the same fresh workspace both succeed", async () => {
    const p = dbFile();
    const a = openStore(p);
    const b = openStore(p);
    expect(a.diagnostics().journalMode).toBe("wal");
    expect(b.diagnostics().journalMode).toBe("wal");
    a.close();
    b.close();
  });

  // Each wraps the real connection so every PRAGMA call is timed. The accounting invariant is
  // elapsed = construction + sum(calls) + sum(sleeps) + small overhead, and no single call may be long, because
  // SQLite's own waiting is off during initialization.
  const SLACK_MS = 250;
  const MAX_CALL_MS = 50;
  function measured(path: string, budget: number) {
    const calls: number[] = [];
    let constructionMs = 0;
    let sleepMs = 0;
    let captured: Db | undefined;
    const seams: DriverSeams = {
      ...realSeams,
      sleep: (ms) => {
        const s0 = performance.now();
        realSeams.sleep(ms);
        sleepMs += performance.now() - s0; // measured, so wake-up latency is accounted for
      },
      open: (pth, timeout) => {
        const c0 = performance.now();
        const real = realSeams.open(pth, timeout);
        constructionMs = performance.now() - c0;
        captured = real;
        return new Proxy(real, {
          get(target, key) {
            const v: unknown = Reflect.get(target, key, target);
            if (key !== "pragma") return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(target) : v;
            return (...a: unknown[]): unknown => {
              const s = performance.now();
              try {
                return target.pragma(...(a as [string]));
              } finally {
                calls.push(performance.now() - s);
              }
            };
          },
        });
      },
    };
    const t0 = performance.now();
    let err: unknown;
    try {
      openDriverWith(path, budget, seams).close();
    } catch (e) {
      err = e;
    }
    const elapsed = performance.now() - t0;
    const sum = calls.reduce((x, y) => x + y, 0);
    const report = { elapsed, constructionMs, callsMs: sum, sleepMs, maxCall: Math.max(0, ...calls), attempts: calls.length, overshoot: elapsed - budget };
    console.info(JSON.stringify(report));
    return { err, report, captured: () => captured };
  }

  it("E1: a connection that cannot even be read fails with SQLITE_BUSY at the budget, and is closed", () => {
    const p = rollbackDb();
    const holder = new Database(p);
    holder.exec("BEGIN EXCLUSIVE");
    const { err, report, captured } = measured(p, 300);
    holder.exec("ROLLBACK");
    holder.close();
    expect(sqliteCode(err)).toBe("SQLITE_BUSY");
    expect(report.elapsed).toBeGreaterThanOrEqual(290);
    expect(report.elapsed).toBeLessThan(300 + SLACK_MS);
    expect(report.maxCall).toBeLessThan(MAX_CALL_MS);
    expect(Math.abs(report.elapsed - (report.constructionMs + report.callsMs + report.sleepMs))).toBeLessThan(25);
    expect(captured()?.open).toBe(false);
  });

  it("E2: a connection that reads but cannot switch fails with SQLITE_BUSY at the budget, and is closed", () => {
    const p = rollbackDb();
    const holder = new Database(p);
    holder.exec("BEGIN IMMEDIATE");
    const { err, report, captured } = measured(p, 300);
    holder.exec("ROLLBACK");
    holder.close();
    expect(sqliteCode(err)).toBe("SQLITE_BUSY");
    expect(report.elapsed).toBeGreaterThanOrEqual(290);
    expect(report.elapsed).toBeLessThan(300 + SLACK_MS);
    expect(report.maxCall).toBeLessThan(MAX_CALL_MS);
    expect(Math.abs(report.elapsed - (report.constructionMs + report.callsMs + report.sleepMs))).toBeLessThan(25);
    expect(captured()?.open).toBe(false);
  });
});
