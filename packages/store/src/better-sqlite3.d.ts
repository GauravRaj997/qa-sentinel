// LOCALLY MAINTAINED type declarations for better-sqlite3 13.2.0 (the package ships no types, and
// @types/better-sqlite3 lags at 9.6.0). They cover ONLY the members packages/store uses; do not
// grow them into a copy of the full type package. Update this file whenever the store's driver
// usage or the pinned driver version changes, and update the approved member list in
// tests/store/driver-declaration.test.ts at the same time. That test checks every declared member
// against the real driver and fails when the declared set changes without the list being updated.
declare module "better-sqlite3" {
  export interface Options {
    readonly?: boolean;
    fileMustExist?: boolean;
    timeout?: number;
  }
  export interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }
  export interface Statement {
    run(...params: unknown[]): RunResult;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  }
  export interface TransactionFunction<A extends unknown[], R> {
    (...params: A): R;
    immediate(...params: A): R;
  }
  export interface SqliteError extends Error {
    code: string;
  }
  export default class Database {
    constructor(filename: string, options?: Options);
    readonly open: boolean;
    readonly inTransaction: boolean;
    prepare(source: string): Statement;
    exec(source: string): this;
    pragma(source: string, options?: { simple?: boolean }): unknown;
    transaction<A extends unknown[], R>(fn: (...params: A) => R): TransactionFunction<A, R>;
    close(): this;
    static readonly SqliteError: { new (message: string, code: string): SqliteError; readonly prototype: SqliteError };
  }
}
