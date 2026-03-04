import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import type { Feature } from "./index.js";

export const preCommitFeature: Feature = {
  id: "pre-commit",
  label: "Pre-commit hooks (husky + lint-staged)",
  async apply(dir, pkg) {
    // Create .husky/pre-commit
    const huskyDir = join(dir, ".husky");
    await mkdir(huskyDir, { recursive: true });
    await writeFile(
      join(huskyDir, "pre-commit"),
      `npx lint-staged\n`,
      { mode: 0o755 },
    );

    pkg.scripts ??= {};
    pkg.scripts["prepare"] = "husky";

    pkg.devDependencies ??= {};
    pkg.devDependencies["husky"] = "^9.0.0";
    pkg.devDependencies["lint-staged"] = "^15.0.0";

    // Add lint-staged config
    (pkg as Record<string, unknown>)["lint-staged"] = {
      "*.{ts,tsx,vue}": ["oxlint --fix"],
      "*.{ts,tsx,vue,json,md}": ["oxfmt"],
    };
  },
};
