export type CommentType = "//" | "#" | "xml";

const CommentTypeResolvers: [CommentType, RegExp][] = [
  ["//", /\.(j|t)sx?$/],
  ["xml", /\.((x|ht)ml|md|vue)$/],
  // TODO: other types of shell script extensions
  ["#", /\.(py|sh)$/],
  // .gitignore etc...
  ["#", /\.git[a-z]+$/],
];

/**
 * Register a new resolver for {@link resolveCommentType}
 * @param type
 * @param pattern If matched {@link type} will be returned by {@link resolveCommentType}
 * @param important if true, this resolver will have higher priority (false by default)
 */
export function registerCommentTypeResolver(type: CommentType, pattern: RegExp, important = false) {
  CommentTypeResolvers[important ? "unshift" : "push"]([type, pattern]);
}

/**
 * Detects {@link CommentType} from file path
 *
 * Additional resolvers can be registered with {@link registerCommentTypeResolver}
 * @param filePath
 * @param check If true will throw an error
 * @returns
 */
export function resolveCommentType(filePath: string, check: true): CommentType;
export function resolveCommentType(filePath: string, check = false): CommentType | undefined {
  for (const [type, pattern] of CommentTypeResolvers.toReversed()) {
    if (pattern.test(filePath)) return type;
  }
  if (check) throw new Error(`Can't resolve comment type for path "${filePath}"`);
}

export function comment(content: string, type: CommentType) {
  return content
    .split("\n")
    .map((line) => {
      if (line === "") return line;
      if (type === "xml") return `<!-- ${line} -->`;
      else return `${type} ${line}`;
    })
    .join("\n");
}

export function indent(
  code: string,
  indentation: string,
  skipLines: ((line: string) => boolean) | RegExp | false = /^\s*$/,
) {
  const skipLine =
    skipLines === false
      ? () => false
      : typeof skipLines === "function"
        ? skipLines
        : (line: string) => skipLines.test(line);
  return code
    .split("\n")
    .map((line) => (skipLine(line) ? line : indentation + line))
    .join("\n");
}
