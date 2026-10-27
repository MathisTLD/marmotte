import { resolve } from "node:path";
import type { PackUserConfig } from "vite-plus/pack";
import type { Options } from "@mrmt/unplugin-typedoc";

type Plugin = NonNullable<PackUserConfig["plugins"]> extends (infer P)[] ? P : never;

/**
 * API reference of a package's **public** entries (its `pack.entry`), generated into `docs/api/`
 * (gitignored) as part of its build. Opt-in: only packages whose option types people look up use it.
 *
 * The package must list `@mrmt/unplugin-typedoc` as a `workspace:^` dependency so `vp` builds the
 * plugin first, and the import is deferred to `buildStart`: configs are evaluated to build the task
 * graph, before anything (the plugin included) is built. `@mrmt/utils` and the plugin itself can't
 * use it (cyclic graph).
 */
export function apiDocs(dir: string, entry: Record<string, string>): Plugin {
  const options: Options = {
    root: dir,
    out: resolve(dir, "docs/api"),
    entryPoints: Object.values(entry).map((file) => resolve(dir, file)),
  };
  // not a literal specifier so the config bundler doesn't try to resolve the (unbuilt) package
  const specifier = "@mrmt/unplugin-typedoc";
  let real: any;
  return {
    name: "marmotte:typedoc:lazy",
    async buildStart(...args: any[]) {
      real = (await import(/* @vite-ignore */ specifier)).rolldown(options);
      return real.buildStart?.apply(this, args);
    },
    buildEnd(...args: any[]) {
      return real?.buildEnd?.apply(this, args);
    },
  } as Plugin;
}
