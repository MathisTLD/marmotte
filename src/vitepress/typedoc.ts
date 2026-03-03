import type { Plugin } from "vite";
import { Application, ProjectReflection, type TypeDocOptions } from "typedoc";
import { join, resolve } from "path";

export type Options = TypeDocOptions & {
  /** path to source dir (default entryPoints are `<sourceDir>/**\/*.ts`)
   * @default `<vitepress-root>/../src`
   */
  sourceDir?: string;
  /** a hook to mutate in place typedocs options */
  onOptions?: (options: TypeDocOptions) => Promise<void> | void;
  /** a hook to call custom logic after files are generated */
  onGenerated?: () => void | Promise<void>;
};

export const defaultPlugins = [
  async function typedocPluginMarkdown(app) {
    return import("typedoc-plugin-markdown").then((m) => m.load(app));
  },
  async function typedocVitePressTheme(app) {
    return import("typedoc-vitepress-theme").then((m) => m.load(app as any));
  },
] satisfies TypeDocOptions["plugin"];

/**
 * Bootstrap a TypeDoc application generating an API reference into `<docsRoot>/reference/api/`.
 */
export async function bootstrapTypeDoc(docsRoot: string, options: Options = {}) {
  const { onOptions, sourceDir: userSourceDir, ...userTypedocOptions } = options;
  const root = resolve(docsRoot);
  const out = resolve(root, "reference", "api");
  const sourceDir = userSourceDir ?? resolve(root, "..", "src");

  const typedocOptions: TypeDocOptions = {
    entryPoints: [join(sourceDir, "**", "*.ts")],
    skipErrorChecking: true,
    plugin: [...defaultPlugins],
    out,
    readme: "none",
    alwaysCreateEntryPointModule: true,
    cleanOutputDir: true,
    router: "module",
    // avoid to make the console flicker in dev mode
    preserveWatchOutput: true,
    // TODO: proper deepmerge
    ...userTypedocOptions,
  };

  await onOptions?.(typedocOptions);
  const app = await Application.bootstrapWithPlugins(typedocOptions);
  return app;
}

/**
 * Vite plugin that generates a TypeDoc API reference as Markdown files during the VitePress build.
 *
 * Place this in the `vite.plugins` array of your VitePress config (not the main Vite config):
 *
 * ```ts
 * // docs/.vitepress/config.ts
 * import TypeDoc from "marmotte/vitepress/typedoc"
 * export default defineConfig({ vite: { plugins: [TypeDoc()] } })
 * ```
 *
 * Generated files land in `<docsRoot>/reference/api/` and are excluded from git by the
 * default `.gitignore` written by {@link Docs}.
 *
 * Use {@link Options.onOptions} to mutate TypeDoc options before the app is bootstrapped,
 * and {@link Options.onGenerated} to run post-generation logic.
 */
export function TypeDocPlugin(options: Options = {}) {
  let app: Application;
  const { onGenerated } = options;

  const generate = async (project: ProjectReflection) => {
    console.info("🔄 Generating TypeDoc documentation...");
    await app.generateOutputs(project);
    await onGenerated?.();
    console.info("✅ TypeDoc documentation generated!");
  };

  return {
    name: "marmotte:vitepress-typedoc",
    apply(config, env) {
      // else hooks are fired twice because VitePress runs two Vite instances (SSR + client)
      return !env.isSsrBuild;
    },

    async configResolved(resolvedConfig) {
      app = await bootstrapTypeDoc(resolvedConfig.root, options);
      // in build we wanna have reference generated
      if (resolvedConfig.command === "build") {
        const project = await app.convert();
        if (!project) throw new Error("TypeDoc project reflection is undefined");
        await generate(project);
      }
    },
    async configureServer(server) {
      const { promise: firstBuildPromise, resolve: onFirstBuild } = Promise.withResolvers();
      app
        .convertAndWatch((project) => generate(project).then(onFirstBuild))
        .then((ok) => {
          if (ok) {
            // if here the typedoc config changed we should restart the dev server
            console.info("TypeDoc config changed, restarting the dev server");
            server.restart();
          } else {
            console.error("Got TypeDoc options error");
            // FIXME: might be a good idea to throw something idk
          }
        });
      await firstBuildPromise;
    },
  } satisfies Plugin;
}

export default TypeDocPlugin;
