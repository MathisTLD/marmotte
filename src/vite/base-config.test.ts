import { expect, test } from "vitest";

import { type Plugin, resolveConfig } from "vite";
import { BaseConfig, DEFAULT_EXTENSION } from "./base-config";

test("preserve default extensions", async () => {
  const empty = await resolveConfig({}, "build");
  // a plugin that adds support for an extension
  const fooPlugin: Plugin = {
    name: "foo-plugin",
    config() {
      return {
        resolve: {
          extensions: [".foo"],
        },
      };
    },
  };
  // default extensions
  expect(empty.resolve.extensions).toEqual(DEFAULT_EXTENSION);
  // empty config with only the foo plugin with remove other extensions from the resolve config
  const withFoo = await resolveConfig({ plugins: [fooPlugin] }, "build");
  expect(withFoo.resolve.extensions).toEqual([".foo"]);

  // thanks to the the Common plugin, extension are preserved
  const withCommonAndFoo = await resolveConfig({ plugins: [BaseConfig(), fooPlugin] }, "build");
  expect(withCommonAndFoo.resolve.extensions).toEqual([...DEFAULT_EXTENSION, ".foo"]);
});
