import { describe, expect, test } from "@voidzero-dev/vite-plus-test";
import { DOMParser as PMDOMParser, DOMSerializer } from "prosemirror-model";
import { EditorState, TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

import { defaultPlugins } from "../src/editor.ts";
import { createEditor } from "../src/lib.ts";
import { parse } from "../src/parser.ts";
import { schema } from "../src/schema.ts";
import { mdConfig, serializeWith } from "../src/serializer.ts";
import { feedEvent } from "../specs/events.ts";
import { fakeView } from "../specs/sim.ts";

function mountView(markdown: string): {
  host: HTMLElement;
  view: EditorView;
  cleanup: () => void;
} {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const view = new EditorView(host, {
    state: EditorState.create({
      schema,
      doc: parse(markdown),
      plugins: defaultPlugins({ cursorWidget: false }),
    }),
  });
  return {
    host,
    view,
    cleanup: () => {
      view.destroy();
      host.remove();
    },
  };
}

function clickEvent(target: Element, ctrlKey: boolean): MouseEvent {
  return {
    target,
    ctrlKey,
    metaKey: false,
    preventDefault() {},
  } as unknown as MouseEvent;
}

describe("core editor behavior", () => {
  test("defaultPlugins can omit the replay cursor widget for live editors", () => {
    const withCursor = defaultPlugins();
    const withoutCursor = defaultPlugins({ cursorWidget: false });

    expect(withCursor.length).toBe(withoutCursor.length + 1);
    expect(withCursor.at(-1)).not.toBe(withoutCursor.at(-1));
  });

  test("modified clicks open rendered links while plain clicks stay editable", () => {
    const { host, view, cleanup } = mountView("[site](https://example.com)");
    const originalOpen = window.open;
    const calls: unknown[] = [];
    window.open = ((...args: unknown[]) => {
      calls.push(args);
      return null;
    }) as typeof window.open;

    try {
      const link = host.querySelector<HTMLAnchorElement>("a");
      expect(link).not.toBeNull();

      view.someProp("handleClick", (handler) =>
        handler(view, 1, clickEvent(link!, false)),
      );
      expect(calls).toEqual([]);

      view.someProp("handleClick", (handler) =>
        handler(view, 1, clickEvent(link!, true)),
      );

      expect(calls).toEqual([["https://example.com", "_blank", "noopener,noreferrer"]]);
    } finally {
      window.open = originalOpen;
      cleanup();
    }
  });

  test("space after a stored mark is inserted without inheriting the mark", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const doc = schema.nodes.doc.create(null, [schema.nodes.paragraph.create()]);
    const state = EditorState.create({
      schema,
      doc,
      plugins: defaultPlugins({ cursorWidget: false }),
    }).apply(
      EditorState.create({ schema, doc }).tr
        .setStoredMarks([schema.marks.strong.create()]),
    );
    const view = new EditorView(host, { state });

    try {
      const handled = view.someProp("handleTextInput", (handler) =>
        handler(
          view,
          view.state.selection.from,
          view.state.selection.to,
          " ",
          () => view.state.tr.insertText(" "),
        ),
      );

      expect(handled).toBe(true);
      expect(view.state.doc.textContent).toBe(" ");
      expect(view.state.doc.firstChild?.firstChild?.marks).toEqual([]);
      expect(view.state.storedMarks).toBeNull();
    } finally {
      view.destroy();
      host.remove();
    }
  });

  test("serializeWith supports dynamic code fences and leftover position markers", () => {
    const doc = parse("use `` ` `` as fence");
    const config = { ...mdConfig, codeMarkAsBacktickFence: true };

    const serialized = serializeWith(doc, config, [
      { pos: 1, char: "<" },
      { pos: 999, char: ">" },
    ]);

    expect(serialized).toContain("<use");
    expect(serialized).toContain("``` ` ```");
    expect(serialized.endsWith(">")).toBe(true);
  });

  test("core DOM schema preserves code language and ordered-list starts", () => {
    const host = document.createElement("div");
    host.innerHTML = [
      '<pre data-lang="ts"><code>const x = 1;</code></pre>',
      '<ol start="3"><li><p>third</p></li></ol>',
    ].join("");

    const doc = PMDOMParser.fromSchema(schema).parse(host);
    expect(doc.child(0).attrs.lang).toBe("ts");
    expect(doc.child(1).attrs.start).toBe(3);

    const fragment = DOMSerializer.fromSchema(schema).serializeFragment(doc.content);
    expect((fragment.childNodes[0] as HTMLElement).getAttribute("data-lang")).toBe("ts");
    expect((fragment.childNodes[1] as HTMLElement).getAttribute("start")).toBe("3");
  });

  test("file input widgets prevent editor focus loss and emit picked files", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const editor = createEditor(host, { initialContent: "![alt]()" });
    const originalClick = HTMLInputElement.prototype.click;
    const originalCreateObjectURL = URL.createObjectURL;
    const picked: unknown[] = [];
    const file = new File(["fake"], "fake.png", { type: "image/png" });
    URL.createObjectURL = (() => "blob:fake") as typeof URL.createObjectURL;
    HTMLInputElement.prototype.click = function click() {
      Object.defineProperty(this, "files", {
        configurable: true,
        value: [file],
      });
      this.dispatchEvent(new Event("change"));
    };

    try {
      const trigger = host.querySelector<HTMLElement>(".file-input");
      expect(trigger).not.toBeNull();
      trigger!.addEventListener("file-input-pick", (event) => {
        picked.push((event as CustomEvent).detail.files);
      });

      const down = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
      trigger!.dispatchEvent(down);
      expect(down.defaultPrevented).toBe(true);

      trigger!.click();
      expect(picked).toEqual([[file]]);
    } finally {
      HTMLInputElement.prototype.click = originalClick;
      URL.createObjectURL = originalCreateObjectURL;
      editor.destroy();
      host.remove();
    }
  });

  test("event DSL selection fallbacks cover textblock edges and ranges", () => {
    const single = EditorState.create({
      schema,
      doc: parse("abcd"),
      plugins: defaultPlugins({ cursorWidget: false }),
    });
    const view = fakeView(single);

    expect(view.hasFocus()).toBe(true);
    expect(view.endOfTextblock("up")).toBe(false);

    feedEvent(view, "<End>");
    expect(view.state.selection.$from.parentOffset).toBe(4);
    feedEvent(view, "<Backspace>");
    expect(view.state.doc.textContent).toBe("abc");

    feedEvent(view, "<Home>");
    feedEvent(view, "<Delete>");
    expect(view.state.doc.textContent).toBe("bc");

    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 1, 3)));
    feedEvent(view, "<Backspace>");
    expect(view.state.doc.textContent).toBe("");

    feedEvent(view, "XY");
    expect(view.state.doc.textContent).toBe("XY");

    const multi = fakeView(EditorState.create({
      schema,
      doc: parse("top\n\nbottom"),
      plugins: defaultPlugins({ cursorWidget: false }),
    }));
    feedEvent(multi, "<ArrowDown>");
    expect(multi.state.selection.$from.parent.textContent).toBe("bottom");
    feedEvent(multi, "<ArrowUp>");
    expect(multi.state.selection.$from.parent.textContent).toBe("top");
  });

  test("feature keymaps handle empty heading and math-block backspace edges", () => {
    const headingDoc = schema.nodes.doc.create(null, [
      schema.nodes.heading.create({ level: 1 }),
    ]);
    const headingState = EditorState.create({
      schema,
      doc: headingDoc,
      plugins: defaultPlugins({ cursorWidget: false }),
    });
    const headingView = fakeView(
      headingState.apply(headingState.tr.setSelection(TextSelection.create(headingDoc, 1))),
    );

    feedEvent(headingView, "<Backspace>");
    expect(headingView.state.doc.child(0).type.name).toBe("paragraph");

    const mathDoc = schema.nodes.doc.create(null, [schema.nodes.math_block.create()]);
    const mathState = EditorState.create({
      schema,
      doc: mathDoc,
      plugins: defaultPlugins({ cursorWidget: false }),
    });
    const mathView = fakeView(
      mathState.apply(mathState.tr.setSelection(TextSelection.create(mathDoc, 1))),
    );

    feedEvent(mathView, "<Backspace>");
    expect(mathView.state.doc.child(0).type.name).toBe("paragraph");
  });
});
