import { expect, test } from "vitest";

import { resolveConfig } from "vite";
import dts, { getDTSPluginOptions, PluginOptions } from "./dts";

test("retrieve dts options", async () => {
  const options: PluginOptions = { tsconfigPath: "./path/to/tsconfig.json" };
  const config = await resolveConfig(
    {
      plugins: [dts(options)],
    },
    "build",
  );

  expect(getDTSPluginOptions(config)).toBe(options);
});

test("require exactly one instance", async () => {
  const options: PluginOptions = { tsconfigPath: "./path/to/tsconfig.json" };
  await expect(
    resolveConfig(
      {
        plugins: [],
      },
      "build",
    ).then(getDTSPluginOptions),
  ).rejects.toThrow();
  await expect(
    resolveConfig(
      {
        plugins: [dts(options), dts()],
      },
      "build",
    ).then(getDTSPluginOptions),
  ).rejects.toThrow();
});
