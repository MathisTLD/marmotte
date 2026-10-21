import { test, assertType, expectTypeOf } from "vitest";
import { contextFactory, type getPathMap, type contextOptions } from "./context";

test("path map correctly inferred", () => {
  const Context = contextFactory(
    {},
    {
      paths: {
        sourceDir: "./src",
        docsDir: "./docs",
      },
    },
  );

  const ctx = new Context({ root: "/foo/bar" });
  type P = getPathMap<typeof ctx>;

  expectTypeOf<"sourceDir" | "docsDir">().toEqualTypeOf<P>();
  assertType<(base: "root" | "sourceDir" | "docsDir") => string>(ctx.resolveBase);
});

test("path options are string | undefined on ctx.options", () => {
  const Context = contextFactory({}, { paths: { sourceDir: "./src" } });
  const ctx = new Context({ root: "/foo" });
  expectTypeOf(ctx.options.sourceDir).toEqualTypeOf<string | undefined>();
});

test("option default type is preserved non-optionally on ctx.options", () => {
  const Context = contextFactory({ serve: "/docs/" as string | false }, { paths: {} });
  const ctx = new Context({ root: "/foo" });
  expectTypeOf(ctx.options.serve).toEqualTypeOf<string | false>();
});

test("constructor accepts option and path overrides", () => {
  const Context = contextFactory(
    { serve: "/docs/" as string | false },
    { paths: { sourceDir: "./src" } },
  );
  assertType<InstanceType<typeof Context>>(new Context({ root: "/foo", serve: false }));
  assertType<InstanceType<typeof Context>>(new Context({ root: "/foo", sourceDir: "./lib" }));
});

test("contextOptions extracts correct resolved type", () => {
  const Context = contextFactory(
    { serve: "/docs/" as string | false },
    { paths: { docsDir: "./docs" } },
  );
  type Opts = contextOptions<InstanceType<typeof Context>>;
  expectTypeOf<string | false>().toEqualTypeOf<Opts["serve"]>();
  expectTypeOf<string | undefined>().toEqualTypeOf<Opts["docsDir"]>();
});

test("tuple path default: derived path is in path map and resolvable", () => {
  const Context = contextFactory(
    {},
    {
      paths: {
        sourceDir: "./src",
        testDir: ["sourceDir", "__tests__"],
      },
    },
  );
  const ctx = new Context({ root: "/foo" });
  type P = getPathMap<typeof ctx>;
  expectTypeOf<"sourceDir" | "testDir">().toEqualTypeOf<P>();
  expectTypeOf(ctx.resolve("testDir")).toEqualTypeOf<string>();
  expectTypeOf(ctx.options.testDir).toEqualTypeOf<string | undefined>();
});

test("key conflict: TypeScript error when options and paths share a key name", () => {
  contextFactory(
    { sourceDir: "x" },
    // @ts-expect-error options and paths share key names
    { paths: { sourceDir: "./src" } },
  );
});
