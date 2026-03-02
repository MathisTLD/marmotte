import { resolvePackageMeta } from "@/vite/package-meta/client";
import { resolveCommentType, type CommentType } from "./format";

export interface CodeGenContext {
  generator: {
    name: string;
    version: string;
  };
  commentType: CommentType;
}

export function resolveContext(filePath: string): CodeGenContext {
  // FIXME: this doesn't resolve to to calling package's meta but uses current (marmotte)
  const { name, version } = resolvePackageMeta();
  return {
    generator: {
      name,
      version,
    },
    commentType: resolveCommentType(filePath, true),
  };
}
