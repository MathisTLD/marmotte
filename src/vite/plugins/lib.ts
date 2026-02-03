import type { PluginOption } from "vite";

import dts, { type PluginOptions as DTSPluginOptions } from "vite-plugin-dts";
import {
  nodeExternals,
  type ExternalsOptions,
} from "rollup-plugin-node-externals";
import { DefaultVitePluginContext } from "../context";
import { PathFilter, resolveEntries } from "@/utils/fs";
import { Docs } from "./docs";

export type LibPluginOptions = {
  /** Filter which files in the {@link VitePluginPathOptions.sourceDir} to use as sources */
  entries?: PathFilter;
  /** Options for the `vite-plugin-dts` (will be merged with defaults) */
  dts?: DTSPluginOptions;
  /** Options for the `rollup-plugin-node-externals` */
  externals?: ExternalsOptions;
  /** Optionally disable the {@link Docs} plugins */
  docs?: false;
};
/**
 * Configures vite to build a library (can be node, browser or isomorphic)
 */
export function Lib(options: LibPluginOptions = {}) {
  const plugin: PluginOption = [];

  const dtsOptions = {
    cleanVueFileName: true,
    compilerOptions: {
      declaration: true,
      // declarations map are useful with linked packages / monorepos
      declarationMap: true,
    },
    // TODO: proper merge
    ...options.dts,
  };
  // common
  plugin.push(
    dts(dtsOptions),
    // only bundle what's in devDependencies
    nodeExternals(options.externals),
  );
  if (options.docs !== false) {
    plugin.push(Docs());
  }

  plugin.push({
    name: "marmotte-lib",

    async config(cfg) {
      const ctx = new DefaultVitePluginContext({
        root: cfg.root ?? process.cwd(),
      });
      const pkg = await ctx.resolvePackageJson();
      const resolve = {
        // add alias to src dir
        alias: {
          "@": ctx.resolve("sourceDir"),
        },
        // base handled file extensions
        extensions: [".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json"],
      };
      const define = {
        __PACKAGE_VERSION__: JSON.stringify(pkg.version),
        __PACKAGE_NAME__: JSON.stringify(pkg.name),
      };
      // this is deeply merged in cfg
      return {
        build: {
          minify: false,
          sourcemap: true,
          lib: {
            entry: await resolveEntries(
              ctx.resolve("sourceDir"),
              options.entries ?? /(?<!d\.)ts$/,
            ),
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
        resolve,
        define,
      };
    },
  });
  return plugin;
}
