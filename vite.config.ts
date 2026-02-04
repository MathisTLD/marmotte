/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { resolve } from "path";

import dts from "vite-plugin-dts";
import { nodeExternals } from "rollup-plugin-node-externals";
import { PackageMeta } from "./src/vite/plugins/package-meta";

export default defineConfig({
  plugins: [
    PackageMeta(),
    dts({ tsconfigPath: "./tsconfig.lib.json" }),
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
        "vite/plugins/package-meta/client":
          "./src/vite/plugins/package-meta/client.ts",
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
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "./tests/project-templates/**",
    ],
  },
});
