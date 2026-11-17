export type StoreErrorCode =
  | "not_found"
  | "invalid_transition"
  | "invalid_record"
  | "migration_mismatch"
  | "invalid_migrations";

/** Errors the store raises itself. Driver errors (for example SQLITE_BUSY) pass through unchanged. */
export class StoreError extends Error {
  readonly code: StoreErrorCode;
  constructor(code: StoreErrorCode, message: string) {
    super(message);
    this.name = "StoreError";
    this.code = code;
  }
}
