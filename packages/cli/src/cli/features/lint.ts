import type { Feature } from "./index.js";

export const lintFeature: Feature = {
  id: "lint",
  label: "Lint (oxlint)",
  async apply(_dir, pkg) {
    pkg.scripts ??= {};
    pkg.scripts["lint"] = "oxlint";
    pkg.scripts["lint:fix"] = "oxlint --fix";
    pkg.devDependencies ??= {};
    pkg.devDependencies["oxlint"] = "^1.51.0";
  },
};
