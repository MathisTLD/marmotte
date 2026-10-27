import { base } from "../base.js";
import { blockPackageJson } from "./package-json.js";
import { commonDevDependencies, exampleClass, tsconfigFiles } from "./shared.js";

export const blockUILibraryBuild = base.createBlock({
  about: { name: "UI library build" },
  produce({ options }) {
    return {
      files: {
        "vite.config.ts": `/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { UILib } from "@mrmt/vite-ui";

export default defineConfig({
  plugins: [
    UILib({
      root: import.meta.dirname,
      dts: { tsconfigPath: "./tsconfig.lib.json" },
    }),
  ],
});
`,
        ...tsconfigFiles("lib", {
          extends: "@mrmt/tsconfig/tsconfig.vue.json",
          include: ["src/**/*", "src/**/*.vue"],
          exclude: [],
          compilerOptions: { paths: { "@/*": ["./src/*"] } },
        }),
      },
      addons: [
        blockPackageJson({
          properties: { main: "dist/index.js" },
          scripts: { build: "vite build", test: "vitest" },
          devDependencies: {
            ...commonDevDependencies(options),
            "@mrmt/vite-ui": `^${options.marmotteVersion}`,
            "@vue/language-core": "^3.1.5",
            "sass-embedded": "^1.97.3",
          },
        }),
      ],
    };
  },
});

export const blockUILibraryExample = base.createBlock({
  about: { name: "UI library example" },
  setup({ options }) {
    return {
      files: {
        src: {
          "index.ts": options.includeExamples ? exampleClass : "",
          components: options.includeExamples
            ? {
                "foo.vue": `<template>
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
              }
            : undefined,
        },
      },
    };
  },
});
