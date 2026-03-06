import { join } from "path";
import { safeWrite } from "../../utils/fs.js";
import type { Template, TemplateOptions } from "./types.js";

export const uiLibraryTemplate: Template = {
  id: "ui-library",
  label: "Vue/Vuetify UI library",
  async generate(dir, { name, marmotteVersion, includeExamples }: TemplateOptions) {
    await safeWrite(
      join(dir, "package.json"),
      JSON.stringify(
        {
          name,
          version: "0.1.0",
          description: "",
          license: "ISC",
          type: "module",
          main: "dist/index.js",
          scripts: {
            build: "vite build",
            test: "vitest",
          },
          devDependencies: {
            marmotte: `^${marmotteVersion}`,
            "sass-embedded": "^1.97.3",
            vite: "^7.3.1",
            vitepress: "^2.0.0-alpha.16",
            vitest: "^4.0.18",
          },
        },
        null,
        2,
      ) + "\n",
    );

    await safeWrite(
      join(dir, "vite.config.ts"),
      `/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { UILib } from "marmotte/vite/ui";

export default defineConfig({
  plugins: [
    UILib({
      root: import.meta.dirname,
      dts: { tsconfigPath: "./tsconfig.lib.json" },
    }),
  ],
});
`,
    );

    await safeWrite(
      join(dir, "tsconfig.json"),
      JSON.stringify(
        {
          files: [],
          references: [{ path: "./tsconfig.lib.json" }, { path: "./tsconfig.node.json" }],
        },
        null,
        2,
      ) + "\n",
    );

    await safeWrite(
      join(dir, "tsconfig.lib.json"),
      JSON.stringify(
        {
          extends: "marmotte/tsconfig/tsconfig.vue.json",
          include: ["src/**/*", "src/**/*.vue"],
          exclude: [],
          compilerOptions: { paths: { "@/*": ["./src/*"] } },
        },
        null,
        2,
      ) + "\n",
    );

    await safeWrite(
      join(dir, "tsconfig.node.json"),
      JSON.stringify(
        {
          extends: "marmotte/tsconfig/tsconfig.vite-config.json",
          include: ["vite.config.*"],
        },
        null,
        2,
      ) + "\n",
    );

    await safeWrite(
      join(dir, "src/index.ts"),
      includeExamples
        ? `/**
 * Some very useful class
 */
export class MyClass {}
`
        : "",
    );

    if (includeExamples) {
      await safeWrite(
        join(dir, "src/components/foo.vue"),
        `<template>
  <div class="foo">
    <div class="bar">foo bar</div>
  </div>
</template>
<style lang="scss">
.foo {
  .bar {
    color: red;
  }
}
</style>
`,
      );
    }
  },
};
