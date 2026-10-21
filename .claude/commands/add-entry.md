# Add a new library entry point

Use this when you need to expose a new module from an existing package (not a Vite plugin).

The new entry is: `$ARGUMENTS` (give it as `<package>/<module>`, e.g. `utils/foo`)

## Steps

1. **Create the source file** at `packages/<package>/src/<module>.ts` (or `<module>/index.ts`).

2. **Register the entry** in `packages/<package>/vite.config.ts`, inside the `pack.entry` object:

   ```ts
   "<module>": "src/<module>.ts",
   ```

3. **Expose the export** in `packages/<package>/package.json`:

   ```json
   "./<module>": {
     "types": "./dist/<module>.d.ts",
     "import": "./dist/<module>.js"
   }
   ```

   For CSS assets add a `copy` rule to the `pack` config and use `"./<module>.css": "./dist/<module>.css"`.

4. **Build** to verify types and output are correct:
   ```sh
   vp run <package-name>#build   # e.g. @mrmt/utils#build
   ```

## Notes

- Output is ESM only and bundled per entry (`vp pack`): the output file is named after the entry key; shared code goes into chunks and unused code from inlined private packages is tree-shaken.
- `dependencies` and `peerDependencies` are externalised automatically; everything else is bundled.
- The shared pack baseline lives in `tooling/pack.ts`.
