import type { Plugin, ResolvedConfig } from "vite";
import { createServer, build } from "vitepress";

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

export function Docs(options: Options = {}) {
  let config: ResolvedConfig;
  let ctx: Context;
  return {
    name: "marmotte:docs",
    async configResolved(resolvedConfig) {
      config = resolvedConfig;
      ctx = resolveContext(resolvedConfig);
      await writeDefaultFiles(ctx);
    },
    async buildEnd() {
      if (config.command === "build") {
        this.info("🔄 Building VitePress documentation...");
        await build(ctx.resolve("docsDir"));
        this.info("✅ Documentation built!");
      }
    },
    async configureServer(server) {
      const serve = options.serve === false ? false : (options.serve ?? "/docs/");
      if (serve) {
        // https://vitepress.dev/reference/site-config#base
        if (!(serve.startsWith("/") && serve.endsWith("/")))
          throw new Error("Base should always start and end with a slash");
        const vitePressServer = await createServer(ctx.resolve("docsDir"), {
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
