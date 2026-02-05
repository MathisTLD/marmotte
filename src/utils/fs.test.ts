import { expect, test } from "vitest";
import { resolveEntries } from "./fs";

test("resolveEntries", async () => {
  expect(await resolveEntries(import.meta.dirname, /\.foo$/)).toEqual({});
  expect(await resolveEntries(import.meta.dirname, /\.test\.ts$/)).toEqual({
    "fs.test": import.meta.filename,
  });
});
