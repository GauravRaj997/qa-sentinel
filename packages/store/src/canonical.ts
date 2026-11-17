import { createHash } from "node:crypto";

export const sha256Hex = (text: string): string => createHash("sha256").update(text, "utf8").digest("hex");

/**
 * Deterministic JSON: object keys sorted at every depth, no whitespace, undefined omitted.
 * Used for hash chains, so the same record always hashes the same.
 */
export function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  switch (typeof value) {
    case "string":
    case "boolean":
      return JSON.stringify(value);
    case "number":
      if (!Number.isFinite(value)) throw new TypeError("canonicalJson: non-finite number");
      return JSON.stringify(value);
    case "object": {
      if (Array.isArray(value)) return `[${value.map((v) => canonicalJson(v === undefined ? null : v)).join(",")}]`;
      const o = value as Record<string, unknown>;
      const parts = Object.keys(o)
        .filter((k) => o[k] !== undefined)
        .sort()
        .map((k) => `${JSON.stringify(k)}:${canonicalJson(o[k])}`);
      return `{${parts.join(",")}}`;
    }
    default:
      throw new TypeError(`canonicalJson: unsupported ${typeof value}`);
  }
}
