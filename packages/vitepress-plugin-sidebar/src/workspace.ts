// VitePress config for monorepos where each package keeps its docs next to its code
// (`packages/<pkg>/docs/**`) and one site aggregates them. Pages are read in place (no copy),
// served under `/<package dir name>/`.
import { existsSync, readdirSync } from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { getPackages } from "@manypkg/get-packages";
import { generateSidebar } from "vitepress-sidebar";
import type { VitePressSidebarOptions } from "vitepress-sidebar/types";
import type { DefaultTheme, UserConfig } from "vitepress";

export interface WorkspaceDocsOptions {
  /** Monorepo root. Defaults to the workspace root found from `process.cwd()`. */
  root?: string;
  /** The site shell (home page, cross-cutting docs), relative to `root`. @default "docs" */
  shell?: string;
  /** Docs folder inside each package. @default "docs" */
  docsDir?: string;
  /** Package directory names listed first in the nav, in this order. Others follow alphabetically. */
  order?: string[];
  /** Label of the nav dropdown listing the packages. @default "Packages" */
  navText?: string;
  /** Extra `srcExclude` globs (relative to `root`). */
  exclude?: string[];
}

type MarkdownConfig = NonNullable<NonNullable<UserConfig["markdown"]>["config"]>;

interface DocsPackage {
  /** URL segment and directory name, e.g. `vite-ui` */
  slug: string;
  /** package.json name, e.g. `@mrmt/vite-ui` */
  name: string;
  /** directory relative to the root, posix separators */
  dir: string;
  /** first page of the package docs, as a site URL */
  link: string;
}

const posix = (path: string) => path.split(sep).join("/");

function hasMarkdown(dir: string): boolean {
  if (!existsSync(dir)) return false;
  return readdirSync(dir, { withFileTypes: true }).some((entry) =>
    entry.isDirectory()
      ? entry.name !== "node_modules" && hasMarkdown(join(dir, entry.name))
      : entry.name.endsWith(".md"),
  );
}

/** `index.md` if there is one, else the first markdown file found (sorted) */
function firstPage(docs: string): string {
  if (existsSync(join(docs, "index.md"))) return "";
  const walk = (dir: string, prefix: string): string | undefined => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      if (entry.isDirectory()) {
        const found = walk(join(dir, entry.name), `${prefix}${entry.name}/`);
        if (found !== undefined) return found;
      } else if (entry.name.endsWith(".md")) {
        return `${prefix}${entry.name === "index.md" ? "" : entry.name.slice(0, -3)}`;
      }
    }
  };
  return walk(docs, "") ?? "";
}

/**
 * `srcExclude` can't express "everything but these folders" (negated globs don't work), so
 * list what to leave out: for the root and for every workspace package, all entries but the
 * docs folders (READMEs, changelogs, sources, ...).
 */
function excludes(root: string, shell: string, packageDirs: string[], docsDir: string) {
  const out = new Set<string>(["**/node_modules/**"]);
  const excludeEntries = (dir: string, keep: (name: string) => boolean) => {
    for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
      if (entry.name.startsWith(".") || keep(entry.name)) continue;
      const path = dir ? `${dir}/${entry.name}` : entry.name;
      out.add(entry.isDirectory() ? `${path}/**` : path);
    }
  };
  const groups = new Set(packageDirs.map((dir) => dirname(dir)).filter((dir) => dir !== "."));
  // root: keep the shell and the folders holding packages
  excludeEntries("", (name) => name === shell || groups.has(name));
  for (const group of groups) {
    // packages folder: keep package folders only
    excludeEntries(group, (name) => packageDirs.includes(`${group}/${name}`));
  }
  // inside each package: keep the docs folder only
  for (const dir of packageDirs) excludeEntries(dir, (name) => name === docsDir);
  return [...out];
}

/**
 * VitePress config pieces for a monorepo whose packages keep their docs next to their code.
 *
 * - every workspace package (npm and pnpm workspaces, via `@manypkg/get-packages`) with markdown
 *   in its `docs/` folder is served at `/<package dir name>/`
 * - the shell folder (default `docs/`) is served at `/`
 * - relative links between `.md` files work on disk **and** on the site, so people and agents can
 *   follow them without the built site (`../../vite/docs/lib.md`)
 * - a nav dropdown and one sidebar per package
 *
 * ```ts
 * // docs/.vitepress/config.ts
 * export default async () =>
 *   defineConfig({ title: "my monorepo", ...(await workspaceDocs()) });
 * ```
 *
 * ponytail: spread it, don't merge: if you set `themeConfig`, `markdown` or `rewrites` yourself,
 * merge with the returned values by hand.
 */
