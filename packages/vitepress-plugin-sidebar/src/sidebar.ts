// re-export from vitepress-sidebar so that users don't have to install the package themselves

import type { Plugin } from "vite";
import type { VitePressSidebarOptions } from "vitepress-sidebar/types";
import { generateSidebar } from "vitepress-sidebar";
import type { SiteConfig } from "vitepress";
import { getVitePressConfig } from "./utils";
import { relative } from "path";
import { withDefaults, type WithNoDefaults } from "@mrmt/utils/merge";
import { restartOnPageChanges, type RestartOptions } from "./watch";

export * from "vitepress-sidebar";

type SidebarOptions = WithNoDefaults<VitePressSidebarOptions>;

/**
 * Generates the VitePress sidebar from the docs directory tree.
 * In dev, VitePress restarts (debounced) when pages are added or removed or when an edit changes
 * a title or order, so the sidebar stays up to date; pass `restart: false` to disable.
 */
export default function SidebarPlugin(
  options: SidebarOptions | SidebarOptions[] = {},
  restart: boolean | RestartOptions = true,
) {
  let resolvedOptions: VitePressSidebarOptions | VitePressSidebarOptions[];
  let vitepressConfig: SiteConfig;

  function buildSidebar() {
    console.log("🏗️ generating sidebar...");
    vitepressConfig.userConfig.themeConfig.sidebar = generateSidebar(resolvedOptions);
  }

  const sidebarPlugin = {
    name: "marmotte:vitepress-sidebar",
    enforce: "post",
    config(cfg) {
      function resolveSidebarOptions(opts: SidebarOptions): VitePressSidebarOptions {
        const { root } = cfg;
        if (!root) throw new TypeError("Unable to resolve vitepress root");
        return withDefaults<VitePressSidebarOptions>(
          {
            // vitepress-sidebar joins documentRootPath with process.cwd() internally,
            // so this must be relative to CWD (= project root when running vitepress normally)
            documentRootPath: relative(process.cwd(), root),
            collapsed: true,
            useFolderLinkFromIndexFile: true,
            useTitleFromFrontmatter: true,
            useTitleFromFileHeading: true,
            useFolderTitleFromIndexFile: true,
          },
          opts,
        );
      }
      resolvedOptions = Array.isArray(options)
        ? options.map(resolveSidebarOptions)
        : resolveSidebarOptions(options);
      vitepressConfig = getVitePressConfig(cfg);
      buildSidebar();
    },
  } satisfies Plugin;

  return restart === false
    ? sidebarPlugin
    : [
        sidebarPlugin,
        restartOnPageChanges((server) => [server.config.root], restart === true ? {} : restart),
      ];
}
