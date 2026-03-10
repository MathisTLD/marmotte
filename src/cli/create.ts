import * as p from "@clack/prompts";
import { basename, resolve } from "path";
import { writeFile } from "fs/promises";
import { join } from "path";
import { features, type PackageJson } from "./features/index.js";
import { builtinTemplates, resolveTemplate } from "./templates/index.js";

// Injected at build time by vite
declare const __MARMOTTE_VERSION__: string;

/** Options for {@link runCreate}. All fields are optional; missing ones are prompted interactively. */
export type CreateOptions = {
  /** Target directory to scaffold into. Defaults to `./my-project` when prompted. */
  dir?: string;
  /**
   * Template ID or remote source. When provided, skips the template prompt and
   * enables non-interactive mode (features and examples are not prompted).
   *
   * Accepted values:
   * - Built-in ID: `"node-library"`, `"ui-library"`, `"ui-app"`
   * - GitHub shorthand: `"user/repo"`
   * - giget source: `"github:user/repo"`, `"gitlab:user/repo"`, `"https://…"`
   * - Local path: `"./path/to/template"`
   */
  template?: string;
  /** Project name written into `package.json`. Defaults to the target directory basename when prompted. */
  name?: string;
  /**
   * Whether to include example source files. Defaults to `true`; pass `false` to skip.
   * Only applies when `template` is a built-in. Has no effect for custom templates.
   */
  examples?: boolean;
  /** Feature IDs to apply (e.g. `["lint", "format"]`). When provided, skips the feature prompt. */
  features?: string[];
  /** Apply all available features without prompting. Takes precedence over `features`. */
  all?: boolean;
};

/**
 * Scaffold a new project from a template.
 *
 * Prompts are shown for any value not supplied in `opts`. Supplying `template`
 * enables fully non-interactive mode — `examples` and `features` also stop prompting.
 *
 * @example Interactive
 * ```ts
 * await runCreate(); // prompts for everything
 * ```
 * @example Non-interactive
 * ```ts
 * await runCreate({ dir: "./my-lib", template: "node-library", name: "my-lib", examples: false });
 * ```
 */
export async function runCreate(opts: CreateOptions = {}) {
  // "non-interactive" = template was supplied via flag
  const nonInteractive = opts.template !== undefined;
  const resolvedFeatures = opts.all ? features.map((f) => f.id) : opts.features;

  p.intro("marmotte create");

  const answers = await p.group(
    {
      dir: () =>
        opts.dir !== undefined
          ? Promise.resolve(opts.dir)
          : p.text({
              message: "Target directory",
              defaultValue: "./my-project",
              placeholder: "./my-project",
            }),

      name: ({ results }) => {
        if (opts.name !== undefined) return Promise.resolve(opts.name);
        const dir = String(results.dir ?? "./my-project");
        return p.text({
          message: "Project name",
          defaultValue: basename(resolve(dir)),
          placeholder: basename(resolve(dir)),
        });
      },

      template: () =>
        opts.template !== undefined
          ? Promise.resolve(opts.template)
          : p.select({
              message: "Project type",
              options: [
                ...builtinTemplates.map((t) => ({ value: t.id, label: t.label })),
                { value: "__custom__", label: "Custom (git URL or local path)" },
              ],
            }),

      customTemplate: ({ results }) => {
        if (results.template !== "__custom__") return Promise.resolve(undefined);
        return p.text({
          message: "Template source (git URL or local path)",
          placeholder: "https://github.com/user/my-template",
        });
      },

      includeExamples: ({ results }) => {
        if (results.template === "__custom__") return Promise.resolve(true);
        if (nonInteractive) return Promise.resolve(opts.examples); // true by default, false if --no-examples
        return p.confirm({ message: "Include example code?", initialValue: true });
      },

      selectedFeatures: () =>
        resolvedFeatures !== undefined
          ? Promise.resolve(resolvedFeatures)
          : nonInteractive
          ? Promise.resolve([])
          : p.multiselect({
              message: "Optional features",
              options: features.map((f) => ({ value: f.id, label: f.label })),
              required: false,
            }),
    },
    {
      onCancel: () => {
        p.cancel("Cancelled.");
        process.exit(0);
      },
    },
  );

  const dir = resolve(String(answers.dir));
  const name = String(answers.name);
  const templateSource =
    answers.template === "__custom__" ? String(answers.customTemplate ?? "") : String(answers.template);

  const template = resolveTemplate(templateSource);

  const marmotteVersion = __MARMOTTE_VERSION__;
  const includeExamples = Boolean(answers.includeExamples);

  const spinner = p.spinner();
  spinner.start(`Generating ${template.label}…`);
  try {
    await template.generate(dir, { name, marmotteVersion, includeExamples });
  } catch (e) {
    spinner.stop("Generation failed");
    p.outro(`Error: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  }

  // Apply selected features
  const selectedFeatureIds = answers.selectedFeatures as string[];
  if (selectedFeatureIds.length > 0) {
    const pkgPath = join(dir, "package.json");
    let pkg: PackageJson;
    try {
      const raw = await import("fs/promises").then((m) => m.readFile(pkgPath, "utf8"));
      pkg = JSON.parse(raw) as PackageJson;
    } catch {
      pkg = { name, version: "0.1.0" };
    }

    const selectedFeatureList = features.filter((f) => selectedFeatureIds.includes(f.id));
    for (const feature of selectedFeatureList) {
      await feature.apply(dir, pkg);
    }

    await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  }

  spinner.stop("Project created!");

  const relDir = answers.dir as string;
  p.outro(`Done! Next steps:\n\n  cd ${relDir}\n  npm install\n  npm run build`);
}
