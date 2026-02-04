import path from "path";
import { readFile } from "fs/promises";
import { ZPackageJson } from "@/utils/package-json";

export type UserVitePluginOptions<PathNames extends string> = {
  root: string;
} & Partial<{ [key in PathNames]: string }>;

type PathDefault<PathNames> =
  /** default relative to root */
  | string
  /** default relative to another named path */
  | [PathNames, string];

type PathDefaults<PathNames extends string> = {
  [Name in PathNames]: PathDefault<PathNames>;
};

function resolveBase<P extends string>(
  defaults: PathDefaults<P>,
  options: UserVitePluginOptions<P>,
  base: P | "root",
) {
  if (base === "root") return options.root;
  let basePath: string | undefined = options[base];
  if (typeof basePath === "undefined") {
    const pathDefault = defaults[base];
    if (Array.isArray(pathDefault)) {
      const [base, relative] = pathDefault;
      basePath = path.resolve(resolveBase<P>(defaults, options, base), relative);
    } else {
      basePath = pathDefault;
    }
  }
  if (path.isAbsolute(basePath)) {
    return basePath;
  } else {
    return path.resolve(options.root, basePath);
  }
}

class VitePluginContext<PathNames extends string> {
  constructor(public readonly options: UserVitePluginOptions<PathNames>) {}

  /** resolves a base path using options or defaults */
  // oxlint-disable-next-line no-unused-vars
  resolveBase(base: PathNames | "root"): string {
    // using an abstract class for VitePluginContext didn't work
    // because the class return by the factory function is marked as abstract which is odd
    throw new Error("not implemented: please use contextFactory");
  }

  /**
   *
   * @param base
   * @param paths
   * @returns Absolute path to desired resource
   */
  resolve(base: PathNames | "root", ...paths: string[]) {
    const basePath = this.resolveBase(base);
    return path.resolve(basePath, ...paths);
  }

  async resolvePackageJson() {
    const content = await readFile(this.resolve("root", "package.json"), {
      encoding: "utf8",
    });
    const json = JSON.parse(content);
    return await ZPackageJson.parseAsync(json);
  }
}
export type { VitePluginContext };

type ContextFactoryOptions<P extends string> = {
  paths: PathDefaults<P>;
};

export function contextFactory<P extends string>(
  options: ContextFactoryOptions<P>,
): typeof VitePluginContext<P> {
  const { paths: pathDefaults } = options;
  return class Context extends VitePluginContext<P> {
    resolveBase(base: P | "root") {
      return resolveBase<P>(pathDefaults as any, this.options, base);
    }
  };
}

export type getPathMap<C> = C extends VitePluginContext<infer P> ? P : never;
export type contextOptions<C> =
  // oxlint-disable-next-line no-unused-vars
  C extends VitePluginContext<infer P> ? C["options"] : never;

export class DefaultVitePluginContext extends contextFactory({
  paths: { sourceDir: "./src" },
}) {}
