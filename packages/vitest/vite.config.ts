import { defineConfig } from "vite-plus";
import { packageConfig } from "../../tooling/pack";

export default defineConfig(
  packageConfig(import.meta.dirname, {
    test: true,
    pack: {
      entry: { index: "src/index.ts", tmpdir: "src/tmpdir.ts" },
    },
  }),
);
