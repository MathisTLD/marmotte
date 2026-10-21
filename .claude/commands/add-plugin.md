# Add a new Vite plugin

Follow these steps to add a new plugin named `$ARGUMENTS` to `@mrmt/vite`.

## Steps

1. **Read the existing conventions** by reviewing [CLAUDE.md](../CLAUDE.md) and a similar plugin for reference (e.g. [lib.ts](../../packages/vite/src/lib.ts)).

2. **Create the plugin file** at `packages/vite/src/<name>.ts`:
   - Export a `function MyPlugin(options: MyPluginOptions): Plugin | Plugin[]`
   - Use `DefaultVitePluginContext` from `./lib/context` if you need path resolution
   - Follow the naming pattern `marmotte:<name>` for the plugin `name` field

3. **Add the entry point** in `packages/vite/vite.config.ts` under `pack.entry`:

   ```ts
   "<name>": "src/<name>.ts",
   ```

4. **Add the export** in `packages/vite/package.json` under `"exports"`:

   ```json
   "./<name>": {
     "types": "./dist/<name>.d.ts",
     "import": "./dist/<name>.js"
   }
   ```

5. **Write a test** next to the source, `packages/vite/src/<name>.test.ts`, using Vitest.

6. **Build and verify**:
   ```sh
   vp run @mrmt/vite#build
   vp run @mrmt/vite#test
   ```

Plugins that need Vue/Vuetify belong in `@mrmt/vite-ui` instead.

## Reference

- Path resolution: `packages/vite/src/lib/context.ts`
- Plugin composition pattern: `packages/vite/src/lib.ts` (`Lib` bundles multiple plugins)
- Auto-managed file writing: `packages/utils/src/codegen/index.ts`
