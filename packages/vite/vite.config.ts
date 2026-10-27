import { defineConfig } from "vite-plus";
import { packageConfig } from "../../tooling/pack";
import { apiDocs } from "../../tooling/typedoc";

const entry = {
  lib: "src/lib.ts",
  "lib/context": "src/lib/context.ts",
  "base-config": "src/base-config.ts",
  codegen: "src/codegen.ts",
  "docs/index": "src/docs/index.ts",
  dts: "src/dts.ts",
  "package-meta/index": "src/package-meta/index.ts",
};

export default defineConfig(
  packageConfig(import.meta.dirname, {
    test: true,
    pack: { entry, plugins: [apiDocs(import.meta.dirname, entry)] },
  }),
);
