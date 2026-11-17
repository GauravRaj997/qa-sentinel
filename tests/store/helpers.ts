import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { evidenceSchema, runSchema, type Evidence, type Run } from "@qa-sentinel/schema";
import * as f from "../schema/factories.js";

const dirs: string[] = [];
export const tmpDir = (): string => {
  const d = mkdtempSync(join(tmpdir(), "qa-store-"));
  dirs.push(d);
  return d;
};
export const dbFile = (): string => join(tmpDir(), "store.db");
export const cleanup = (): void => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
};

/** A valid running Run with a distinct id per n. */
export const makeRun = (n: number, over: Record<string, unknown> = {}): Run =>
  runSchema.parse({ ...f.validRun(), id: f.uuid(100 + n), ...over });

/** A valid Evidence row; the id (sha256) differs per hex digit. */
export const makeEvidence = (digit = "f", over: Record<string, unknown> = {}): Evidence =>
  evidenceSchema.parse({ ...f.validEvidence(), id: f.hex(digit), ...over });

export const eventInput = (evidenceId: string, type = "accessed") => ({
  evidenceId,
  type: type as "accessed",
  actor: { label: "runner", osUser: "someuser", method: "cli" },
  at: f.NOW,
});

export const decisionInput = (runId: string, rule = "non-safe-method", actionClass: "A0" | "A1" | "A2" | "A3" = "A2") => ({
  runId,
  subject: "request" as const,
  decision: "deny" as const,
  actionClass,
  rule,
  reason: "POST is not a safe method",
  at: f.NOW,
});
