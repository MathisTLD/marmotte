import { build } from "vite";
import { dirname, resolve } from "node:path";
import { mkdir, rm } from "node:fs/promises";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { resolveTemplate } from "@/cli/api";
import pkg from "../package.json";

const execAsync = promisify(exec);
import { tmpdir } from "node:os";
const rootDir = dirname(import.meta.dirname);
const scaffoldDir = resolve(tmpdir(), "marmotte-test-projects");

// Throw with captured output so build failures are readable in CI
export async function run(cmd: string, cwd: string) {
  try {
    return await execAsync(cmd, { cwd });
  } catch (e: any) {
    throw new Error(`"${cmd}" failed in ${cwd}:\n${e.stdout}\n${e.stderr}`);
  }
}

let packagePath: string | undefined;

async function getPackagePath() {
  if (packagePath) return packagePath;
  await run(`npm pack --pack-destination "${scaffoldDir}"`, rootDir);
  packagePath = resolve(scaffoldDir, `${pkg.name}-${pkg.version}.tgz`);
  return packagePath;
}

export async function prepare() {
  await mkdir(scaffoldDir, { recursive: true });
  await build({ root: rootDir });
  await getPackagePath();
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
  await run(`npm install "${await getPackagePath()}"`, root);
  await options.afterInstall?.(root);

  await options.beforeBuild?.(root);
  await run("npm run build", root);
  await options.afterBuild?.(root);

  return root;
}
