import { describe, expect, test } from "vitest";
import { withTmpDir } from "marmotte/vitest";
import { fileExists } from "@/utils/fs";
import { lintFeature } from "@/cli/features/lint";
import { formatFeature } from "@/cli/features/format";
import { preCommitFeature } from "@/cli/features/pre-commit";
import { changesetsFeature } from "@/cli/features/changesets";
import { versionLifecycleFeature } from "@/cli/features/version-lifecycle";
import type { PackageJson } from "@/cli/features/index";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

function makePkg(): PackageJson {
  return { name: "test-project", version: "1.0.0" };
}

describe("Feature: lint", () => {
  const tmp = withTmpDir();

  test("adds lint and lint:fix scripts", async () => {
    const pkg = makePkg();
    await lintFeature.apply(tmp.path, pkg);
    expect(pkg.scripts?.["lint"]).toBe("oxlint");
    expect(pkg.scripts?.["lint:fix"]).toBe("oxlint --fix");
  });

  test("adds oxlint devDependency", async () => {
    const pkg = makePkg();
    await lintFeature.apply(tmp.path, pkg);
    expect(pkg.devDependencies?.["oxlint"]).toMatch(/^\^/);
  });
});

describe("Feature: format", () => {
  const tmp = withTmpDir();

  test("adds fmt and fmt:check scripts", async () => {
    const pkg = makePkg();
    await formatFeature.apply(tmp.path, pkg);
    expect(pkg.scripts?.["fmt"]).toBe("oxfmt");
    expect(pkg.scripts?.["fmt:check"]).toBe("oxfmt --check");
  });

  test("adds oxfmt devDependency", async () => {
    const pkg = makePkg();
    await formatFeature.apply(tmp.path, pkg);
    expect(pkg.devDependencies?.["oxfmt"]).toMatch(/^\^/);
  });
});

describe("Feature: pre-commit", () => {
  const tmp = withTmpDir();

  test("adds prepare script and husky + lint-staged devDependencies", async () => {
    const pkg = makePkg();
    await preCommitFeature.apply(tmp.path, pkg);
    expect(pkg.scripts?.["prepare"]).toBe("husky");
    expect(pkg.devDependencies?.["husky"]).toMatch(/^\^/);
    expect(pkg.devDependencies?.["lint-staged"]).toMatch(/^\^/);
  });

  test("adds lint-staged config to package.json", async () => {
    const pkg = makePkg();
    await preCommitFeature.apply(tmp.path, pkg);
    const lintStaged = (pkg as Record<string, unknown>)["lint-staged"];
    expect(lintStaged).toBeDefined();
    expect(typeof lintStaged).toBe("object");
  });

  test("writes executable .husky/pre-commit file", async () => {
    const pkg = makePkg();
    await preCommitFeature.apply(tmp.path, pkg);
    expect(fileExists(resolve(tmp.path, ".husky/pre-commit"))).toBe(true);
    const content = await readFile(resolve(tmp.path, ".husky/pre-commit"), "utf8");
    expect(content).toContain("lint-staged");
  });
});

describe("Feature: changesets", () => {
  const tmp = withTmpDir();

  test("adds changeset, version, and release scripts", async () => {
    const pkg = makePkg();
    await changesetsFeature.apply(tmp.path, pkg);
    expect(pkg.scripts?.["changeset"]).toBe("changeset");
    expect(pkg.scripts?.["version"]).toBe("changeset version");
    expect(pkg.scripts?.["release"]).toContain("changeset publish");
  });

  test("adds @changesets/cli devDependency", async () => {
    const pkg = makePkg();
    await changesetsFeature.apply(tmp.path, pkg);
    expect(pkg.devDependencies?.["@changesets/cli"]).toMatch(/^\^/);
  });

  test("writes .changeset/config.json", async () => {
    const pkg = makePkg();
    await changesetsFeature.apply(tmp.path, pkg);
    expect(fileExists(resolve(tmp.path, ".changeset/config.json"))).toBe(true);
  });

  test(".changeset/config.json is valid JSON with expected fields", async () => {
    const pkg = makePkg();
    await changesetsFeature.apply(tmp.path, pkg);
    const raw = await readFile(resolve(tmp.path, ".changeset/config.json"), "utf8");
    const config = JSON.parse(raw);
    expect(config.baseBranch).toBe("main");
    expect(config.changelog).toBeDefined();
    expect(config.access).toBe("restricted");
  });

  test("writes .changeset/README.md", async () => {
    const pkg = makePkg();
    await changesetsFeature.apply(tmp.path, pkg);
    expect(fileExists(resolve(tmp.path, ".changeset/README.md"))).toBe(true);
  });
});

describe("Feature: version-lifecycle", () => {
  const tmp = withTmpDir();

  test("adds preversion and postversion scripts", async () => {
    const pkg = makePkg();
    await versionLifecycleFeature.apply(tmp.path, pkg);
    expect(pkg.scripts?.["preversion"]).toBe("vitest run");
    expect(pkg.scripts?.["postversion"]).toBe("npm run build");
  });
});

describe("Features: combined", () => {
  const tmp = withTmpDir();

  test("all features can be applied together without conflicts", async () => {
    const pkg = makePkg();
    await lintFeature.apply(tmp.path, pkg);
    await formatFeature.apply(tmp.path, pkg);
    await preCommitFeature.apply(tmp.path, pkg);
    await changesetsFeature.apply(tmp.path, pkg);
    await versionLifecycleFeature.apply(tmp.path, pkg);

    // Scripts from every feature are present
    expect(pkg.scripts?.["lint"]).toBe("oxlint");
    expect(pkg.scripts?.["fmt"]).toBe("oxfmt");
    expect(pkg.scripts?.["prepare"]).toBe("husky");
    expect(pkg.scripts?.["changeset"]).toBe("changeset");
    expect(pkg.scripts?.["preversion"]).toBe("vitest run");
    expect(pkg.scripts?.["postversion"]).toBe("npm run build");

    // DevDependencies from every feature are present
    expect(pkg.devDependencies?.["oxlint"]).toBeDefined();
    expect(pkg.devDependencies?.["oxfmt"]).toBeDefined();
    expect(pkg.devDependencies?.["husky"]).toBeDefined();
    expect(pkg.devDependencies?.["@changesets/cli"]).toBeDefined();
  });

  test("features do not initialise scripts or devDependencies when they already exist", async () => {
    const pkg: PackageJson = {
      name: "test-project",
      version: "1.0.0",
      scripts: { existing: "echo hi" },
      devDependencies: { "some-dep": "^1.0.0" },
    };
    await lintFeature.apply(tmp.path, pkg);
    // Pre-existing keys are preserved
    expect(pkg.scripts?.["existing"]).toBe("echo hi");
    expect(pkg.devDependencies?.["some-dep"]).toBe("^1.0.0");
    // New keys are added
    expect(pkg.scripts?.["lint"]).toBe("oxlint");
  });
});
