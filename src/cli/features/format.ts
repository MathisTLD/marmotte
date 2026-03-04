import type { Feature } from "./index.js";

export const formatFeature: Feature = {
  id: "format",
  label: "Format (oxfmt)",
  async apply(_dir, pkg) {
    pkg.scripts ??= {};
    pkg.scripts["fmt"] = "oxfmt";
    pkg.scripts["fmt:check"] = "oxfmt --check";
    pkg.devDependencies ??= {};
    pkg.devDependencies["oxfmt"] = "^0.36.0";
  },
};
