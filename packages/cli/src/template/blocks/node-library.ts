import { base } from "../base.js";
import { blockPackageJson } from "./package-json.js";
import { commonDevDependencies, exampleClass, tsconfigFiles } from "./shared.js";

export const blockNodeLibraryBuild = base.createBlock({
  about: { name: "Node library build" },
  produce(context) {
    const { options } = context;
    return {
      files: {
        "vite.config.ts": `/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { Lib } from "@mrmt/vite/lib";

export default defineConfig({
  plugins: [Lib({ dts: { tsconfigPath: "./tsconfig.lib.json" } })],
});
`,
        ...tsconfigFiles("lib", {
          extends: "@mrmt/tsconfig/tsconfig.node-lib.json",
          compilerOptions: { rootDir: "./src", paths: { "@/*": ["./src/*"] } },
          include: ["src"],
        }),
      },
      addons: [
        blockPackageJson({
          properties: { main: "dist/index.js" },
          scripts: { build: "vite build", test: "vitest" },
          devDependencies: { "@types/node": "^24.10.10", ...commonDevDependencies(options) },
        }),
      ],
    };
  },
});

/** Starter code: `setup` only runs when creating the project, so later edits are never overwritten. */
export const blockNodeLibraryExample = base.createBlock({
  about: { name: "Node library example" },
  setup({ options }) {
    return { files: { src: { "index.ts": options.includeExamples ? exampleClass : "" } } };
  },
});
