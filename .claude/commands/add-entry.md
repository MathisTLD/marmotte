# Add a new library entry point

Use this when you need to expose a new module from marmotte (not a Vite plugin).

The new entry is: `$ARGUMENTS`

## Steps

1. **Create the source file** at `src/<module>/index.ts` (or a single file at `src/<module>.ts`).

2. **Register the entry** in [vite.config.ts](../../vite.config.ts):
   ```ts
   // inside build.lib.entry:
   "<module>": "./src/<module>/index.ts",
   ```

3. **Expose the export** in [package.json](../../package.json):
   ```json
   "./<module>": {
     "types": "./dist/<module>.d.ts",
     "import": "./dist/<module>.js"
   }
   ```
   For CSS assets use `"./<module>.css": "./dist/<module>.css"`.

4. **Build** to verify types and output are correct:
   ```sh
   npm run build
   ```

## Notes

- Output format is always ESM (`"es"`), no CJS.
- Module files are preserved (`preserveModules: true`, root at `./src`), so the output path mirrors the source path.
- All dependencies should be in `devDependencies` (bundled) or `peerDependencies` (external). `nodeExternals()` automatically externalises peer/regular deps.
