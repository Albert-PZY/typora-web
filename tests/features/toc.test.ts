import { describe, expect, test } from "@voidzero-dev/vite-plus-test";
import { DOMSerializer } from "prosemirror-model";
import { EditorView } from "prosemirror-view";

import { runFeatureCases } from "../utils.ts";
import { createState } from "../../src/editor.ts";
import { parse } from "../../src/parser.ts";
import { schema } from "../../src/schema.ts";
import { tocSpecs } from "../../specs/features/toc.specs.ts";

runFeatureCases(tocSpecs);

function mountToc(markdown: string): {
  view: EditorView;
  mount: HTMLElement;
  cleanup: () => void;
} {
  const mount = document.createElement("div");
  document.body.appendChild(mount);
  const view = new EditorView(mount, { state: createState(parse(markdown)) });
  return {
    view,
    mount,
    cleanup: () => {
      view.destroy();
      mount.remove();
    },
  };
}

describe("toc node view", () => {
  test("renders an empty state when no headings exist", () => {
    const { mount, cleanup } = mountToc("[toc]\n\nbody");

    try {
      expect(mount.querySelector(".toc-empty")?.textContent).toBe("(no headings yet)");
    } finally {
      cleanup();
    }
  });

  test("renders heading list items, handles empty headings, and jumps on click", () => {
    const { view, mount, cleanup } = mountToc("# Title\n\n## \n\n[toc]\n\nbody");
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    const scrollCalls: unknown[] = [];
    HTMLElement.prototype.scrollIntoView = function scrollIntoView(options?: unknown) {
      scrollCalls.push({ element: this, options });
    };

    try {
      const items = Array.from(mount.querySelectorAll<HTMLElement>(".toc-item"));
      expect(items.map((item) => item.textContent)).toEqual(["Title", "(empty heading)"]);
      expect(items[0]?.classList.contains("toc-h1")).toBe(true);
      expect(items[1]?.classList.contains("toc-h2")).toBe(true);

      const down = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
      items[0]!.dispatchEvent(down);
      expect(down.defaultPrevented).toBe(true);

      items[0]!.click();

      expect(view.state.selection.$from.parent.type.name).toBe("heading");
      expect(view.state.selection.from).toBe(1);
      expect(scrollCalls).toHaveLength(1);
      expect(scrollCalls[0]).toMatchObject({
        options: { block: "start", behavior: "smooth" },
      });
    } finally {
      HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
      cleanup();
    }
  });

  test("skips DOM rebuilds when headings are unchanged", () => {
    const { view, mount, cleanup } = mountToc("# Title\n\n[toc]\n\nbody");

    try {
      const toc = mount.querySelector<HTMLElement>(".toc");
      const originalList = toc?.querySelector(".toc-list");
      expect(originalList).not.toBeNull();

      view.dispatch(view.state.tr.insertText("x", view.state.doc.content.size - 1));

      expect(toc?.querySelector(".toc-list")).toBe(originalList);
    } finally {
      cleanup();
    }
  });

  test("DOM serializer keeps toc as a div.toc atom", () => {
    const doc = parse("[toc]");
    const fragment = DOMSerializer.fromSchema(schema).serializeFragment(doc.content);
    const element = fragment.firstChild as HTMLElement | null;

    expect(element?.tagName.toLowerCase()).toBe("div");
    expect(element?.className).toBe("toc");
  });
});
