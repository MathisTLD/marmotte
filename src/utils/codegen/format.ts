export type CommentType = "//" | "#" | "xml";
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

export function indent(code: string, indentation: string) {
  return code
    .split("\n")
    .map((line) => indentation + line)
    .join("\n");
}
