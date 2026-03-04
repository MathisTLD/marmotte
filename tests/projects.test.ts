import { beforeAll, describe, expect, test } from "vitest";
import { fileExists, dirExists } from "@/utils/fs";
import { prepare, scaffold } from "./projects.test-utils";
import { resolve } from "node:path";
import { readdir, readFile } from "node:fs/promises";

// Shared assertions for library templates (node-library, ui-library)
async function expectLibraryOutput(root: string) {
  const dist = resolve(root, "dist");
  expect(fileExists(resolve(dist, "index.js"))).toBe(true);
  expect(fileExists(resolve(dist, "index.d.ts"))).toBe(true);

  const js = await readFile(resolve(dist, "index.js"), "utf8");
  expect(js).toContain("MyClass");

  const dts = await readFile(resolve(dist, "index.d.ts"), "utf8");
  expect(dts).toContain("MyClass");
}

async function expectLibraryDocumentation(root: string) {
  // TypeDoc generated API markdown in docs/reference/api/
  const apiDir = resolve(root, "docs/reference/api");
  expect(dirExists(apiDir)).toBe(true);
  const apiMdFiles = (await readdir(apiDir)).filter((f) => f.endsWith(".md"));
  expect(apiMdFiles.length).toBeGreaterThan(0);
  // At least one generated file references our exported class
  const apiContents = await Promise.all(
    apiMdFiles.map((f) => readFile(resolve(apiDir, f), "utf8")),
  );
  expect(apiContents.some((c) => c.includes("MyClass"))).toBe(true);

  // VitePress site includes the TypeDoc API reference in a single build pass
  expect(fileExists(resolve(root, "docs/.vitepress/dist/index.html"))).toBe(true);
  expect(fileExists(resolve(root, "docs/.vitepress/dist/reference/api/index.html"))).toBe(true);
}

describe("Projects", () => {
  beforeAll(async () => {
    await prepare();
  });

  test.concurrent("node-library", async () => {
    const root = await scaffold("node-library");
    await expectLibraryOutput(root);
    await expectLibraryDocumentation(root);
  }, 60000);

  test.concurrent("ui-library", async () => {
    const root = await scaffold("ui-library");
    await expectLibraryOutput(root);
    await expectLibraryDocumentation(root);

    // Example Vue component was scaffolded
    expect(fileExists(resolve(root, "src/components/foo.vue"))).toBe(true);
  }, 60000);

  test.concurrent("ui-app", async () => {
    const root = await scaffold("ui-app");
    const dist = resolve(root, "dist");

    expect(fileExists(resolve(dist, "index.html"))).toBe(true);
    const html = await readFile(resolve(dist, "index.html"), "utf8");
    expect(html).toContain("/assets/");

    const assets = await readdir(resolve(dist, "assets"));
    expect(assets.some((f) => f.endsWith(".js"))).toBe(true);
    expect(assets.some((f) => f.endsWith(".css"))).toBe(true);
  }, 60000);
});
