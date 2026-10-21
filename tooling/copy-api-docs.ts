// Interim: copies each package's generated API reference (packages/<pkg>/docs/api) into the
// VitePress site as docs/reference/api/<pkg> (gitignored).
// Copies rather than symlinks: VitePress resolves symlinks to their real path, which breaks
// TypeDoc's relative links.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const apiDir = resolve(root, "docs/reference/api");

rmSync(apiDir, { recursive: true, force: true });
mkdirSync(apiDir, { recursive: true });
for (const name of readdirSync(resolve(root, "packages"))) {
  const source = resolve(root, "packages", name, "docs/api");
  if (existsSync(source)) cpSync(source, resolve(apiDir, name), { recursive: true });
}
