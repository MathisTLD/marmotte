import { beforeAll, describe, expect, test } from "vitest";
import { build } from "vite";
import { dirname, resolve } from "node:path";
import { fileExists } from "@/utils/fs";
import { cp, mkdir, rm } from "node:fs/promises";
import { exec } from "node:child_process";

const rootDir = dirname(import.meta.dirname);
const templatesDir = resolve(rootDir, "templates");
const scaffoldDir = resolve(rootDir, ".template-tests"); // "/tmp/projects"
type TemplateName = "node-library" | "ui-library" | "ui-app";

async function scaffold(template: TemplateName) {
  const root = resolve(scaffoldDir, template);
  await mkdir(dirname(root), { recursive: true });
  // cleanup
  await rm(root, { recursive: true, force: true });
  // copy template
  await cp(resolve(templatesDir, template), root, { recursive: true });
  // install this build
  await new Promise((resolve) =>
    exec(
      `npm install ${rootDir /* relative(root, rootDir) */}`,
      { cwd: root },
      resolve,
    ),
  );
  return root;
}

async function scaffoldAndBuild(template: TemplateName) {
  const root = await scaffold(template);
  await new Promise((resolve) => exec("npm run build", { cwd: root }, resolve));
  return root;
}

describe("Projects", () => {
  beforeAll(async () => {
    // ensure we have a fresh build of this package that will be installed by scaffolded projects
    await build({ root: rootDir });
  });
  test("node-library", async () => {
    const root = await scaffoldAndBuild("node-library");
    expect(fileExists(resolve(root, "dist", "index.js")));
    expect(fileExists(resolve(root, "dist", "index.d.ts")));
  }, 20000);

  test("ui-library", async () => {
    const root = await scaffoldAndBuild("ui-library");
    expect(fileExists(resolve(root, "dist", "index.js")));
    expect(fileExists(resolve(root, "dist", "index.d.ts")));
  }, 20000);
});
