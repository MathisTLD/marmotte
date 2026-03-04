# Add a new Vite plugin to marmotte

Follow these steps to add a new plugin named `$ARGUMENTS` to the marmotte library.

## Steps

1. **Read the existing conventions** by reviewing [CLAUDE.md](../../CLAUDE.md) and a similar plugin for reference (e.g. [src/vite/lib.ts](../../src/vite/lib.ts)).

2. **Create the plugin file** at `src/vite/<name>.ts`:
   - Export a `function MyPlugin(options: MyPluginOptions): Plugin | Plugin[]`
   - Use `DefaultVitePluginContext` from `./lib/context` if you need path resolution
   - Follow the same naming pattern: `marmotte:<name>` for the plugin `name` field

3. **Add the entry point** in [vite.config.ts](../../vite.config.ts) under the `build.lib.entry` object:

   ```ts
   "vite/<name>": "./src/vite/<name>.ts",
   ```

4. **Add the export** in [package.json](../../package.json) under `"exports"`:

   ```json
   "./vite/<name>": {
     "types": "./dist/vite/<name>.d.ts",
     "import": "./dist/vite/<name>.js"
   }
   ```

5. **Write a test** in `tests/vite-<name>.test.ts` using Vitest.

6. **Build and verify**:
   ```sh
   npm run build
   npm run test
   ```

## Reference

- Path resolution: `src/vite/lib/context.ts`
- Plugin composition pattern: `src/vite/lib.ts` (`Lib` bundles multiple plugins)
- Auto-managed file writing: `src/utils/codegen/index.ts`
