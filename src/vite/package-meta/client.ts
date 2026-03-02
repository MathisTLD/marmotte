export type PackageMeta = {
  name: string;
  version: string;
};

export function resolvePackageMeta(): PackageMeta {
  return {
    name: import.meta.env.VITE_PACKAGE_NAME,
    version: import.meta.env.VITE_PACKAGE_VERSION,
  };
}
