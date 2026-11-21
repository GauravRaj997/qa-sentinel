// The only module that imports the SQLite driver. Everything else goes through this file, and the
// driver is typed by the locally maintained declaration in better-sqlite3.d.ts.
import Database from "better-sqlite3";

export type { Statement } from "better-sqlite3";
export type Db = Database;

// Durability. Observed on this build (SQLite 3.54.1 via better-sqlite3 13.2.0, Node 24, macOS): PRAGMA synchronous
// is 2 (FULL), the driver default, both before and after WAL is enabled. This module does not set or change it.
// Tested: only recovery from an uncommitted transaction after the process is killed (SIGKILL). The uncommitted
// write is absent after reopening, and the run still reads `running` (tests/store/runs-chains.test.ts, "crash
// recovery"). Not established: durability of a committed transaction across process termination. No test kills a
// process after a commit and then checks that the data survived. Not tested and not claimed: OS-crash and
// power-loss durability.

// WAL initialization. Switching a database to WAL needs locks that SQLite will not wait for: when waiting could
// deadlock, it returns SQLITE_BUSY at once and never calls the busy handler. Observed: with another process holding
// the write-intent lock, `PRAGMA journal_mode = WAL` fails immediately even with a 5 s busy timeout, so two processes
// opening the same fresh workspace can fail. So during initialization SQLite's own waiting is off (timeout 0) and
// this module does all the waiting itself: it retries only SQLITE_BUSY, with jittered doubling sleeps, until a
// monotonic deadline (the store's busy timeout, 5 s by default) that starts when openDriver starts, so connection
// construction is inside the budget.
//
// Guarantee, exactly: no SQLite call and no sleep starts after the deadline, with one exemption: the first attempt
// always runs, even after a slow construction, and none of its calls is deadline-checked. Time spent in every earlier
// call and sleep is consumed from the budget. Total elapsed time can exceed the budget only by: the construction call
// crossing the deadline; the rest of the exempt first attempt (up to three calls, if its earlier calls return
// non-error results after the deadline; an error, busy included, ends the attempt at once); the one in-flight call of
// a later attempt; or the one sleep wake-up that crosses the deadline. After an attempt ends in an error at or after
// the deadline, no retry, sleep or new attempt starts. A call that starts before the deadline and returns `wal`
// after it is accepted. A running synchronous SQLite call cannot be interrupted, so with stalled filesystem I/O the
// overshoot is unbounded; no hard wall-clock maximum is claimed. This bound covers WAL initialization only, not
// openStore as a whole.
const BACKOFF_MIN_MS = 2;
const BACKOFF_MAX_MS = 50;

/** Everything openDriver needs from the outside world, so tests can drive a simulated clock. Internal, not exported by the package. */
export interface DriverSeams {
  open(path: string, timeoutMs: number): Db;
  now(): number;
  sleep(ms: number): void;
  random(): number;
}
export const realSeams: DriverSeams = {
  open: (path, timeoutMs) => new Database(path, { timeout: timeoutMs }),
  now: () => performance.now(),
  sleep: (ms) => void Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms),
  random: () => Math.random(),
};

const isBusy = (e: unknown): boolean => sqliteErrorCode(e)?.startsWith("SQLITE_BUSY") === true;

function enableWal(db: Db, deadline: number, seams: DriverSeams): void {
  let delay = BACKOFF_MIN_MS;
  let lastBusy: unknown;
  for (let attempt = 0; ; attempt++) {
    // The first attempt is exempt from deadline checks; every later call starts only strictly before the deadline.
    const mayCall = (): boolean => attempt === 0 || seams.now() < deadline;
    try {
      if (!mayCall()) break;
      if (db.pragma("journal_mode", { simple: true }) === "wal") return; // persistent: nothing to write
      if (!mayCall()) break;
      if (db.pragma("journal_mode = WAL", { simple: true }) === "wal") return;
      if (!mayCall()) break;
      const mode = db.pragma("journal_mode", { simple: true });
      if (mode === "wal") return;
      throw new Error(`could not enable WAL (journal_mode is ${String(mode)})`);
    } catch (e) {
      if (!isBusy(e)) throw e;
      lastBusy = e;
    }
    const remaining = deadline - seams.now();
    if (remaining <= 0) break;
    seams.sleep(Math.min(remaining, Math.max(1, Math.round(delay * (0.5 + seams.random() * 0.5)))));
    delay = Math.min(delay * 2, BACKOFF_MAX_MS);
    if (seams.now() >= deadline) break;
  }
  // Only reachable after a busy attempt (the first attempt cannot be refused), so there is always an error to report.
  throw lastBusy;
}

/** Opens a connection with the settings the store relies on, and verifies they took effect. */
export function openDriver(path: string, timeoutMs: number): Db {
  return openDriverWith(path, timeoutMs, realSeams);
}

export function openDriverWith(path: string, timeoutMs: number, seams: DriverSeams): Db {
  const deadline = seams.now() + timeoutMs;
  // Construction failure: no connection exists, nothing to close, the error propagates unchanged.
  const db = seams.open(path, 0);
  try {
    if (path !== ":memory:") enableWal(db, deadline, seams);
    db.pragma(`busy_timeout = ${String(timeoutMs)}`);
    if (db.pragma("busy_timeout", { simple: true }) !== timeoutMs) throw new Error("busy timeout was not restored");
    db.pragma("foreign_keys = ON");
    // Defence in depth: with recursive triggers on, INSERT OR REPLACE also fires delete triggers.
    // The schema's BEFORE INSERT guards do not depend on this, so other connections stay protected.
    db.pragma("recursive_triggers = ON");
    if (db.pragma("foreign_keys", { simple: true }) !== 1) throw new Error("foreign keys are not enforced");
    if (db.pragma("recursive_triggers", { simple: true }) !== 1) throw new Error("recursive triggers are not on");
    return db;
  } catch (e) {
    try {
      db.close();
    } catch {
      // A close failure is deliberately ignored in favour of the original error. The connection's state is then
      // unknown: it may still be open.
    }
    throw e;
  }
}

/** The SQLite error code (for example "SQLITE_BUSY") of a driver error, or undefined for anything else. */
export const sqliteErrorCode = (e: unknown): string | undefined =>
  e instanceof Database.SqliteError ? e.code : undefined;
