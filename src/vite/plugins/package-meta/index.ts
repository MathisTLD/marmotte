import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import { ZPackageJson } from "../../../utils/package-json"; // don't use @ alias so we can import this in this project's vite config

/**
 * Injects process.env.VITE_PACKAGE_NAME and process.env.VITE_PACKAGE_VERSION
 */
export function PackageMeta(): Plugin {
  return {
    name: "package-meta",
    enforce: "post",
    // using the `configResolved` hook doesn't work so me use the `config` hook with `enforce: "post"`
    config(config) {
      const pkgPath =
        // TODO: learn more about this env var
        process.env.npm_package_json ??
        resolve(config.root ?? process.cwd(), "package.json");
      if (statSync(pkgPath).isFile()) {
        const pkg = ZPackageJson.parse(
          JSON.parse(readFileSync(pkgPath, { encoding: "utf8" })),
        );
        process.env.VITE_PACKAGE_NAME = pkg.name;
        process.env.VITE_PACKAGE_VERSION = pkg.version;
      }
    },
  };
}
