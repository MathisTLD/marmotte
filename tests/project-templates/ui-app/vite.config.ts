/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { UIApp } from "marmotte/vite/ui";

export default defineConfig({
  plugins: [
    UIApp({
      root: import.meta.dirname,
      lib: { dts: { tsconfigPath: "./tsconfig.app.json" } },
    }),
  ],
});
