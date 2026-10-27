import { resolve } from "node:path";
import type { Plugin } from "vite-plus";
import type { Options } from "@mrmt/unplugin-typedoc";

/**
 * API reference of a package's **public** entries (its `pack.entry`), generated into `docs/api/`
 * (gitignored) as part of its build. Opt-in: only packages whose option types people look up use it.
 *
 * The package must list `@mrmt/unplugin-typedoc` as a `workspace:^` dependency so `vp` builds the
 * plugin first. It is loaded when the build starts, not when this file is evaluated: package configs
 * are evaluated to build the task graph, before anything (the plugin included) is built.
 * `@mrmt/utils` and the plugin itself can't use it (cyclic graph).
 */
export function apiDocs(dir: string, entry: Record<string, string>): Plugin {
  const options: Options = {
    root: dir,
    out: resolve(dir, "docs/api"),
    entryPoints: Object.values(entry).map((file) => resolve(dir, file)),
  };
  // a variable, not a literal: the config bundler must not try to resolve the (unbuilt) package
  const specifier = "@mrmt/unplugin-typedoc";
  let typedoc: any; // the real plugin, loaded in `buildStart`

  return {
    name: "marmotte:typedoc:lazy",
    async buildStart(input) {
      typedoc = (await import(/* @vite-ignore */ specifier)).rolldown(options);
      return typedoc.buildStart.call(this, input);
    },
    buildEnd(error) {
      return typedoc.buildEnd.call(this, error);
    },
  };
}
