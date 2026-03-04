import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import type { Feature } from "./index.js";

export const changesetsFeature: Feature = {
  id: "changesets",
  label: "Changesets (versioning + changelog)",
  async apply(dir, pkg) {
    // Create .changeset/config.json
    const changesetDir = join(dir, ".changeset");
    await mkdir(changesetDir, { recursive: true });
    await writeFile(
      join(changesetDir, "config.json"),
      JSON.stringify(
        {
          $schema: "https://unpkg.com/@changesets/config/schema.json",
          changelog: "@changesets/cli/changelog",
          commit: false,
          fixed: [],
          linked: [],
          access: "restricted",
          baseBranch: "main",
          updateInternalDependencies: "patch",
          ignore: [],
        },
        null,
        2,
      ) + "\n",
    );

    await writeFile(join(changesetDir, "README.md"), `# Changesets\n\nSee [changesets docs](https://github.com/changesets/changesets).\n`);

    pkg.scripts ??= {};
    pkg.scripts["changeset"] = "changeset";
    pkg.scripts["version"] = "changeset version";
    pkg.scripts["release"] = "npm run build && changeset publish";

    pkg.devDependencies ??= {};
    pkg.devDependencies["@changesets/cli"] = "^2.0.0";
  },
};
