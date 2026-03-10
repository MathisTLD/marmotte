import type { Plugin, ResolvedConfig } from "vite";
import { Context } from "./context";
import { writeDefaultFiles } from "./codegen";

function resolveContext(config: ResolvedConfig) {
  // TODO: make other parts configurable
  return new Context({ root: config.root });
}

export type Options = {
  /** Path where to serve vitepress dev server when in dev mode (default `/docs`) use false to disable */
  serve?: string | false;
};

// FIXME: {@link Lib} in the JSDoc below requires `import type { Lib } from "../lib"` to make typedoc generate proper link. We don't wan't docs to mess-up code but we want that fixed
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
 * Included automatically by {@link Lib} unless `docs: false` is passed.
 */
export function Docs(options: Options = {}) {
  let config: ResolvedConfig;
  let ctx: Context;
  let buildSucceeded = false;
  let vitepress: typeof import("vitepress");
  return {
    name: "marmotte:docs",
    async configResolved(resolvedConfig) {
      vitepress = await import("vitepress");
      config = resolvedConfig;
      ctx = resolveContext(resolvedConfig);
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
      const serve = options.serve === false ? false : (options.serve ?? "/docs/");
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
