import { z } from "zod";
import { base, idOf, type Options } from "../base.js";
import { registry } from "../registry.js";

const record = z.record(z.string(), z.string());

/**
 * Owns `package.json`. Other blocks add scripts, devDependencies and top-level properties as
 * addons; in transition mode the existing file is read back so what the user added survives.
 */
export const blockPackageJson = base.createBlock({
  about: { name: "package.json" },
  addons: {
    scripts: record.optional(),
    devDependencies: record.optional(),
    /** top-level fields (`main`, `lint-staged`, ...) */
    properties: z.record(z.string(), z.unknown()).optional(),
    /** set when reading an existing file: its fields are kept as they are, no defaults are added */
    existing: z.boolean().optional(),
  },
  intake({ files, options }) {
    const entry = files["package.json"];
    if (!Array.isArray(entry)) return undefined;
    const { scripts, devDependencies, ...properties } = JSON.parse(entry[0]);
    // Stratum aborts when an existing value differs from the one a block adds, so values the
    // template manages are left out: the template wins, as `marmotte setup` always did.
    const managed = managedByTemplate(options);
    return {
      scripts: omit(scripts, managed.scripts),
      devDependencies: omit(devDependencies, managed.devDependencies),
      properties: omit(properties, managed.properties),
      existing: true,
    };
  },
  produce({ options, addons }) {
    return {
      files: {
        "package.json":
          JSON.stringify(
            {
              ...(!addons.existing && {
                name: options.name,
                version: "0.1.0",
                description: "",
                license: "ISC",
                type: "module",
              }),
              ...addons.properties,
              scripts: addons.scripts,
              devDependencies: addons.devDependencies,
            },
            null,
            2,
          ) + "\n",
      },
    };
  },
});

function omit<T>(source: Record<string, T> | undefined, keys: Set<string>) {
  return source && Object.fromEntries(Object.entries(source).filter(([key]) => !keys.has(key)));
}

/**
 * What the selected blocks add to package.json, found by running them: those of the preset
 * (minus the `--exclude-*`d ones) and the `--add-*`ed ones.
 */
function managedByTemplate(options: Options) {
  const managed = {
    scripts: new Set<string>(),
    devDependencies: new Set<string>(),
    properties: new Set<string>(),
  };
  // `preset` and the flags are added to the options by Stratum
  const flags = options as Record<string, unknown>;
  const selected = new Set([
    ...(registry.presets[String(flags.preset)] ?? []).filter(
      (block) => !flags[`exclude-${idOf(block.about)}`],
    ),
    ...registry.addable.filter((block) => flags[`add-${idOf(block.about)}`]),
  ]);
  for (const block of selected) {
    if (block === blockPackageJson) continue;
    for (const created of block.produce({ options, addons: {} } as never).addons ?? []) {
      if (created.block !== blockPackageJson) continue;
      const { scripts, devDependencies, properties } = created.addons as Record<string, object>;
      for (const key of Object.keys(scripts ?? {})) managed.scripts.add(key);
      for (const key of Object.keys(devDependencies ?? {})) managed.devDependencies.add(key);
      for (const key of Object.keys(properties ?? {})) managed.properties.add(key);
    }
  }
  return managed;
}
