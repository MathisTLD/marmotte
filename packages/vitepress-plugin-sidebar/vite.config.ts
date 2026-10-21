import { defineConfig } from "vite-plus";
import { packageConfig } from "../../tooling/pack";

export default defineConfig(
  packageConfig(import.meta.dirname, {
    test: false,
    pack: {
      entry: { sidebar: "src/sidebar.ts" },
      copy: [{ from: "src/indent.css", to: "dist" }],
    },
  }),
);
