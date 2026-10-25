import { defineConfig } from "vite-plus";
import { packageConfig } from "../../tooling/pack";

export default defineConfig(
  packageConfig(import.meta.dirname, {
    test: true,
    pack: {
      entry: { sidebar: "src/sidebar.ts", workspace: "src/workspace.ts" },
      copy: [{ from: "src/indent.css", to: "dist" }],
    },
  }),
);
