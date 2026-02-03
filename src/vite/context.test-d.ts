import { test, assertType, expectTypeOf } from "vitest";
import { contextFactory, getPathMap, VitePluginContext } from "./context";

test("path map correctly inferred", () => {
  const Context = contextFactory({
    paths: {
      sourceDir: "./src",
      docsDir: "./docs",
    },
  });

  const ctx = new Context({ root: "/foo/bar" });
  type P = getPathMap<typeof ctx>;

  assertType<VitePluginContext<"sourceDir" | "docsDir">>(ctx);
  expectTypeOf<"sourceDir" | "docsDir">().toEqualTypeOf<P>();

  assertType<(base: "root" | "sourceDir" | "docsDir") => string>(
    ctx.resolveBase,
  );
});
