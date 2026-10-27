import { defineConfig } from "vite-plus";
import { packageConfig } from "../../tooling/pack";

export default defineConfig(
  packageConfig(import.meta.dirname, {
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
