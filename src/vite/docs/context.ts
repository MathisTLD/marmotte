import { contextFactory } from "@/vite/lib/context";

export class Context extends contextFactory(
  {
    /** URL path where the VitePress dev server is mounted, or `false` to disable */
    serve: "/docs/" as string | false,
  },
  {
    paths: {
      sourceDir: "./src",
      docsDir: "./docs",
    },
  },
) {
  readonly generator = {
    name: "marmotte/vite/docs",
    version: import.meta.env.VITE_PACKAGE_VERSION,
  };
}
