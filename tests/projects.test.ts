import { beforeAll, describe, expect, test } from "vitest";
import { build } from "vite";
import { dirname, resolve } from "node:path";
import { fileExists } from "@/utils/fs";
import { cp, mkdir, rm } from "node:fs/promises";
import { exec } from "node:child_process";

import pkg from "../package.json";

const rootDir = dirname(import.meta.dirname);
const templatesDir = resolve(import.meta.dirname, "project-templates");
const scaffoldDir = resolve(import.meta.dirname, ".projects"); // "/tmp/projects"
type TemplateName = "node-library" | "ui-library" | "ui-app";

let packagePath: string | undefined;

async function getPackagePath() {
  if (packagePath) return packagePath;
  console.log("generating package archive...");
  // prepare package archive
  await new Promise((resolve) =>
    exec(`npm pack --pack-destination "${scaffoldDir}"`, { cwd: rootDir }, resolve),
  );
  packagePath = resolve(scaffoldDir, `${pkg.name}-${pkg.version}.tgz`);
  return packagePath;
}

async function scaffold(template: TemplateName) {
  const root = resolve(scaffoldDir, template);
  await mkdir(dirname(root), { recursive: true });
  // cleanup
  await rm(root, { recursive: true, force: true });
  // copy template
  await cp(resolve(templatesDir, template), root, { recursive: true });
  const packagePath = await getPackagePath();
  // install this build
  await new Promise((resolve) => exec(`npm install ${packagePath}`, { cwd: root }, resolve));
  return root;
}

async function scaffoldAndBuild(template: TemplateName) {
  const root = await scaffold(template);
  await new Promise((resolve) => exec("npm run build", { cwd: root }, resolve));
  return root;
}

function expectDocsToBeGenerated(root: string) {
  expect(fileExists(resolve(root, "docs", ".vitepress", "dist", "index.html")));
}

describe("Projects", () => {
  beforeAll(async () => {
    // ensure we have a fresh build of this package that will be installed by scaffolded projects
    await build({ root: rootDir });
    await getPackagePath();
  });
  test.concurrent("node-library", async () => {
    const root = await scaffoldAndBuild("node-library");
    expect(fileExists(resolve(root, "dist", "index.js")));
    expect(fileExists(resolve(root, "dist", "index.d.ts")));
    expectDocsToBeGenerated(root);
  }, 60000);

  test.concurrent("ui-library", async () => {
    const root = await scaffoldAndBuild("ui-library");
    expect(fileExists(resolve(root, "dist", "index.js")));
    expect(fileExists(resolve(root, "dist", "index.d.ts")));
    expectDocsToBeGenerated(root);
  }, 60000);

  test.concurrent("ui-app", async () => {
    const root = await scaffoldAndBuild("ui-app");
    expect(fileExists(resolve(root, "dist", "index.html")));
  }, 60000);
});
