import { describe, expect, test } from "vitest";
import { indent } from "./format";

describe("indent", () => {
  test("don't indent empty lines", () => {
    const res = indent(
      `foo

bar`,
      "  ",
    );
    expect(res).toBe(`  foo

  bar`);
  });

  test("don't indent lines with only whitespaces", () => {
    const res = indent(
      `foo
\t
bar`,
      "  ",
    );
    expect(res).toBe(`  foo
\t
  bar`);
  });

  test("override skipLines", () => {
    const res = indent(
      `foo

bar`,
      "#",
      false,
    );
    expect(res).toBe(`#foo
#
#bar`);
  });
});
