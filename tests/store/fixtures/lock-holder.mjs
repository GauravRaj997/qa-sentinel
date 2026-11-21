// Test fixture: a separate process that holds SQLite's write-intent lock (BEGIN IMMEDIATE) on a database for a while.
// Usage: node lock-holder.mjs <db path> <hold ms>. Prints "held" once the lock is taken, releases it after <hold ms>.
import Database from "better-sqlite3";

const [, , path, holdMs] = process.argv;
const db = new Database(path, { timeout: 0 });
db.exec("BEGIN IMMEDIATE");
process.stdout.write("held\n");
setTimeout(() => {
  db.exec("COMMIT");
  db.close();
}, Number(holdMs));
