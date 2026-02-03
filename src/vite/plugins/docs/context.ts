import { contextFactory } from "@/vite/context";

export class Context extends contextFactory({
  paths: {
    sourceDir: "./src",
    docsDir: "./docs",
  },
}) {
  readonly generator = {
    name: "marmotte/vite/docs",
    version: "0.0.0", // FIXME: this should be automatic
  };
}
