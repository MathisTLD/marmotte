import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { withTmpDir } from "@mrmt/vitest";
import { Context } from "./context";
import { writeDefaultFiles } from "./codegen";

const tmp = withTmpDir();
const read = (file: string) => readFile(join(tmp.path, file), "utf8");

async function scaffold(options: { workspace?: boolean }, pkg: object = {}) {
  await rm(join(tmp.path, "docs"), { recursive: true, force: true });
  await writeFile(
    join(tmp.path, "package.json"),
    JSON.stringify({ name: "my-pkg", version: "1.0.0", ...pkg }),
  );
  await writeDefaultFiles(new Context({ root: tmp.path, ...options }));
}

describe("writeDefaultFiles", () => {
  test("single package site (default): sidebar plugin and an API reference link", async () => {
    await scaffold({}, { description: "A package" });
    const config = await read("docs/.vitepress/config.ts");
    expect(config).toContain('import Sidebar from "@mrmt/vitepress-plugin-sidebar";');
    expect(config).toContain("Sidebar()");
    expect(config).not.toContain("workspaceDocs");
    const home = await read("docs/index.md");
    expect(home).toContain('tagline: "A package"');
    expect(home).toContain("link: /reference/api/");
  });

  test("monorepo mode: workspaceDocs config and no API reference link", async () => {
    await scaffold({ workspace: true }, { description: "A monorepo" });
    const config = await read("docs/.vitepress/config.ts");
    expect(config).toContain(
      'import { workspaceDocs } from "@mrmt/vitepress-plugin-sidebar/workspace";',
    );
    expect(config).toContain("await workspaceDocs()");
    expect(config).toContain("...workspace.themeConfig");
    expect(config).not.toContain("Sidebar()");
    const home = await read("docs/index.md");
    expect(home).toContain('tagline: "A monorepo"');
    expect(home).not.toContain("/reference/api/");
    // theme and gitignore are shared by both modes
    expect(await read("docs/.vitepress/theme/index.ts")).toContain("indent.css");
    expect(await read("docs/.vitepress/.gitignore")).toContain("dist");
  });

  test("a package without description gets an empty tagline, not the text `undefined`", async () => {
    await scaffold({ workspace: true });
    expect(await read("docs/index.md")).toContain('tagline: ""');
  });

  test("files are written once: existing ones are left alone", async () => {
    await scaffold({ workspace: true });
    const configPath = join(tmp.path, "docs/.vitepress/config.ts");
    await writeFile(configPath, "// mine\n");
    await writeDefaultFiles(new Context({ root: tmp.path }));
    expect(await read("docs/.vitepress/config.ts")).toBe("// mine\n");
  });
});
