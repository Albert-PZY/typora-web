import { describe, expect, test } from "@voidzero-dev/vite-plus-test";

import { mountNav } from "../website/components/nav.ts";

describe("website logo", () => {
  test("uses the project favicon asset as the visible brand logo", () => {
    const root = document.createElement("div");
    const cleanup = mountNav(root, "/");

    try {
      const logo = root.querySelector<HTMLImageElement>(".brand img");

      expect(logo?.getAttribute("src")).toBe("/favicon.svg");
      expect(root.querySelector<HTMLAnchorElement>(".brand")?.getAttribute("href")).toBe("#/");
    } finally {
      cleanup();
      root.remove();
    }
  });
});
