import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createTmpDir } from "marmotte/vitest";
import { rm, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { features } from "@/cli/features/index";
import { runSetup } from "@/cli/setup";

// Prevent actual npm install from running
vi.mock("child_process", () => ({
  spawn: vi.fn(() => {
    const proc = { on: vi.fn() };
    proc.on.mockImplementation((event: string, cb: (code: number) => void) => {
      if (event === "close") queueMicrotask(() => cb(0));
      return proc;
    });
    return proc;
  }),
}));

// Suppress interactive UI output; simulate p.group by resolving each field
vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  group: vi.fn(
    async (fields: Record<string, (ctx: { results: Record<string, unknown> }) => Promise<unknown>>) => {
      const results: Record<string, unknown> = {};
      for (const [key, fn] of Object.entries(fields)) {
        results[key] = await fn({ results });
      }
      return results;
    },
  ),
}));

let dir: string;

beforeEach(async () => {
  dir = await createTmpDir();
  await writeFile(
    join(dir, "package.json"),
    JSON.stringify({ name: "test-project", version: "1.0.0" }, null, 2) + "\n",
  );
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

async function readPkg(d: string) {
  return JSON.parse(await readFile(join(d, "package.json"), "utf8"));
}

describe("runSetup — feature selection", () => {
  test("all: true applies every feature", async () => {
    await runSetup({ dir, all: true });
    const pkg = await readPkg(dir);
    expect(pkg.scripts?.["lint"]).toBe("oxlint");
    expect(pkg.scripts?.["fmt"]).toBe("oxfmt");
    expect(pkg.scripts?.["prepare"]).toBe("husky");
    expect(pkg.scripts?.["changeset"]).toBe("changeset");
    expect(pkg.scripts?.["preversion"]).toBe("vitest run");
    expect(pkg.scripts?.["postversion"]).toBe("npm run build");

    // devDependencies from all features
    expect(pkg.devDependencies?.["oxlint"]).toBeDefined();
    expect(pkg.devDependencies?.["oxfmt"]).toBeDefined();
    expect(pkg.devDependencies?.["husky"]).toBeDefined();
    expect(pkg.devDependencies?.["@changesets/cli"]).toBeDefined();
  });

  test("all: true is equivalent to passing every feature id explicitly", async () => {
    const allIds = features.map((f) => f.id);

    const dirA = await createTmpDir();
    const dirB = await createTmpDir();
    try {
      await writeFile(join(dirA, "package.json"), JSON.stringify({ name: "a" }, null, 2) + "\n");
      await writeFile(join(dirB, "package.json"), JSON.stringify({ name: "b" }, null, 2) + "\n");

      await runSetup({ dir: dirA, all: true });
      await runSetup({ dir: dirB, features: allIds });

      const pkgA = await readPkg(dirA);
      const pkgB = await readPkg(dirB);

      // Same scripts and devDependencies regardless of which path was used
      expect(pkgA.scripts).toEqual(pkgB.scripts);
      expect(pkgA.devDependencies).toEqual(pkgB.devDependencies);
    } finally {
      await rm(dirA, { recursive: true, force: true });
      await rm(dirB, { recursive: true, force: true });
    }
  });

  test("all: true takes precedence over features list", async () => {
    await runSetup({ dir, all: true, features: ["lint"] });
    const pkg = await readPkg(dir);
    // All features applied, not just lint
    expect(pkg.scripts?.["fmt"]).toBe("oxfmt");
    expect(pkg.scripts?.["changeset"]).toBe("changeset");
  });

  test("features list applies only the selected features", async () => {
    await runSetup({ dir, features: ["lint", "format"] });
    const pkg = await readPkg(dir);
    expect(pkg.scripts?.["lint"]).toBe("oxlint");
    expect(pkg.scripts?.["fmt"]).toBe("oxfmt");
    // Other features not applied
    expect(pkg.scripts?.["prepare"]).toBeUndefined();
    expect(pkg.scripts?.["changeset"]).toBeUndefined();
    expect(pkg.scripts?.["preversion"]).toBeUndefined();
  });

  test("empty features list applies nothing", async () => {
    await runSetup({ dir, features: [] });
    const pkg = await readPkg(dir);
    expect(pkg.scripts).toBeUndefined();
    expect(pkg.devDependencies).toBeUndefined();
  });
});
