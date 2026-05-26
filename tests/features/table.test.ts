import { describe, expect, test } from "@voidzero-dev/vite-plus-test";
import { TextSelection } from "prosemirror-state";

import { runFeatureCases } from "../utils.ts";
import { createEditor, type Editor } from "../../src/lib.ts";
import { tableSpecs } from "../../specs/features/table.specs.ts";

runFeatureCases(tableSpecs);

function createHost(): HTMLElement {
  const host = document.createElement("div");
  document.body.appendChild(host);
  return host;
}

function setSelectionInTableCell(
  editor: Editor,
  options: { header?: boolean; row?: number; col?: number } = {},
): void {
  const { header = false, row = 0, col = 0 } = options;
  let seenRow = -1;
  let target: number | null = null;

  editor.view.state.doc.descendants((node, pos) => {
    if (node.type.name !== "table_row") return true;
    const firstCell = node.firstChild;
    if (!firstCell || firstCell.attrs.header !== header) return false;
    seenRow++;
    if (seenRow !== row) return false;
    const cell = node.child(col);
    if (!cell) return false;
    let cellPos = pos + 1;
    for (let i = 0; i < col; i++) cellPos += node.child(i).nodeSize;
    target = cellPos + 1;
    return false;
  });

  if (target == null) throw new Error("table cell not found");
  editor.view.dispatch(
    editor.view.state.tr.setSelection(
      TextSelection.create(editor.view.state.doc, target),
    ),
  );
}

function focusTable(editor: Editor): void {
  editor.focus();
  editor.view.dom.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
  editor.view.dispatch(editor.view.state.tr.setMeta("table-test-refresh", true));
}

describe("table toolbar", () => {
  test("mounts lazily when the focused selection is inside a table", () => {
    const host = createHost();
    const editor = createEditor(host, {
      initialContent: "| A | B |\n| --- | --- |\n| a | b |",
    });

    try {
      expect(document.body.querySelector(".table-toolbar")).toBeNull();

      setSelectionInTableCell(editor);
      focusTable(editor);

      expect(document.body.querySelector(".table-toolbar")).not.toBeNull();
      expect(document.body.querySelector(".table-resize-popup")).not.toBeNull();
    } finally {
      editor.destroy();
      host.remove();
      document.body.querySelector(".table-toolbar")?.remove();
      document.body.querySelector(".table-resize-popup")?.remove();
    }
  });

  test("aligns the active column through the toolbar and serializes alignment", () => {
    const host = createHost();
    const editor = createEditor(host, {
      initialContent: "| A | B |\n| --- | --- |\n| a | b |",
    });

    try {
      setSelectionInTableCell(editor, { col: 1 });
      focusTable(editor);

      document.body
        .querySelector<HTMLElement>(".table-toolbar [data-align='right']")
        ?.click();

      expect(editor.getMarkdown()).toBe(
        "| A   | B   |\n| --- | --: |\n| a   | b   |",
      );
    } finally {
      editor.destroy();
      host.remove();
      document.body.querySelector(".table-toolbar")?.remove();
      document.body.querySelector(".table-resize-popup")?.remove();
    }
  });

  test("deletes the whole table through the toolbar without leaving stale toolbar DOM", () => {
    const host = createHost();
    const editor = createEditor(host, {
      initialContent: "| A | B |\n| --- | --- |\n| a | b |",
    });

    try {
      setSelectionInTableCell(editor);
      focusTable(editor);

      document.body.querySelector<HTMLElement>(".table-tb-trash")?.click();

      expect(editor.getMarkdown()).toBe("");
      expect(document.body.querySelector(".table-toolbar")).toBeNull();
      expect(document.body.querySelector(".table-resize-popup")).toBeNull();
    } finally {
      editor.destroy();
      host.remove();
      document.body.querySelector(".table-toolbar")?.remove();
      document.body.querySelector(".table-resize-popup")?.remove();
    }
  });

  test("resize popup commits dimensions from numeric inputs and preserves column alignment", () => {
    const host = createHost();
    const editor = createEditor(host, {
      initialContent: "| A | B |\n| :--- | ---: |\n| a | b |",
    });

    try {
      setSelectionInTableCell(editor);
      focusTable(editor);

      document.body.querySelector<HTMLElement>(".table-toolbar button[title='Resize']")?.click();
      const popup = document.body.querySelector<HTMLElement>(".table-resize-popup");
      const inputs = popup?.querySelectorAll<HTMLInputElement>("input");
      expect(popup?.style.display).toBe("block");
      expect(inputs?.length).toBe(2);

      inputs![0]!.value = "3";
      inputs![1]!.value = "3";
      inputs![1]!.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );

      expect(editor.getMarkdown()).toBe(
        "| A   | B   |     |\n| :-- | --: | --- |\n| a   | b   |     |\n|     |     |     |",
      );
      expect(document.body.querySelector<HTMLElement>(".table-resize-popup")?.style.display)
        .toBe("none");
    } finally {
      editor.destroy();
      host.remove();
      document.body.querySelector(".table-toolbar")?.remove();
      document.body.querySelector(".table-resize-popup")?.remove();
    }
  });
});
