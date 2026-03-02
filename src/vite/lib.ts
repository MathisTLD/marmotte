import type { Plugin } from "vite";

import dts, { type PluginOptions as DTSPluginOptions } from "./dts";
import { nodeExternals, type ExternalsOptions } from "rollup-plugin-node-externals";
import { DefaultVitePluginContext } from "./lib/context";
import { type PathFilter, resolveEntries } from "@/utils/fs";
import { Docs, type Options as DocsPluginOptions } from "./docs";
import { BaseBundle } from "./base-config";

export type LibConfigPluginOptions = {
  /**
   * A filter to automatically add files from {@link VitePluginPathOptions.sourceDir} to entries.
   *
   * Automatic entries are disabled if set to false.
   *
   * @default /(?<!\.d)(?<!\.test)(?<!\.test-d)\.ts$/
   * */
  entries?: PathFilter | false;
};

export function LibConfig(options: LibConfigPluginOptions): Plugin {
  const { entries = /(?<!\.d)(?<!\.test)(?<!\.test-d)\.ts$/ } = options;
  return {
    name: "marmotte:lib-config",
    async config(cfg) {
      const ctx = new DefaultVitePluginContext({
        root: cfg.root ?? process.cwd(),
      });
      // this is deeply merged in cfg
      const entry =
        entries === false ? {} : await resolveEntries(ctx.resolve("sourceDir"), entries);
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
  /** Options for the {@link Docs} plugins, use false to disable */
  docs?: DocsPluginOptions | false;
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

  plugin.push(LibConfig(options));
  return plugin;
}
