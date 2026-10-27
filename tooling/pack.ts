import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { PackUserConfig } from "vite-plus/pack";

/**
 * Shared per-package config for `vp pack` / `vp run`.
 *
 * - `pack`: ESM-only, bundled per entry (tree-shaken, incl. inlined private workspace packages like
 *   @mrmt/utils), types + sourcemaps. Injects the package's own name and version
 *   (`import.meta.env.VITE_PACKAGE_NAME` / `VITE_PACKAGE_VERSION`).
 * - `run`: `build` (and `test` when asked) tasks. Workspace dependencies use the `workspace:`
 *   protocol so vp orders builds itself; both tasks build the (dev)dependencies they consume first
 *   (e.g. @mrmt/vite for the CLI scaffold tests).
 *
 * API reference generation is not part of it: see `apiDocs` in ./typedoc.ts.
 */
export function packageConfig(
  dir: string,
  options: { pack?: PackUserConfig; test?: boolean } = {},
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
      },
      ...options.pack,
    } satisfies PackUserConfig,
    run: {
      tasks: {
        build: {
          command: "vp pack",
          dependsOn: [dependencies],
          // docs aren't build inputs (and TypeDoc rewrites docs/api during the build)
          cache: { input: [{ auto: true }, "!docs/**"] },
        },
        ...(options.test && {
          test: { command: "vp test run", dependsOn: ["build", dependencies] },
        }),
      },
    },
  };
}
