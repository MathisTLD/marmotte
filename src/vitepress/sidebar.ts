// re-export from vitepress-sidebar so that users don't have to install the package themselves

import type { Plugin } from "vite";
import type { VitePressSidebarOptions } from "vitepress-sidebar/types";
import { generateSidebar } from "vitepress-sidebar";
import { getVitePressConfig } from "./utils";
import { relative } from "path";

export * from "vitepress-sidebar";

type SidebarOptions = VitePressSidebarOptions & {
  /**
   * Don't inject defaults, only other passed options will be passed to {@link generateSidebar}
   *
   * @default false
   * */
  noDefaults?: boolean;
};

export default function SidebarPlugin(options: SidebarOptions | SidebarOptions[] = {}) {
  return {
    name: "marmotte:vitepress-sidebar",
    enforce: "post",
    // TODO: watch and rebuild the sidebar on changes
    config(cfg) {
      function resolveSidebarOptions(options: SidebarOptions): VitePressSidebarOptions {
        const { noDefaults = false, ...userOptions } = options;
        if (noDefaults) return userOptions;
        else {
          const { root } = cfg;
          if (!root) throw new TypeError("Unable to resolve vitepress root");
          return {
            // according to https://vitepress-sidebar.cdget.com/guide/options#documentrootpath this is relative to proejct root
            // FIXME: cwd seems a good pick but it's not totally robust
            documentRootPath: relative(process.cwd(), root),
            collapsed: true,
            useFolderLinkFromIndexFile: true,
            useTitleFromFrontmatter: true,
            useTitleFromFileHeading: true,
            useFolderTitleFromIndexFile: true,
            ...userOptions,
          };
        }
      }
      const sidebarOptions = Array.isArray(options)
        ? options.map(resolveSidebarOptions)
        : resolveSidebarOptions(options);
      const vitepressConfig = getVitePressConfig(cfg);
      console.log("🏗️ generating sidebar...");
      vitepressConfig.userConfig.themeConfig.sidebar = generateSidebar(sidebarOptions);
    },
  } satisfies Plugin;
}
