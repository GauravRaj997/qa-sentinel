// Test helper: opens a store database through the raw driver, starts a write transaction on the
// running run, then dies by SIGKILL before committing (simulates a crashed QA Sentinel process).
import Database from "better-sqlite3";

const db = new Database(process.argv[2]);
db.exec("BEGIN IMMEDIATE");
db.exec("UPDATE runs SET data = json_set(data, '$.manifest.seed', 999) WHERE status = 'running'");
process.kill(process.pid, "SIGKILL");
