import { resolve, relative } from "path";
import fs from "fs/promises";
import { existsSync, statSync } from "fs";

export type PathFilter = RegExp | ((path: string) => boolean);
function normalizePathFilter(filter: PathFilter) {
  if (filter instanceof RegExp) {
    return (path: string) => filter.test(path);
  }
  return filter;
}

/**
 * Recursively iterates over a directory (and its subdirectories) files
 * @param dir
 */
export async function* walk(dir: string, filter?: PathFilter): AsyncGenerator<string> {
  const _filter = filter ? normalizePathFilter(filter) : () => true;
  for await (const d of await fs.opendir(dir)) {
    const entry = resolve(dir, d.name);
    if (d.isDirectory()) yield* walk(entry, _filter);
    else if (d.isFile() && _filter(entry)) yield entry;
  }
}

/**
 * Walks `sourceDir` recursively and returns a Rollup-compatible entry map
 * (`{ [name]: absolutePath }`) for every file matched by `filter`.
 * The entry name is the file path relative to `sourceDir`, without its extension.
 *
 * @example
 * // { "index": "/abs/src/index.ts", "utils/foo": "/abs/src/utils/foo.ts" }
 * await resolveEntries("/abs/src", /\.ts$/)
 */
export async function resolveEntries(sourceDir: string, filter: PathFilter) {
  const entries: Record<string, string> = {};
  for await (const entry of walk(sourceDir, filter)) {
    const name = relative(sourceDir, entry).replace(/\.[a-z]+$/, "");
    entries[name] = entry;
  }
  return entries;
}

/** Returns `true` if `path` exists and is a directory. */
export function dirExists(path: string) {
  return existsSync(path) && statSync(path).isDirectory();
}

/** Returns `true` if `path` exists and is a regular file. */
export function fileExists(path: string) {
  return existsSync(path) && statSync(path).isFile();
}

/**
 * Returns `true` if `path` resolves to a TypeScript module — either:
 * - a directory containing an `index.ts`, or
 * - a `<path>.ts` file.
 */
export function moduleExists(path: string) {
  return (dirExists(path) && fileExists(resolve(path, "index.ts"))) || fileExists(path + ".ts");
}
