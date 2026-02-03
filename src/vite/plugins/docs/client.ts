import type { DefaultTheme } from "vitepress";

// FIXME: we should be able to import that from typedoc instead of redefining type here
type NavigationElement =
  | {
      title: string;
      children: NavigationElement[];
    }
  | {
      title: string;
      kind: number;
      path: string;
      isDeprecated: boolean;
    };

export function sidebarItemFromTypeDocNavigationJSON(
  navigation: NavigationElement,
): DefaultTheme.SidebarItem {
  const { title } = navigation;
  const item: DefaultTheme.SidebarItem = {
    text: title,
    collapsed: true,
  };
  if ("children" in navigation) {
    item.items = navigation.children.map(sidebarItemFromTypeDocNavigationJSON);
  } else {
    item.link = `/reference/api/${navigation.path.replace(/\.md$/, "")}`;
  }
  return item;
}
