import type { Feature } from "./index.js";

export const versionLifecycleFeature: Feature = {
  id: "version-lifecycle",
  label: "Version lifecycle (preversion test + postversion build)",
  async apply(_dir, pkg) {
    pkg.scripts ??= {};
    pkg.scripts["preversion"] = "vitest run";
    pkg.scripts["postversion"] = "npm run build";
  },
};
