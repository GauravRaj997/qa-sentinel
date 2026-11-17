import { z } from "zod";
import { recordSchemas } from "./records.js";

/**
 * JSON Schema (draft 2020-12) for every record, keyed by record name.
 * Cross-field rules (for example "passed needs every step ok") are enforced by the
 * zod schemas only; JSON Schema cannot express them, so consumers must not treat a
 * JSON Schema match as full validation.
 */
export function exportJsonSchemas(): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(recordSchemas).map(([name, schema]) => [name, z.toJSONSchema(schema)]),
  );
}
