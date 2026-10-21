import { expect, test } from "vitest";

import { resolveConfig } from "vite";
import dts, { getDTSPluginOptions, type PluginOptions } from "./dts";

test("retrieve dts options", async () => {
  const options: PluginOptions = { tsconfigPath: "./path/to/tsconfig.json" };
  const config = await resolveConfig(
    {
      configFile: false,
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
        configFile: false,
        plugins: [],
      },
      "build",
    ).then(getDTSPluginOptions),
  ).rejects.toThrow();
  await expect(
    resolveConfig(
      {
        configFile: false,
        plugins: [dts(options), dts()],
      },
      "build",
    ).then(getDTSPluginOptions),
  ).rejects.toThrow();
});
