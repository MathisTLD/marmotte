/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { UILib } from "marmotte/vite/plugins/ui";

export default defineConfig({
  plugins: [
    UILib({
      root: import.meta.dirname,
      lib: { dts: { tsconfigPath: "./tsconfig.lib.json" } },
    }),
  ],
});
