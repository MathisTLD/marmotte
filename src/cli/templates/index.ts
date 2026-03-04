import { cp, readFile, writeFile } from "fs/promises";
import { basename } from "path";
import { join } from "path";
import { downloadTemplate } from "giget";
import type { Template, TemplateOptions } from "./types.js";
import { nodeLibraryTemplate } from "./node-library.js";
import { uiLibraryTemplate } from "./ui-library.js";
import { uiAppTemplate } from "./ui-app.js";

export type { Template, TemplateOptions };

export const builtinTemplates: Template[] = [
  nodeLibraryTemplate,
  uiLibraryTemplate,
  uiAppTemplate,
];

/**
 * Resolve a template by id (built-in), giget source, or local path.
 *
 * Supported sources:
 * - Built-in id: "node-library" | "ui-library" | "ui-app"
 * - giget source: "github:user/repo", "gitlab:user/repo", "bitbucket:user/repo", "https://..."
 * - Local path: "./path/to/template" or "/absolute/path"
 * - Bare shorthand: "user/repo" (assumed github)
 */
export function resolveTemplate(source: string): Template {
  // Check built-ins first
  const builtin = builtinTemplates.find((t) => t.id === source);
  if (builtin) return builtin;

  // Local path (starts with . or /)
  if (source.startsWith(".") || source.startsWith("/")) {
    return createLocalTemplate(source);
  }

  // Remote: giget handles github:, gitlab:, bitbucket:, sourcehut:, https://
  // Bare "user/repo" shorthand → prefix with "github:"
  const gigetSource =
    source.startsWith("github:") ||
    source.startsWith("gitlab:") ||
    source.startsWith("bitbucket:") ||
    source.startsWith("sourcehut:") ||
    source.startsWith("https://") ||
    source.startsWith("http://")
      ? source
      : `github:${source}`;

  return createRemoteTemplate(gigetSource);
}

function createRemoteTemplate(source: string): Template {
  return {
    id: basename(source),
    label: `Remote template: ${source}`,
    async generate(dir, opts) {
      await generateFromRemote(source, dir, opts);
    },
  };
}

function createLocalTemplate(source: string): Template {
  return {
    id: basename(source),
    label: `Local template: ${source}`,
    async generate(dir, opts) {
      await generateFromDir(source, dir, opts);
    },
  };
}

async function applySubstitutions(dir: string, opts: TemplateOptions) {
  const pkgPath = join(dir, "package.json");
  try {
    const raw = await readFile(pkgPath, "utf8");
    const updated = raw
      .replace(/\{\{name\}\}/g, opts.name)
      .replace(/\{\{marmotteVersion\}\}/g, opts.marmotteVersion);
    await writeFile(pkgPath, updated);
  } catch {
    // no package.json — that's fine
  }
}

async function generateFromRemote(source: string, dest: string, opts: TemplateOptions) {
  await downloadTemplate(source, { dir: dest, force: true });
  await applySubstitutions(dest, opts);
}

async function generateFromDir(src: string, dest: string, opts: TemplateOptions) {
  await cp(src, dest, {
    recursive: true,
    filter: (f) => !f.includes("/.git"),
  });
  await applySubstitutions(dest, opts);
}
