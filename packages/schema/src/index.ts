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

export type TargetProfile = z.infer<typeof targetProfileSchema>;
export type ProfileApproval = z.infer<typeof profileApprovalSchema>;
export type TestSpec = z.infer<typeof testSpecSchema>;
export type Run = z.infer<typeof runSchema>;
export type ExecutionRecord = z.infer<typeof executionRecordSchema>;
export type Evidence = z.infer<typeof evidenceSchema>;
export type Finding = z.infer<typeof findingSchema>;
export type EvidenceEvent = z.infer<typeof evidenceEventSchema>;
export type PolicyDecision = z.infer<typeof policyDecisionSchema>;
