import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { writeDefaultFile } from "../../utils/codegen/index.js";
import type { Template, TemplateOptions } from "./types.js";

async function writeJson(dir: string, relPath: string, content: string) {
  const full = join(dir, relPath);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, content);
}

export const nodeLibraryTemplate: Template = {
  id: "node-library",
  label: "Node library",
  async generate(dir, { name, marmotteVersion, includeExamples }: TemplateOptions) {
    await writeJson(
      dir,
      "package.json",
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
            "@types/node": "^24.10.10",
            marmotte: `^${marmotteVersion}`,
            vite: "^7.3.1",
            vitest: "^4.0.18",
          },
        },
        null,
        2,
      ) + "\n",
    );

    await writeDefaultFile(
      join(dir, "vite.config.ts"),
      `/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { Lib } from "marmotte/vite/lib";

export default defineConfig({
  plugins: [Lib({ dts: { tsconfigPath: "./tsconfig.lib.json" } })],
});
`,
    );

    await writeJson(
      dir,
      "tsconfig.json",
      JSON.stringify(
        {
          files: [],
          references: [{ path: "./tsconfig.lib.json" }, { path: "./tsconfig.node.json" }],
        },
        null,
        2,
      ) + "\n",
    );

    await writeJson(
      dir,
      "tsconfig.lib.json",
      JSON.stringify(
        {
          extends: "marmotte/tsconfig/tsconfig.node-lib.json",
          compilerOptions: { rootDir: "./src", paths: { "@/*": ["./src/*"] } },
          include: ["src"],
        },
        null,
        2,
      ) + "\n",
    );

    await writeJson(
      dir,
      "tsconfig.node.json",
      JSON.stringify(
        {
          extends: "marmotte/tsconfig/tsconfig.vite-config.json",
          include: ["vite.config.*"],
        },
        null,
        2,
      ) + "\n",
    );

    await writeDefaultFile(
      join(dir, "src/index.ts"),
      includeExamples
        ? `/**
 * Some very useful class
 */
export class MyClass {}
`
        : "",
    );
  },
};
