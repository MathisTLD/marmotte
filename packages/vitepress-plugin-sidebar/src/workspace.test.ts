import { describe, expect, test } from "vitest";
import { createMarkdownRenderer } from "vitepress";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { withTmpDir } from "@mrmt/vitest";
import { workspaceDocs } from "./workspace";

const tmp = withTmpDir();

async function write(file: string, content = "# page\n") {
  const path = join(tmp.path, file);
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, content);
}

/** a pnpm workspace: a (index + guide), b (no index), c (no docs), root README, site shell */
async function setup() {
  await write("pnpm-workspace.yaml", "packages:\n  - packages/*\n");
  await write("package.json", JSON.stringify({ name: "root", private: true }));
  await write("README.md");
  await write("docs/index.md");
  for (const name of ["a", "b", "c"]) {
    await write(
      `packages/${name}/package.json`,
      JSON.stringify({ name: `@x/${name}`, version: "1.0.0" }),
    );
    await write(`packages/${name}/README.md`);
    await write(`packages/${name}/src/index.ts`, "export {};\n");
  }
  await write("packages/a/docs/index.md");
  await write("packages/a/docs/guide.md");
  await write("packages/b/docs/only/x.md");
}

describe("workspaceDocs", () => {
  test("discovers packages with docs, maps them to urls and leaves other files out", async () => {
    await setup();
    const config = await workspaceDocs({ root: tmp.path, order: ["b"] });

    expect(config.srcDir).toBe("..");
    expect(config.rewrites).toEqual({
      "docs/:rest*": ":rest*",
      "packages/a/docs/:rest*": "a/:rest*",
      "packages/b/docs/:rest*": "b/:rest*",
    });
    // `c` has no docs: not in the nav. `b` is ordered first and has no index: links its first page.
    expect(config.themeConfig.nav[0].items).toEqual([
      { text: "@x/b", link: "/b/only/x" },
      { text: "@x/a", link: "/a/" },
    ]);
    expect(Object.keys(config.themeConfig.sidebar).sort()).toEqual(["/", "/a/", "/b/"]);
    // everything but the docs folders is excluded
    expect(config.srcExclude).toEqual(
      expect.arrayContaining([
        "**/node_modules/**",
        "README.md",
        "packages/a/README.md",
        "packages/a/src/**",
        "packages/c/README.md",
        "packages/c/src/**",
      ]),
    );
    expect(config.srcExclude.filter((glob) => glob.includes("/docs"))).toEqual([]);
  });

  test("relative .md links resolve to site urls, across packages and to the shell", async () => {
    await setup();
    const config = await workspaceDocs({ root: tmp.path });
    const md = await createMarkdownRenderer(tmp.path, { config: config.markdown.config });
    // with rewrites, `env.path` is the virtual path and `env.realPath` the real file
    const html = md.render(
      "[own](./guide.md) [other](../../b/docs/only/x.md#top) [shell](../../../docs/index.md)",
      {
        path: join(tmp.path, "a/index.md"),
        relativePath: "a/index.md",
        realPath: join(tmp.path, "packages/a/docs/index.md"),
      },
    );
    expect(html).toContain('href="/a/guide.html"');
    expect(html).toContain('href="/b/only/x.html#top"');
    expect(html).toContain('href="/"');
  });
});
