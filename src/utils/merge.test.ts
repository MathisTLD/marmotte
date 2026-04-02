import { describe, expect, test } from "vitest";
import { deepMerge, withDefaults } from "./merge";

describe("deepMerge", () => {
  test("primitives: override wins", () => {
    expect(deepMerge({ a: 1, b: 2 }, { b: 99 })).toEqual({ a: 1, b: 99 });
  });

  test("primitives: undefined in override is skipped", () => {
    expect(deepMerge({ a: 1 }, { a: undefined })).toEqual({ a: 1 });
  });

  test("arrays: concatenated (base first)", () => {
    expect(deepMerge({ x: [1, 2] }, { x: [3, 4] })).toEqual({ x: [1, 2, 3, 4] });
  });

  test("plain objects: merged recursively", () => {
    expect(deepMerge({ opts: { a: 1, b: 2 } }, { opts: { b: 99, c: 3 } })).toEqual({
      opts: { a: 1, b: 99, c: 3 },
    });
  });

  test("nested arrays are concatenated", () => {
    expect(deepMerge({ opts: { exclude: ["a"] } }, { opts: { exclude: ["b"] } })).toEqual({
      opts: { exclude: ["a", "b"] },
    });
  });

  test("override adds new keys", () => {
    expect(deepMerge({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
  });

  test("non-plain objects (e.g. class instances) are not recursed into — override wins", () => {
    const d1 = new Date(0);
    const d2 = new Date(1000);
    expect(deepMerge({ d: d1 }, { d: d2 })).toEqual({ d: d2 });
  });
});

describe("withDefaults", () => {
  type TestStructABC = Partial<{ a: number; b: number[]; c: number }>;
  test("withDefaults: no options returns defaults copy", () => {
    expect(withDefaults<TestStructABC>({ a: 1, b: [1, 2] })).toEqual({ a: 1, b: [1, 2] });
  });

  test("withDefaults: merges options onto defaults", () => {
    expect(withDefaults<TestStructABC>({ a: 1, b: [1] }, { b: [2], c: 3 })).toEqual({
      a: 1,
      b: [1, 2],
      c: 3,
    });
  });

  test("withDefaults: noDefaults skips defaults entirely", () => {
    expect(withDefaults<TestStructABC>({ a: 1, b: [1] }, { b: [99], noDefaults: true })).toEqual({
      b: [99],
    });
  });

  test("withDefaults: noDefaults strips the flag from the result", () => {
    const result = withDefaults<{ a?: number; b?: number[]; c?: number }>(
      { a: 1 },
      { noDefaults: true },
    );
    expect(result).not.toHaveProperty("noDefaults");
  });
});
