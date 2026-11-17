import { describe, expect, it } from "vitest";
import { canonicalJson, sha256Hex } from "@qa-sentinel/store";

describe("canonicalJson", () => {
  it("sorts keys at every depth", () => {
    expect(canonicalJson({ b: 1, a: { d: 1, c: 2 } })).toBe('{"a":{"c":2,"d":1},"b":1}');
  });
  it("does not depend on insertion order", () => {
    expect(canonicalJson({ x: 1, y: [1, 2], z: null })).toBe(canonicalJson({ z: null, y: [1, 2], x: 1 }));
  });
  it("omits undefined, keeps null and array order", () => {
    expect(canonicalJson({ a: undefined, b: null, c: [2, 1] })).toBe('{"b":null,"c":[2,1]}');
  });
  it("escapes strings like JSON and rejects non-finite numbers", () => {
    expect(canonicalJson({ s: 'a"b\n' })).toBe('{"s":"a\\"b\\n"}');
    expect(() => canonicalJson({ n: Number.NaN })).toThrow();
    expect(() => canonicalJson({ n: Number.POSITIVE_INFINITY })).toThrow();
  });
});

describe("sha256Hex", () => {
  it("matches the published SHA-256 test vector", () => {
    expect(sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});
