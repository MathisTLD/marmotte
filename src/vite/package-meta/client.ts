/** Name and version of the package, injected at build time by {@link PackageMeta}. */
export type PackageMeta = {
  name: string;
  version: string;
};

/**
 * Returns the package name and version injected by the {@link PackageMeta} Vite plugin
 * via `import.meta.env.VITE_PACKAGE_NAME` and `import.meta.env.VITE_PACKAGE_VERSION`.
 *
 * Only call this at runtime (inside a Vite-built bundle), not from Node.js config files.
 */
export function resolvePackageMeta(): PackageMeta {
  return {
    name: import.meta.env.VITE_PACKAGE_NAME,
    version: import.meta.env.VITE_PACKAGE_VERSION,
  };
}
