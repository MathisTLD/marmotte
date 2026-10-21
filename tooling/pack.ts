import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { PackUserConfig } from "vite-plus/pack";
import type { Options as TypeDocOptions } from "@mrmt/unplugin-typedoc";

type Plugin = NonNullable<PackUserConfig["plugins"]> extends (infer P)[] ? P : never;

/** `@mrmt/unplugin-typedoc`'s rolldown plugin, loaded only once the build actually starts */
function lazyTypeDoc(options: TypeDocOptions): Plugin {
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

/**
 * Shared per-package config for `vp pack` / `vp run`.
 *
 * - `pack`: ESM-only, bundled per entry (tree-shaken, incl. inlined private workspace packages like @mrmt/utils), types + sourcemaps. Injects the package's own
 *   name/version where the old Vite build used `PackageMeta` / `define`.
 *   Unless `api: false`, the TypeDoc plugin generates the package's API reference into
 *   `docs/api/` (gitignored) as part of the build. The plugin comes from @mrmt/unplugin-typedoc, which
 *   (transitively) depends on @mrmt/utils: those two opt out with `api: false`, or the build
 *   graph would be cyclic. The import is deferred to `buildStart` (see `lazyTypeDoc`): configs are
 *   evaluated to build the task graph, before anything (incl. @mrmt/unplugin-typedoc) is built.
 * - `run`: `build` (and `test` when asked) tasks. Workspace dependencies use the `workspace:`
 *   protocol so vp orders builds itself; both tasks build the (dev)dependencies they consume
 *   first (e.g. @mrmt/unplugin-typedoc for the API docs, @mrmt/vite for the CLI scaffold tests).
 */
export function packageConfig(
  dir: string,
  options: { pack?: PackUserConfig; test?: boolean; api?: boolean } = {},
) {
  const pkg = JSON.parse(readFileSync(resolve(dir, "package.json"), "utf8"));
  const dependencies = {
    task: "build",
    from: ["dependencies", "devDependencies"] as ("dependencies" | "devDependencies")[],
  };
  return {
    pack: {
      format: ["esm"],
      dts: true,
      // bundled (not unbundled) so unused code from inlined workspace packages is tree-shaken
      unbundle: false,
      // emit .js/.d.ts (not .mjs/.d.mts): packages are "type": "module"
      fixedExtension: false,
      sourcemap: "hidden",
      define: {
        "import.meta.env.VITE_PACKAGE_NAME": JSON.stringify(pkg.name),
        "import.meta.env.VITE_PACKAGE_VERSION": JSON.stringify(pkg.version),
        __MARMOTTE_VERSION__: JSON.stringify(pkg.version),
      },
      plugins:
        options.api === false
          ? []
          : [
              lazyTypeDoc({
                root: dir,
                out: resolve(dir, "docs/api"),
                exclude: ["**/*.test.ts", "**/*.test-d.ts"],
              }),
            ],
      ...options.pack,
    } satisfies PackUserConfig,
    run: {
      tasks: {
        build: {
          command: "vp pack",
          dependsOn: [dependencies],
          // TypeDoc cleans and rewrites docs/api: it's an output, not an input
          cache: { input: [{ auto: true }, "!docs/**"] },
        },
        ...(options.test && {
          test: { command: "vp test run", dependsOn: ["build", dependencies] },
        }),
      },
    },
  };
}
