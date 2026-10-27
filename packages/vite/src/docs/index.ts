import type { Plugin, ResolvedConfig } from "vite";
import { Context } from "./context";
import { writeDefaultFiles } from "./codegen";

function resolveContext(config: ResolvedConfig, options: Options) {
  return new Context({ root: config.root, ...options });
}

export type Options = {
  /** Path where to serve vitepress dev server when in dev mode (default `/docs`) use false to disable */
  serve?: string | false;
  /**
   * Monorepo mode: scaffold a site assembling the docs of every workspace package
   * (`packages/<pkg>/docs/**`) with `workspaceDocs()` from `@mrmt/vitepress-plugin-sidebar/workspace`,
   * instead of a single-package site. Use it in the monorepo root's `vite.config.ts`.
   * Options of `workspaceDocs()` are edited in the generated `docs/.vitepress/config.ts`.
   *
   * The dev server integration works as usual. A root has no bundle entry, so build the site
   * with `vitepress build docs` rather than `vite build`.
   * @default false
   */
  workspace?: boolean;
};

/**
 * Vite plugin that integrates a VitePress documentation site into your project.
 *
 * - On `configResolved`: scaffolds default docs files (`docs/index.md`, `.vitepress/config.ts`, etc.)
 *   if they do not already exist.
 * - On `closeBundle` (build mode): runs `vitepress build` after all other plugins have finished
 *   their `buildEnd` work (e.g. TypeDoc markdown generation), so the docs site is always built
 *   with up-to-date content.
 * - On `configureServer` (dev mode): mounts a VitePress dev server as middleware, served at
 *   `options.serve` (default `/docs/`).
 *
 * Included automatically by `@mrmt/vite/lib` plugin unless `docs: false` is passed.
 */
export function Docs(options: Options = {}) {
  let config: ResolvedConfig;
  let ctx: Context;
  let buildSucceeded = false;
  let vitepress: typeof import("vitepress");
  return {
    name: "marmotte:docs",
    apply() {
      return !process.env.VITEST;
    },
    async configResolved(resolvedConfig) {
      vitepress = await import("vitepress");
      config = resolvedConfig;
      ctx = resolveContext(resolvedConfig, options);
      await writeDefaultFiles(ctx);
    },
    buildEnd(error?: Error) {
      buildSucceeded = !error;
    },
    async closeBundle() {
      if (config.command === "build" && buildSucceeded) {
        this.info("🔄 Building VitePress documentation...");
        await vitepress.build(ctx.resolve("docsDir"));
        this.info("✅ Documentation built!");
      }
    },
    async configureServer(server) {
      const serve = ctx.options.serve;
      if (serve) {
        // https://vitepress.dev/reference/site-config#base
        if (!(serve.startsWith("/") && serve.endsWith("/")))
          throw new Error("Base should always start and end with a slash");
        const vitePressServer = await vitepress.createServer(ctx.resolve("docsDir"), {
          base: serve,
          middlewareMode: {
            server: server.httpServer!,
          },
        });
        server.middlewares.use(vitePressServer.middlewares);
        server.httpServer?.once("listening", function setupProxy() {
          // for some reason the listener that injects server.resolvedUrls is just after this one even if in vite code they use
          // `httpServer.prependListener('listening'` (see https://github.com/vitejs/vite/blob/964c718a382ff46ec1f906d7d6bc3f135a6dcd3f/packages/vite/src/node/server/index.ts#L669)
          setTimeout(() => {
            const serverUrl = server.resolvedUrls!.local[0];
            config.logger.info(`  ➜  Docs:    ${serverUrl.replace(/\/$/, "")}${serve}`);
          }, 10);
        });
      }
    },
  } satisfies Plugin;
}
