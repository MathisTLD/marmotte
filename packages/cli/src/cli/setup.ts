import * as p from "@clack/prompts";
import { readFile } from "fs/promises";
import { join, resolve } from "path";
import { spawn } from "child_process";
import { features } from "../template/index.js";
import { applyTemplate } from "./scaffold.js";

/** Options for {@link runSetup}. All fields are optional; missing ones are prompted interactively. */
export type SetupOptions = {
  /** Working directory of the target project. Defaults to `process.cwd()`. */
  dir?: string;
  /** Feature IDs to apply (e.g. `["lint", "format"]`). When provided, skips the feature prompt. */
  features?: string[];
  /** Apply all available features without prompting. Takes precedence over `features`. */
  all?: boolean;
};

/**
 * Add tooling features to an existing project.
 *
 * Adds each selected feature (scripts, devDependencies and config files) to the project, keeping
 * what is already in its `package.json`, then runs `npm install`.
 *
 * @example Interactive
 * ```ts
 * await runSetup(); // prompts for features
 * ```
 * @example Non-interactive
 * ```ts
 * await runSetup({ features: ["lint", "format"] });
 * ```
 */
export async function runSetup(opts: SetupOptions = {}) {
  const resolvedFeatures = opts.all ? features.map((f) => f.id) : opts.features;

  p.intro("marmotte setup");

  const answers = await p.group(
    {
      selectedFeatures: () =>
        resolvedFeatures !== undefined
          ? Promise.resolve(resolvedFeatures)
          : p.multiselect({
              message: "Features to add",
              options: features.map((f) => ({ value: f.id, label: f.label })),
              initialValues: features.map((f) => f.id),
              required: true,
            }),
    },
    {
      onCancel: () => {
        p.cancel("Cancelled.");
        process.exit(0);
      },
    },
  );

  const cwd = opts.dir ? resolve(opts.dir) : process.cwd();
  const pkgPath = join(cwd, "package.json");

  let name: string;
  try {
    name = JSON.parse(await readFile(pkgPath, "utf8")).name;
  } catch {
    p.outro("No package.json found in current directory.");
    process.exit(1);
  }

  const spinner = p.spinner();
  spinner.start("Applying features…");

  await applyTemplate(cwd, {
    mode: "transition",
    preset: "bare",
    name,
    marmotteVersion: import.meta.env.VITE_PACKAGE_VERSION,
    features: answers.selectedFeatures as string[],
  });
  spinner.stop("Features applied!");

  spinner.start("Running npm install…");
  await runInstall(cwd);
  spinner.stop("Dependencies installed!");

  p.outro("Done!");
}

function runInstall(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn("npm", ["install"], { cwd, stdio: "inherit" });
    proc.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`npm install exited with ${code}`)),
    );
    proc.on("error", reject);
  });
}
