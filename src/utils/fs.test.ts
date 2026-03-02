import { expect, test } from "vitest";
import { resolveEntries } from "./fs";

test("resolveEntries", async () => {
  expect(await resolveEntries(import.meta.dirname, /\.foo$/)).toEqual({});
  expect(await resolveEntries(import.meta.dirname, /\.test\.ts$/)).toEqual({
    "codegen/format.test": import.meta.dirname + "/codegen/format.test.ts",
    "fs.test": import.meta.filename,
  });
});
