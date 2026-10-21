import { resolve } from "node:path";
import { mkdir, rm } from "node:fs/promises";
import { exec, type ExecOptionsWithStringEncoding } from "node:child_process";
import { promisify } from "node:util";
import { resolveTemplate } from "../src/cli/api";
import pkg from "../package.json";

const execAsync = promisify(exec);
import { tmpdir } from "node:os";
// the monorepo root (packages/cli/tests -> ../../..)
const rootDir = resolve(import.meta.dirname, "../../..");
const scaffoldDir = resolve(tmpdir(), "marmotte-test-projects");

// Throw with captured output so build failures are readable in CI
export async function run(
  cmd: string,
  options: ExecOptionsWithStringEncoding & Required<Pick<ExecOptionsWithStringEncoding, "cwd">>,
) {
  const opts = { ...options };
  if (!opts.env) {
    // default behavior
    // don't pass VITEST env so that the docs plugins are not deactivated
    const { VITEST: _, ...env } = process.env;
    opts.env = env;
  }
  try {
    return await execAsync(cmd, opts);
  } catch (e: any) {
    throw new Error(`"${cmd}" failed in ${options.cwd}:\n${e.stdout}\n${e.stderr}`);
  }
}

let packagePaths: string[] | undefined;

/**
 * Packs every publishable workspace package (they must be built already: `test` depends on the
 * `build` tasks). The private root and @mrmt/utils (inlined into the others) are left out.
 * Scaffolded projects install all the tarballs together so that unpublished `@mrmt/*`
 * dependencies resolve locally instead of from the registry.
 */
async function getPackagePaths() {
  if (packagePaths) return packagePaths;
  const { stdout } = await run(
    `vp pm pack --filter '!marmotte-monorepo' --filter '!@mrmt/utils' --json --pack-destination "${scaffoldDir}"`,
    {
      cwd: rootDir,
    },
  );
  packagePaths = (JSON.parse(stdout) as { filename: string }[]).map((p) => resolve(p.filename));
  return packagePaths;
}

export async function prepare() {
  await mkdir(scaffoldDir, { recursive: true });
  await getPackagePaths();
}

export async function scaffold(
  templateId: string,
  options: {
    dirname?: string;
    includeExamples?: boolean;
    beforeInstall?: (root: string) => Promise<void>;
    afterInstall?: (root: string) => Promise<void>;
    beforeBuild?: (root: string) => Promise<void>;
    afterBuild?: (root: string) => Promise<void>;
  } = {},
) {
  const root = resolve(scaffoldDir, options.dirname ?? templateId);
  await rm(root, { recursive: true, force: true });
  await mkdir(root, { recursive: true });

  const template = resolveTemplate(templateId);
  await template.generate(root, {
    name: templateId,
    marmotteVersion: pkg.version,
    includeExamples: options.includeExamples ?? true,
  });

  await options.beforeInstall?.(root);
  const tarballs = (await getPackagePaths()).map((p) => `"${p}"`).join(" ");
  await run(`npm install ${tarballs}`, { cwd: root });
  await options.afterInstall?.(root);

  await options.beforeBuild?.(root);
  await run("npm run build", { cwd: root });
  await options.afterBuild?.(root);

  return root;
}
