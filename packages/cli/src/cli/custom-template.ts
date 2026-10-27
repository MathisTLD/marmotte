import { cp, readFile, writeFile } from "fs/promises";
import { join } from "path";
import { downloadTemplate } from "giget";

/**
 * Copies a template that isn't built in into `dir`, replacing `{{name}}` and `{{marmotteVersion}}`
 * in its `package.json`.
 *
 * - git source: `github:user/repo`, `gitlab:user/repo`, `https://…` (giget), or `user/repo` (github)
 * - local path: starts with `.` or `/`
 */
export async function generateCustomTemplate(
  source: string,
  dir: string,
  values: { name: string; marmotteVersion: string },
) {
  if (source.startsWith(".") || source.startsWith("/")) {
    await cp(source, dir, { recursive: true, filter: (f) => !f.includes("/.git") });
  } else {
    const remote = /^(github|gitlab|bitbucket|sourcehut):|^https?:\/\//.test(source)
      ? source
      : `github:${source}`;
    await downloadTemplate(remote, { dir, force: true });
  }

  const pkgPath = join(dir, "package.json");
  try {
    const raw = await readFile(pkgPath, "utf8");
    await writeFile(
      pkgPath,
      raw
        .replace(/\{\{name\}\}/g, values.name)
        .replace(/\{\{marmotteVersion\}\}/g, values.marmotteVersion),
    );
  } catch {
    // no package.json: nothing to substitute
  }
}
