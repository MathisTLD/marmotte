import type { Plugin, ResolvedConfig } from "vite";
import { createServer, build } from "vitepress";
import { Application, type TypeDocOptions } from "typedoc";

import { Context } from "./context";
import { writeConfig, writeDefaultFiles } from "./codegen/vitepress";
import { type PluginOptions, getDTSPluginOptions } from "../dts";

function resolveContext(config: ResolvedConfig) {
  // TODO: make other parts configurable
  return new Context({ root: config.root });
}

export function DocsTypedoc(
  options: {
    /** a hook to mutate in place typedocs options */
    options?: (this: Context, options: TypeDocOptions) => Promise<void> | void;
    /** a hook to call custom logic after files are generated */
    onGenerated?: (this: Context) => void | Promise<void>;
  } = {},
): Plugin {
  let app: Application | undefined;
  let config: ResolvedConfig;
  let ctx: Context;

  let dtsOptions: PluginOptions | undefined;
  let typedocOptions: TypeDocOptions | undefined;

  return {
    name: "marmotte:docs-typedoc",
    async configResolved(resolvedConfig) {
      config = resolvedConfig;
      try {
        dtsOptions = getDTSPluginOptions(config);
        this.debug(`Got dts plugin options`);
      } catch (error) {
        this.warn(`Failed to get dts plugin options (${error}), plugin will be inactive.`);
      }
      ctx = resolveContext(resolvedConfig);
      const out = ctx.resolve("docsDir", "reference/api");
      const lib = config.build.lib;
      if (lib) {
        this.info("lib detected, adding API reference with typedoc-plugin-markdown");
        const { entry } = lib;
        const entryPoints =
          typeof entry === "string" ? [entry] : Array.isArray(entry) ? entry : Object.values(entry);
        this.debug(`detected entry points: ${JSON.stringify(entryPoints, null, 2)}`);
        // TODO: tsconfig
        typedocOptions = {
          tsconfig: dtsOptions?.tsconfigPath,
          entryPoints,
          plugin: ["typedoc-plugin-markdown"],
          out,
          readme: "none",
          alwaysCreateEntryPointModule: true,
          cleanOutputDir: true,
          router: "module",
        };

        await options.options?.call(ctx, typedocOptions);
      } else {
        this.debug("this is not a lib, skipping API reference generation");
      }
    },
    async buildStart() {
      if (typedocOptions) {
        if (!app) {
          app = await Application.bootstrapWithPlugins(typedocOptions);
        }
        const project = await app.convert();
        if (project) {
          this.info("🔄 Generating TypeDoc documentation...");
          await app.generateOutputs(project);
          // TODO: decide what to do with /reference/api/README.md file
          await options.onGenerated?.call(ctx);
          this.info("✅ TypeDoc documentation generated!");
        } else {
          this.warn("TypeDoc project reflection is undefined");
        }
      }
    },
  };
}

export function Docs() {
  let config: ResolvedConfig;
  let ctx: Context;

  return [
    DocsTypedoc({
      options(opts) {
        // @ts-ignore (added by typedoc-plugin-markdown but not in typing see https://typedoc-plugin-markdown.org/docs/options/utility#navigationjson)
        opts.navigationJson = this.resolve("docsDir", ".vitepress/api-reference.navigation.json");
      },
      async onGenerated() {
        // On initial run, .vitepress/api-reference.navigation.json might is missing when we create
        // .vitepress/auto.config.ts because it's built on buildStart so we might need to re-generate .vitepress/auto.config.ts
        // once .vitepress/auto.config.ts is available
        await writeConfig(ctx);
      },
    }),
    {
      name: "marmotte:docs",
      async configResolved(resolvedConfig) {
        config = resolvedConfig;
        ctx = resolveContext(resolvedConfig);
        // might need to be re-generated once .vitepress/api-reference.navigation.json is generated
        // see onGenerated above
        await writeConfig(ctx);
        // defaults only need to be generated once
        await writeDefaultFiles(ctx);
      },
      async buildEnd() {
        if (config.command === "build") {
          this.info("🔄 Building VitePress documentation...");
          const outDir = ctx.resolve("docsDir", "dist");
          await build(ctx.resolve("docsDir"), { outDir });
          this.info("✅ Documentation built!");
        }
      },
      async configureServer(server) {
        if (config.mode !== "docs") return;
        const vitePressServer = await createServer(ctx.resolve("docsDir"), {
          middlewareMode: {
            server: server.httpServer!,
          },
        });
        server.middlewares.use(vitePressServer.middlewares);
      },
    } satisfies Plugin,
  ];
}
