import type { z } from "zod";
import type {
  evidenceEventSchema,
  evidenceSchema,
  executionRecordSchema,
  findingSchema,
  policyDecisionSchema,
  profileApprovalSchema,
  runSchema,
  targetProfileSchema,
  testSpecSchema,
} from "./records.js";
import type { seededDefectManifestSchema, seededDefectSchema } from "./seeded-defects.js";

export { SCHEMA_VERSION } from "./common.js";
export {
  evidenceEventSchema,
  evidenceSchema,
  executionRecordSchema,
  findingSchema,
  policyDecisionSchema,
  profileApprovalSchema,
  recordSchemas,
  RUN_STATUSES,
  runSchema,
  targetProfileSchema,
  TERMINAL_REASONS,
  testSpecSchema,
} from "./records.js";
export { exportJsonSchemas } from "./json-schema.js";
// Seeded-defect manifest: exported on its own, deliberately not part of recordSchemas (it is not a stored record).
export {
  CATEGORY_DETECTABLE,
  CATEGORY_ID_TOKEN,
  CATEGORY_OBSERVABLES,
  exportSeededDefectJsonSchema,
  OBSERVABLES,
  SEEDED_DEFECT_CATEGORIES,
  seededDefectLocationSchema,
  seededDefectManifestSchema,
  seededDefectSchema,
} from "./seeded-defects.js";
export type { Observable, SeededDefectCategory } from "./seeded-defects.js";

export type TargetProfile = z.infer<typeof targetProfileSchema>;
export type ProfileApproval = z.infer<typeof profileApprovalSchema>;
export type TestSpec = z.infer<typeof testSpecSchema>;
export type Run = z.infer<typeof runSchema>;
export type ExecutionRecord = z.infer<typeof executionRecordSchema>;
export type Evidence = z.infer<typeof evidenceSchema>;
export type Finding = z.infer<typeof findingSchema>;
export type EvidenceEvent = z.infer<typeof evidenceEventSchema>;
export type PolicyDecision = z.infer<typeof policyDecisionSchema>;
export type SeededDefect = z.infer<typeof seededDefectSchema>;
export type SeededDefectManifest = z.infer<typeof seededDefectManifestSchema>;