export async function workspaceDocs(options: WorkspaceDocsOptions = {}) {
  const { shell = "docs", docsDir = "docs", navText = "Packages", order = [] } = options;
  const { rootDir, packages } = await getPackages(options.root ?? process.cwd());
  const root = resolve(options.root ?? rootDir);

  const docsPackages: DocsPackage[] = packages
    .map((pkg) => ({ pkg, dir: posix(relative(root, pkg.dir)) }))
    .filter(({ pkg }) => hasMarkdown(join(pkg.dir, docsDir)))
    .map(({ pkg, dir }) => {
      const slug = basename(dir);
      const page = firstPage(join(pkg.dir, docsDir));
      return { slug, name: pkg.packageJson.name, dir, link: `/${slug}/${page}` };
    })
    .sort((a, b) => {
      const rank = (slug: string) => (order.includes(slug) ? order.indexOf(slug) : order.length);
      return rank(a.slug) - rank(b.slug) || a.slug.localeCompare(b.slug);
    });

  /** absolute path of a source file -> site URL (mirrors `rewrites`) */
  const toUrl = (file: string): string | undefined => {
    const rel = posix(relative(root, file));
    let path: string | undefined;
    if (rel.startsWith(`${shell}/`)) path = rel.slice(shell.length + 1);
    else {
      const pkg = docsPackages.find(({ dir }) => rel.startsWith(`${dir}/${docsDir}/`));
      if (pkg) path = `${pkg.slug}/${rel.slice(pkg.dir.length + docsDir.length + 2)}`;
    }
    return path && `/${path.replace(/\.md$/, "").replace(/(^|\/)index$/, "$1")}`;
  };

  // vitepress-sidebar resolves `documentRootPath` from the current working directory
  const sidebarOptions = (docsRoot: string, resolvePath: string): VitePressSidebarOptions => ({
    documentRootPath: posix(relative(process.cwd(), docsRoot)),
    resolvePath,
    collapsed: true,
    useFolderLinkFromIndexFile: true,
    useTitleFromFrontmatter: true,
    useTitleFromFileHeading: true,
    useFolderTitleFromIndexFile: true,
  });
  const sidebar = generateSidebar([
    sidebarOptions(join(root, shell), "/"),
    ...docsPackages.map(({ slug, dir }) => sidebarOptions(join(root, dir, docsDir), `/${slug}/`)),
  ]) as DefaultTheme.Sidebar;

  const markdownConfig: MarkdownConfig = (md) => {
    // On-disk relative links (`../../vite/docs/lib.md`) are resolved from the real source file
    // (`env.realPath`; with rewrites `env.path` is the virtual one), then mapped to site URLs.
    md.core.ruler.push("marmotte-workspace-links", (state) => {
      const file = state.env.realPath as string | undefined;
      if (!file) return;
      for (const block of state.tokens) {
        for (const token of block.children ?? []) {
          if (token.type !== "link_open") continue;
          const match = token.attrGet("href")?.match(/^(\.{1,2}\/[^#?]*\.md)(#.*)?$/);
          const url = match && toUrl(resolve(dirname(file), match[1]));
          if (url) token.attrSet("href", url + (match[2] ?? ""));
        }
      }
    });
  };

  return {
    srcDir: posix(relative(join(root, shell), root)) || ".",
    srcExclude: [
      ...excludes(
        root,
        shell,
        // all packages, docs or not: their other files must be left out too
        packages.map((pkg) => posix(relative(root, pkg.dir))).filter(Boolean),
        docsDir,
      ),
      ...(options.exclude ?? []),
    ],
    rewrites: {
      [`${shell}/:rest*`]: ":rest*",
      ...Object.fromEntries(
        docsPackages.map(({ slug, dir }) => [`${dir}/${docsDir}/:rest*`, `${slug}/:rest*`]),
      ),
    },
    markdown: { config: markdownConfig },
    themeConfig: {
      nav: [
        {
          text: navText,
          items: docsPackages.map(({ name, link }) => ({ text: name, link })),
        },
      ],
      sidebar,
    },
  } satisfies UserConfig;
}
