import { defineConfig } from "vitepress";
import { workspaceDocs } from "@mrmt/vitepress-plugin-sidebar/workspace";
import pkg from "../../packages/cli/package.json";

export default async () => {
  const workspace = await workspaceDocs({ order: ["vite", "vite-ui", "vitest", "cli"] });
  return defineConfig({
    title: "marmotte",
    ...workspace,
    themeConfig: {
      ...workspace.themeConfig,
      // enable search by default
      search: {
        provider: "local",
      },
      nav: [
        ...workspace.themeConfig.nav,
        { text: `v${pkg.version}`, link: "https://www.npmjs.com/package/marmotte" },
      ],
      socialLinks: [{ icon: "github", link: "https://github.com/MathisTLD/marmotte" }],
      editLink: {
        // pages come from `docs/` and from every `packages/<pkg>/docs/`
        pattern: ({ filePath }) =>
          `https://github.com/MathisTLD/marmotte/edit/main/${filePath.startsWith("docs/") || filePath.startsWith("packages/") ? filePath : `docs/${filePath}`}`,
      },
    },
  });
};
