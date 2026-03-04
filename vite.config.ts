/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { resolve } from "path";

import { nodeExternals } from "./src/vite/externals";
import dts from "./src/vite/dts";
import { PackageMeta } from "./src/vite/package-meta";
import { TypeDocPlugin } from "./src/vite/typedoc";

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
    TypeDocPlugin({ tsconfig: "tsconfig.lib.json" }),
  ],
  build: {
    minify: false,
    sourcemap: true,
    lib: {
      entry: {
        // vite plugins
        "vite/docs": "./src/vite/docs/index.ts",
        "vite/dts": "./src/vite/dts.ts",
        "vite/lib": "./src/vite/lib.ts",
        "vite/typedoc": "./src/vite/typedoc.ts",
        "vite/ui": "./src/vite/ui.ts",
        // TODO: we might wanna build client files with another vite config
        "vite/docs/client": "./src/vite/docs/client.ts",
        "vite/package-meta/client": "./src/vite/package-meta/client.ts",
        // vitepress
        "vitepress/sidebar": "./src/vitepress/sidebar.ts",
        // vitest
        "vitest/index": "./src/vitest/index.ts",
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
