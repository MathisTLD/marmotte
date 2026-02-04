import type { Plugin } from "vite";
import { DefaultVitePluginContext } from "../context";
import { PackageMeta } from "./package-meta";

/** see https://vite.dev/config/shared-options#resolve-extensions */
export const DEFAULT_EXTENSION = [".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json"];

/**
 * A vite plugin that injects a base configuration so that user don't have to.
 * - `@` alias for source dir
 * - preserve default `resolve.extensions` as they could be overwritten by other plugins (see https://vite.dev/config/shared-options#resolve-extensions)
 */
export function BaseConfig(): Plugin {
  return {
    name: "marmotte:base-config",
    config(cfg) {
      const ctx = new DefaultVitePluginContext({
        root: cfg.root ?? process.cwd(),
      });
      return {
        resolve: {
          // add alias to src dir
          alias: {
            "@": ctx.resolve("sourceDir"),
          },
          // preserve default extension (see the `preserve default extensions` test in ./common.test.ts)
          extensions: DEFAULT_EXTENSION,
        },
      };
    },
  };
}

/**
 * A bundle of plugins that should be in every final resolved configuration.
 * contains:
 * - {@link BaseConfig}
 * - {@link PackageMeta}
 */
export function BaseBundle() {
  return [BaseConfig(), PackageMeta()];
}
