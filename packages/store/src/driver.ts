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

/** Opens a connection with the settings the store relies on, and verifies they took effect. */
export function openDriver(path: string, timeoutMs: number): Db {
  const db = new Database(path, { timeout: timeoutMs });
  try {
    if (path !== ":memory:") {
      const mode = db.pragma("journal_mode = WAL", { simple: true });
      if (mode !== "wal") throw new Error(`could not enable WAL (journal_mode is ${String(mode)})`);
    }
    db.pragma("foreign_keys = ON");
    // Defence in depth: with recursive triggers on, INSERT OR REPLACE also fires delete triggers.
    // The schema's BEFORE INSERT guards do not depend on this, so other connections stay protected.
    db.pragma("recursive_triggers = ON");
    if (db.pragma("foreign_keys", { simple: true }) !== 1) throw new Error("foreign keys are not enforced");
    if (db.pragma("recursive_triggers", { simple: true }) !== 1) throw new Error("recursive triggers are not on");
    return db;
  } catch (e) {
    db.close();
    throw e;
  }
}

/** The SQLite error code (for example "SQLITE_BUSY") of a driver error, or undefined for anything else. */
export const sqliteErrorCode = (e: unknown): string | undefined =>
  e instanceof Database.SqliteError ? e.code : undefined;
