// Dev server: refresh the sidebar when pages are added/removed or when an edit changes what the
// sidebar shows (title, order).
//
// The sidebar is computed from the docs tree when the VitePress config is evaluated, and VitePress
// only refreshes its page list on file changes, not the user config. VitePress restarts (and
// re-evaluates the config) when the config file changes, so we touch it.
import { existsSync, readdirSync, readFileSync, utimesSync } from "node:fs";
import { join, sep } from "node:path";
import type { Plugin, ViteDevServer } from "vite";

export interface RestartOptions {
  /** Wait this long (ms) after the last change before restarting. @default 500 */
  debounce?: number;
}

/** what the sidebar derives from a page: front matter `title` / `order`, first `#` heading */
function signature(file: string): string {
  try {
    const source = readFileSync(file, "utf8");
    const frontMatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const body = frontMatter ? source.slice(frontMatter[0].length) : source;
    return JSON.stringify([
      frontMatter?.[1].match(/^title:.*$/m)?.[0],
      frontMatter?.[1].match(/^order:.*$/m)?.[0],
      body.match(/^# .*$/m)?.[0],
    ]);
  } catch {
    return "";
  }
}

function collect(dir: string, into: Map<string, string>) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules") collect(path, into);
    } else if (entry.name.endsWith(".md")) into.set(path, signature(path));
  }
}

/**
 * Vite plugin (dev server only) restarting VitePress when the sidebar would change.
 * @param pageDirs absolute paths of the folders holding the pages (or a function computing them)
 */
export function restartOnPageChanges(
  pageDirs: string[] | ((server: ViteDevServer) => string[]),
  options: RestartOptions = {},
): Plugin {
  const { debounce = 500 } = options;
  return {
    name: "marmotte:restart-on-page-changes",
    apply: "serve",
    configureServer(server) {
      const configPath = (server.config as { vitepress?: { configPath?: string } }).vitepress
        ?.configPath;
      if (!configPath) return;
      const dirs = typeof pageDirs === "function" ? pageDirs(server) : pageDirs;

      const known = new Map<string, string>();
      for (const dir of dirs) collect(dir, known);
      const inDocs = (file: string) =>
        file.endsWith(".md") && dirs.some((d) => file.startsWith(d + sep));

      let timer: ReturnType<typeof setTimeout> | undefined;
      const restart = (why: string) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          server.config.logger.info(`${why}: restarting to refresh the sidebar`, {
            timestamp: true,
          });
          const now = new Date();
          utimesSync(configPath, now, now);
        }, debounce);
      };

      server.watcher.on("add", (file) => {
        if (!inDocs(file)) return;
        known.set(file, signature(file));
        restart("page added");
      });
      server.watcher.on("unlink", (file) => {
        if (!inDocs(file) || !known.delete(file)) return;
        restart("page removed");
      });
      server.watcher.on("change", (file) => {
        if (!inDocs(file)) return;
        const next = signature(file);
        if (known.get(file) === next) return;
        known.set(file, next);
        restart("page title or order changed");
      });
    },
  };
}
