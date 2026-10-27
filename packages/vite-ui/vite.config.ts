import { defineConfig } from "vite-plus";
import { packageConfig } from "../../tooling/pack";
import { apiDocs } from "../../tooling/typedoc";

const entry = { index: "src/index.ts" };

export default defineConfig(
  packageConfig(import.meta.dirname, {
    test: false,
    pack: { entry, plugins: [apiDocs(import.meta.dirname, entry)] },
  }),
);
