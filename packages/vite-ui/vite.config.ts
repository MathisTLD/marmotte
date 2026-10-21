import { defineConfig } from "vite-plus";
import { packageConfig } from "../../tooling/pack";

export default defineConfig(
  packageConfig(import.meta.dirname, {
    test: false,
    pack: {
      entry: { index: "src/index.ts" },
    },
  }),
);
