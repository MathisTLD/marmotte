import type { Plugin } from "vite";

import dts, { type PluginOptions as DTSPluginOptions } from "./dts";
import { nodeExternals, type ExternalsOptions } from "./externals";
import { DefaultVitePluginContext } from "./lib/context";
import { type PathFilter, resolveEntries } from "@/utils/fs";
import { Docs, type Options as DocsPluginOptions } from "./docs";
import TypeDoc, { type Options as TypeDocPluginOptions } from "./typedoc";
import { BaseBundle } from "./base-config";

export type LibConfigPluginOptions = {
  /**
   * A filter to automatically add files from {@link UserVitePluginOptions.sourceDir} to entries.
   *
   * If not defined and no entry is manually added by the user in its vite config, `<sourceDir>/index.ts` will be used
   *
   * @example /(?<!\.d)(?<!\.test)(?<!\.test-d)\.ts$/
   * */
  entries?: PathFilter;
};

/**
 * Low-level plugin that sets the Vite build options for library mode.
 * Discovers entry points from `sourceDir` using the {@link LibConfigPluginOptions.entries} filter,
 * or falls back to `<sourceDir>/index.ts` when no entries or manual `build.lib.entry` are provided.
 *
 * Used internally by {@link Lib}. Prefer `Lib()` for most use cases.
 */
export function LibConfig(options: LibConfigPluginOptions): Plugin {
  const { entries } = options;
  return {
    name: "marmotte:lib-config",
    async config(cfg) {
      const ctx = new DefaultVitePluginContext({
        root: cfg.root ?? process.cwd(),
      });

      // this is deeply merged in cfg
      const entry = entries ? await resolveEntries(ctx.resolve("sourceDir"), entries) : {};
      if (!(cfg.build?.lib && cfg.build.lib.entry) && !entries) {
        // no entry specified, use default
        entry["index"] = ctx.resolve("sourceDir", "index.ts");
      }
      return {
        build: {
          minify: false,
          sourcemap: true,
          lib: {
            entry,
            // only build es modules by default
            formats: ["es"],
          },
          rollupOptions: {
            output: {
              preserveModules: true,
              preserveModulesRoot: ctx.resolve("sourceDir"),
            },
            treeshake: false,
          },
        },
      };
    },
  };
}

export type LibPluginOptions = LibConfigPluginOptions & {
  /** Options for the `vite-plugin-dts` (will be merged with defaults) */
  dts?: DTSPluginOptions;
  /** Options for the `rollup-plugin-node-externals` */
  externals?: ExternalsOptions;
  /** Options for the {@link Docs} plugin, use false to disable */
  docs?: DocsPluginOptions | false;
  /** Options for the {@link TypeDoc} plugin, use false to disable (disabled by default if `docs: false`) */
  typedoc?: TypeDocPluginOptions | false;
};

/**
 * Configures vite to build a library (can be node, browser or isomorphic)
 */
export function Lib(options: LibPluginOptions = {}) {
  const plugin: Plugin[] = [];

  const dtsOptions: DTSPluginOptions = {
    cleanVueFileName: true,
    compilerOptions: {
      // set to true to enable declarationMap
      declaration: true,
      // declarations map are useful with linked packages / monorepos
      declarationMap: true,
    },
    // don't create declarations for test-related files
    exclude: ["**/*.test.ts", "**/*.test-*.ts"],
    // TODO: proper merge
    ...options.dts,
  };
  // common
  plugin.push(
    ...BaseBundle(),
    dts(dtsOptions),
    // only bundle what's in devDependencies
    nodeExternals(options.externals),
  );
  if (options.docs !== false) {
    plugin.push(Docs(options.docs));
  }
  if (
    options.typedoc !== false &&
    // disable by default if docs disabled
    // but allow to force enabling manually
    !(options.docs === false && options.typedoc === undefined)
  ) {
    // TODO: inject tsconfig if possible
    plugin.push(TypeDoc(options.typedoc));
  }

  plugin.push(LibConfig(options));
  return plugin;
}
