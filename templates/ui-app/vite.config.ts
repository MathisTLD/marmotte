/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { UIApp } from "marmotte/vite/plugins/ui";

export default defineConfig({
  plugins: [UIApp({ root: import.meta.dirname })],
});
