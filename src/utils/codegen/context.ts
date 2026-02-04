import { resolvePackageMeta } from "@/vite/plugins/package-meta/client";
import { CommentType } from "./format";

export interface CodeGenContext {
  generator: {
    name: string;
    version: string;
  };
  commentType: CommentType;
}

export function resolveContext(_filePath: string): CodeGenContext {
  const { name, version } = resolvePackageMeta();
  return {
    generator: {
      name: name ?? "marmotte",
      version: version ?? "unknown",
    },
    // TODO: infer from filepath
    commentType: "//",
  };
}
