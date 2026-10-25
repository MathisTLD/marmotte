import { EventEmitter } from "node:events";
import { mkdir, stat, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { withTmpDir } from "@mrmt/vitest";
import { restartOnPageChanges } from "./watch";

const tmp = withTmpDir();
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function page(name: string, content: string) {
  const file = join(tmp.path, "docs", name);
  await mkdir(join(file, ".."), { recursive: true });
  await writeFile(file, content);
  return file;
}

/** starts the plugin on a fake dev server; resolves to a counter of config "touches" */
async function start() {
  const configPath = join(tmp.path, "config.ts");
  await writeFile(configPath, "export default {};\n");
  // make the mtime clearly older than anything the plugin writes
  const old = new Date(Date.now() - 60_000);
  await (await import("node:fs/promises")).utimes(configPath, old, old);
  const watcher = new EventEmitter();
  const plugin = restartOnPageChanges([join(tmp.path, "docs")], { debounce: 20 });
  (plugin.configureServer as (server: unknown) => void)({
    watcher,
    config: { vitepress: { configPath }, logger: { info() {} } },
  });
  const touched = async () => (await stat(configPath)).mtimeMs > old.getTime() + 1000;
  return { watcher, touched, configPath };
}

describe("restartOnPageChanges", () => {
  test("restarts (touches the config) when a page is added, removed or retitled, not on body edits", async () => {
    const existing = await page("a.md", "# A\n\nbody\n");
    const { watcher, touched } = await start();

    // body-only edit: the sidebar doesn't change
    await writeFile(existing, "# A\n\nother body\n");
    watcher.emit("change", existing);
    await wait(80);
    expect(await touched()).toBe(false);

    // retitle: restart
    await writeFile(existing, "# A renamed\n\nother body\n");
    watcher.emit("change", existing);
    await wait(80);
    expect(await touched()).toBe(true);
  });

  test("restarts on add/unlink of a page inside the docs folders only", async () => {
    const { watcher, touched } = await start();

    watcher.emit("add", join(tmp.path, "elsewhere", "x.md"));
    watcher.emit("add", join(tmp.path, "docs", "notes.txt"));
    await wait(80);
    expect(await touched()).toBe(false);

    const added = await page("b.md", "# B\n");
    watcher.emit("add", added);
    await wait(80);
    expect(await touched()).toBe(true);

    const { watcher: second, touched: secondTouched } = await start();
    await rm(added);
    second.emit("unlink", added);
    await wait(80);
    expect(await secondTouched()).toBe(true);
  });
});
