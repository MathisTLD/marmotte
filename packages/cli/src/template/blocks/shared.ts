import type { Options } from "../base.js";

export const json = (value: unknown) => JSON.stringify(value, null, 2) + "\n";

/** devDependencies every generated project has */
export const commonDevDependencies = ({ marmotteVersion }: Options) => ({
  "@mrmt/tsconfig": `^${marmotteVersion}`,
  "@mrmt/vite": `^${marmotteVersion}`,
  "@mrmt/vitepress-plugin-sidebar": `^${marmotteVersion}`,
  vite: "^8.0.3",
  vitepress: "^2.0.0-alpha.16",
  vitest: "^4.0.18",
});

/** `tsconfig.json` referencing the project config (`tsconfig.lib.json` / `tsconfig.app.json`) and the Vite config one */
export const tsconfigFiles = (project: "lib" | "app", projectConfig: object) => ({
  "tsconfig.json": json({
    files: [],
    references: [{ path: `./tsconfig.${project}.json` }, { path: "./tsconfig.node.json" }],
  }),
  [`tsconfig.${project}.json`]: json(projectConfig),
  "tsconfig.node.json": json({
    extends: "@mrmt/tsconfig/tsconfig.vite-config.json",
    include: ["vite.config.*"],
  }),
});

export const exampleClass = `/**
 * Some very useful class
 */
export class MyClass {}
`;
