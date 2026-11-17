import { z } from "zod";

/** Bumped only when a record's shape changes; every record carries it. */
export const SCHEMA_VERSION = 1 as const;

/** Lowercase sha256 hex digest (content hashes, hash chains, evidence ids). */
export const hex64 = z.string().regex(/^[0-9a-f]{64}$/, "expected a lowercase sha256 hex digest");

export const isoDateTime = z.iso.datetime();

/** Fields every record carries (architecture.md §4). */
export const baseFields = {
  id: z.uuid(),
  schemaVersion: z.literal(SCHEMA_VERSION),
  createdAt: isoDateTime,
};

export const actionClass = z.enum(["A0", "A1", "A2", "A3"]);
export const identityBasis = z.enum(["target_reported", "operator_asserted", "surfaceFingerprint"]);
export const evidenceKind = z.enum(["screenshot", "trace", "har", "console", "response", "dom", "axe", "download"]);
export const evidenceClass = z.enum(["public", "restricted"]);
export const maxStatus = z.enum(["confirmed", "suspected", "informational"]);
