import { defineConfig } from "vite-plus";
import { packageConfig } from "../../tooling/pack";

export default defineConfig(
  packageConfig(import.meta.dirname, {
    // no API docs: see tooling/pack.ts
    api: false,
    test: true,
    pack: {
      entry: {
        fs: "src/fs.ts",
        merge: "src/merge.ts",
        "package-json": "src/package-json.ts",
        "package-meta": "src/package-meta.ts",
        "codegen/index": "src/codegen/index.ts",
      },
    },
  }),
);
