import type { Plugin } from "vite";
import { Application, type TypeDocOptions } from "typedoc";
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
  (app) => import("typedoc-plugin-markdown").then((m) => m.load(app)),
  (app) => import("typedoc-vitepress-theme").then((m) => m.load(app as any)),
] satisfies TypeDocOptions["plugin"];

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
  let app: Application | undefined;
  const { onOptions, onGenerated, sourceDir: userSourceDir, ...userTypedocOptions } = options;
  let typedocOptions: TypeDocOptions | undefined;

  return {
    name: "marmotte:vitepress-typedoc",
    async configResolved(resolvedConfig) {
      // TODO: check that it's the right place to put files
      const out = resolve(resolvedConfig.root, "reference", "api");
      const sourceDir = userSourceDir ?? resolve(resolvedConfig.root, "..", "src");
      // TODO: tsconfig
      typedocOptions = {
        entryPoints: [join(sourceDir, "**", "*.ts")],
        // without skipErrorChecking, importing .vue files in a .ts causes errors
        skipErrorChecking: true,
        plugin: [...defaultPlugins],
        out,
        readme: "none",
        alwaysCreateEntryPointModule: true,
        cleanOutputDir: true,
        router: "module",
        // TODO: proper deepmerge
        ...userTypedocOptions,
      };

      await onOptions?.(typedocOptions);
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
          await onGenerated?.();
          this.info("✅ TypeDoc documentation generated!");
        } else {
          this.warn("TypeDoc project reflection is undefined");
        }
      }
    },
  } satisfies Plugin;
}

export default TypeDocPlugin;
