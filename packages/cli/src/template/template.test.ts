import { runTemplate } from "bingo";
import { intakeDirectory } from "bingo-fs";
import { testBlock, testIntake } from "bingo-stratum-testers";
import { existsSync, statSync } from "node:fs";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { blockLint } from "./blocks/features.js";
import { blockNodeLibraryExample } from "./blocks/node-library.js";
import { blockPackageJson } from "./blocks/package-json.js";
import { features, template } from "./index.js";

const options = { name: "demo", marmotteVersion: "0.6.1", includeExamples: true };
const skips = { requests: true, scripts: true } as const;

describe("blocks", () => {
  test("a feature contributes to package.json", () => {
    const { addons } = testBlock(blockLint, { options: { ...options, preset: "node-library" } });
    expect(addons?.[0].addons).toMatchObject({ scripts: { lint: "oxlint" } });
  });

  test("package.json is rendered from the addons", () => {
    const { files } = testBlock(blockPackageJson, {
      options: { ...options, preset: "bare" },
      addons: { scripts: { a: "b" }, devDependencies: { x: "^1" } },
    });
    expect(JSON.parse(files!["package.json"] as string)).toMatchObject({
      name: "demo",
      scripts: { a: "b" },
      devDependencies: { x: "^1" },
    });
  });

  test("starter code is only created in setup mode", () => {
    const settings = { options: { ...options, preset: "node-library" } };
    expect(testBlock(blockNodeLibraryExample, settings).files).toBeUndefined();
    expect(testBlock(blockNodeLibraryExample, { ...settings, mode: "setup" }).files).toMatchObject({
      src: { "index.ts": expect.stringContaining("MyClass") },
    });
  });

  test("existing package.json is read back, minus what the template manages", () => {
    const files = {
      "package.json": [
        JSON.stringify({ description: "mine", scripts: { custom: "x", build: "mine" } }),
      ] as [string],
    };
    expect(
      testIntake(blockPackageJson, { files, options: { ...options, preset: "node-library" } }),
    ).toMatchObject({
      scripts: { custom: "x" }, // build is the template's
      properties: { description: "mine" },
    });
  });
});

const read = (dir: string, file: string) => readFile(join(dir, file), "utf8");
const run = async (
  dir: string,
  mode: "setup" | "transition",
  extra: Record<string, unknown> = {},
) =>
  runTemplate(template, {
    directory: dir,
    mode,
    offline: true,
    skips,
    options: { ...options, preset: "node-library", ...extra } as never,
    files:
      mode === "transition"
        ? await intakeDirectory(dir, { exclude: /node_modules|^\.git$/ })
        : undefined,
  });

describe("setup then transition on a real directory", () => {
  test.each(["node-library", "ui-library", "ui-app"])("%s", async (preset) => {
    const dir = await mkdtemp(join(tmpdir(), "marmotte-template-"));
    await run(dir, "setup", { preset, "add-lint": true, "add-pre-commit": true });

    expect(JSON.parse(await read(dir, "package.json")).scripts).toMatchObject({
      build: "vite build",
      lint: "oxlint",
    });
    expect(existsSync(join(dir, "tsconfig.node.json"))).toBe(true);
    expect(existsSync(join(dir, ".husky/pre-commit"))).toBe(true);
    expect(existsSync(join(dir, preset === "ui-app" ? "src/main.ts" : "src/index.ts"))).toBe(true);

    // what a user does to their project
    const pkg = JSON.parse(await read(dir, "package.json"));
    pkg.description = "mine";
    pkg.scripts.custom = "echo hi";
    pkg.scripts.lint = "eslint"; // a script the template manages
    pkg.devDependencies.lodash = "^4";
    await writeFile(join(dir, "package.json"), JSON.stringify(pkg, null, 2));
    const starter = preset === "ui-app" ? "src/main.ts" : "src/index.ts";
    await writeFile(join(dir, starter), "// mine\n");

    await run(dir, "transition", { preset, "add-lint": true, "add-pre-commit": true });

    const updated = JSON.parse(await read(dir, "package.json"));
    expect(updated).toMatchObject({
      description: "mine",
      scripts: { custom: "echo hi", lint: "oxlint" }, // the template wins on what it manages
      devDependencies: { lodash: "^4" },
    });
    expect(await read(dir, starter)).toBe("// mine\n"); // setup-only files are left alone
  });

  test("the bare preset leaves a foreign project alone", async () => {
    const dir = await mkdtemp(join(tmpdir(), "marmotte-template-"));
    await writeFile(
      join(dir, "package.json"),
      JSON.stringify({ name: "foreign", scripts: { build: "tsc", lint: "eslint" } }),
    );
    await run(dir, "transition", { preset: "bare", "add-format": true });
    expect(JSON.parse(await read(dir, "package.json"))).toMatchObject({
      scripts: { build: "tsc", lint: "eslint", fmt: "oxfmt" },
    });
  });
});

describe("features", () => {
  test("all of them together, with their files", async () => {
    const dir = await mkdtemp(join(tmpdir(), "marmotte-template-"));
    await run(dir, "setup", {
      preset: "bare",
      ...Object.fromEntries(features.map(({ id }) => [`add-${id}`, true])),
    });

    const pkg = JSON.parse(await read(dir, "package.json"));
    expect(pkg.scripts).toMatchObject({
      lint: "oxlint",
      fmt: "oxfmt",
      prepare: "husky",
      changeset: "changeset",
      preversion: "vitest run",
      postversion: "npm run build",
    });
    expect(Object.keys(pkg.devDependencies)).toEqual(
      expect.arrayContaining(["oxlint", "oxfmt", "husky", "lint-staged", "@changesets/cli"]),
    );
    expect(pkg["lint-staged"]).toBeDefined();

    expect(await read(dir, ".husky/pre-commit")).toContain("lint-staged");
    expect(statSync(join(dir, ".husky/pre-commit")).mode & 0o111).not.toBe(0);
    expect(JSON.parse(await read(dir, ".changeset/config.json"))).toMatchObject({
      baseBranch: "main",
      access: "restricted",
    });
    expect(existsSync(join(dir, ".changeset/README.md"))).toBe(true);
  });

  test("a foreign project keeps its own fields and gets no defaults", async () => {
    const dir = await mkdtemp(join(tmpdir(), "marmotte-template-"));
    await writeFile(
      join(dir, "package.json"),
      JSON.stringify({ name: "foreign", version: "3.2.1" }),
    );
    await run(dir, "transition", { preset: "bare", "add-lint": true });
    const pkg = JSON.parse(await read(dir, "package.json"));
    expect(pkg).toMatchObject({ name: "foreign", version: "3.2.1" });
    expect(pkg).not.toHaveProperty("type"); // not forced to ESM
    expect(pkg).not.toHaveProperty("license");
  });

  test("none leaves package.json without scripts", async () => {
    const dir = await mkdtemp(join(tmpdir(), "marmotte-template-"));
    await writeFile(join(dir, "package.json"), JSON.stringify({ name: "foreign" }));
    await run(dir, "transition", { preset: "bare" });
    expect(JSON.parse(await read(dir, "package.json"))).toEqual({ name: "foreign" });
  });
});
