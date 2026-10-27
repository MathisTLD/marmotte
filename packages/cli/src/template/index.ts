import { base, idOf } from "./base.js";
import { blockNodeLibraryBuild, blockNodeLibraryExample } from "./blocks/node-library.js";
import { blockPackageJson } from "./blocks/package-json.js";
import { featureBlocks } from "./blocks/features.js";
import { blockUIAppBuild, blockUIAppStarter } from "./blocks/ui-app.js";
import { blockUILibraryBuild, blockUILibraryExample } from "./blocks/ui-library.js";
import { registry } from "./registry.js";

// Features (lint, format, ...) are in no preset: `marmotte create --features` and
// `marmotte setup --features` add them with `--add-<feature>`.
const presetNodeLibrary = base.createPreset({
  about: { name: "Node library", description: "Node library" },
  blocks: [blockPackageJson, blockNodeLibraryBuild, blockNodeLibraryExample],
});

const presetUILibrary = base.createPreset({
  about: { name: "UI library", description: "Vue/Vuetify UI library" },
  blocks: [blockPackageJson, blockUILibraryBuild, blockUILibraryExample],
});

const presetUIApp = base.createPreset({
  about: { name: "UI app", description: "Vue/Vuetify UI app" },
  blocks: [blockPackageJson, blockUIAppBuild, blockUIAppStarter],
});

/** What `marmotte setup` does on any existing project: package.json handling and nothing else. */
const presetBare = base.createPreset({
  about: { name: "Bare" },
  blocks: [blockPackageJson],
});

export const template = base.createStratumTemplate({
  about: { name: "marmotte" },
  presets: [presetNodeLibrary, presetUILibrary, presetUIApp, presetBare],
  // available to every preset through `--add-*`, in none by default
  blocks: featureBlocks,
});

for (const preset of template.presets) {
  registry.presets[idOf(preset.about)!] = preset.blocks;
}
registry.addable = template.blocks;

/** The projects `marmotte create` can scaffold (the `bare` preset is for projects that already exist) */
export const templates = template.presets
  .filter((preset) => preset !== presetBare)
  .map((preset) => ({ id: idOf(preset.about)!, label: preset.about.description! }));

/** The optional tooling `marmotte create` and `marmotte setup` can add */
export const features = featureBlocks.map((block) => ({
  id: idOf(block.about)!,
  label: `${block.about!.name} (${block.about!.description})`,
}));
