/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { resolve } from "path";

import dts from "unplugin-dts/vite";
import { nodeExternals } from "rollup-plugin-node-externals";
import { PackageMeta } from "./src/vite/plugins/package-meta";

export default defineConfig({
  plugins: [
    PackageMeta(),
    dts({
      tsconfigPath: "./tsconfig.lib.json",
      afterDiagnostic(diagnostics) {
        // TODO: not allowing to build lib with typing error should be a default
        if (diagnostics.length) {
          throw new Error("got typing errors");
        }
      },
    }),
    nodeExternals(),
  ],
  build: {
    minify: false,
    sourcemap: true,
    lib: {
      entry: {
        index: "./src/index.ts",
        "vite/index": "./src/vite/index.ts",
        // TODO: we might wanna build client files with another vite config
        "vite/plugins/docs/client": "./src/vite/plugins/docs/client.ts",
        "vite/plugins/package-meta/client": "./src/vite/plugins/package-meta/client.ts",
      },
      formats: ["es"],
    },
    rollupOptions: {
      output: {
        preserveModules: true,
        preserveModulesRoot: "./src",
      },
      treeshake: false,
    },
  },
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    exclude: ["**/node_modules/**", "**/dist/**", "./tests/project-templates/**"],
  },
});
