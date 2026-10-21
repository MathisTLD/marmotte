import { defineConfig } from "vite-plus";
import { packageConfig } from "../../tooling/pack";

export default defineConfig(
  packageConfig(import.meta.dirname, {
    test: true,
    pack: {
      entry: {
        "cli/index": "src/cli/index.ts",
        "cli/api": "src/cli/api.ts",
        "mcp/index": "src/mcp/index.ts",
      },
    },
  }),
);
