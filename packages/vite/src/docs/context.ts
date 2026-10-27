import { contextFactory } from "../lib/context";

export class Context extends contextFactory(
  {
    /** URL path where the VitePress dev server is mounted, or `false` to disable */
    serve: "/docs/" as string | false,
    /** scaffold a monorepo site (see {@link Options.workspace}) instead of a single-package one */
    workspace: false as boolean,
  },
  {
    paths: {
      sourceDir: "./src",
      docsDir: "./docs",
    },
  },
) {
  readonly generator = {
    name: "@mrmt/vite/docs",
    version: import.meta.env.VITE_PACKAGE_VERSION,
  };
}
