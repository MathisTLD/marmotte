/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { Lib } from "marmotte/vite/lib";

export default defineConfig({
  plugins: [Lib({ dts: { tsconfigPath: "./tsconfig.lib.json" } })],
});
