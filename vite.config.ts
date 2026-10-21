import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  run: {
    tasks: {
      // docs aren't a workspace package: they're built from the root
      // interim: copy each package's generated docs/api into the VitePress site
      "api-docs": {
        command: "node tooling/copy-api-docs.ts",
        dependsOn: [
          "@mrmt/vitest#build",
          "@mrmt/vite#build",
          "@mrmt/vitepress-plugin-sidebar#build",
          "@mrmt/vite-ui#build",
          "marmotte#build",
        ],
        cache: false,
      },
      docs: { command: "vitepress dev docs", dependsOn: ["api-docs"], cache: false },
      "build:docs": { command: "vitepress build docs", dependsOn: ["api-docs"] },
    },
  },
});
