import * as p from "@clack/prompts";
import { readFile, writeFile } from "fs/promises";
import { join, resolve } from "path";
import { spawn } from "child_process";
import { features, type PackageJson } from "./features/index.js";

/** Options for {@link runSetup}. All fields are optional; missing ones are prompted interactively. */
export type SetupOptions = {
  /** Working directory of the target project. Defaults to `process.cwd()`. */
  dir?: string;
  /** Feature IDs to apply (e.g. `["lint", "format"]`). When provided, skips the feature prompt. */
  features?: string[];
};

/**
 * Add tooling features to an existing project.
 *
 * Reads the project's `package.json`, applies each selected feature (adding
 * scripts and devDependencies), writes the updated `package.json`, then runs
 * `npm install`.
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
  p.intro("marmotte setup");

  const answers = await p.group(
    {
      selectedFeatures: () =>
        opts.features !== undefined
          ? Promise.resolve(opts.features)
          : p.multiselect({
              message: "Features to add",
              options: features.map((f) => ({ value: f.id, label: f.label })),
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

  let pkg: PackageJson;
  try {
    const raw = await readFile(pkgPath, "utf8");
    pkg = JSON.parse(raw) as PackageJson;
  } catch {
    p.outro("No package.json found in current directory.");
    process.exit(1);
  }

  const selectedFeatureIds = answers.selectedFeatures as string[];
  const selectedFeatureList = features.filter((f) => selectedFeatureIds.includes(f.id));

  const spinner = p.spinner();
  spinner.start("Applying features…");

  for (const feature of selectedFeatureList) {
    await feature.apply(cwd, pkg);
  }

  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
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
