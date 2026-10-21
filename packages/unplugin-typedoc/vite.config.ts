import { defineConfig } from "vite-plus";
import { packageConfig } from "../../tooling/pack";

export default defineConfig(
  packageConfig(import.meta.dirname, {
    // no API docs: see tooling/pack.ts
    api: false,
    test: false,
    pack: { entry: { typedoc: "src/typedoc.ts" } },
  }),
);
