import { describe, expect, test } from "@voidzero-dev/vite-plus-test";
import { DOMParser as PMDOMParser, DOMSerializer } from "prosemirror-model";
import { TextSelection } from "prosemirror-state";

import {
  calloutAttrsFromSource,
  convertCurrentBlockquoteCallout,
  foldMarkdownCallouts,
  getCalloutAttrsFromElement,
  normalizeCalloutKind,
} from "../src/callouts.ts";
import { createState } from "../src/editor.ts";
import { parse } from "../src/parser.ts";
import { schema } from "../src/schema.ts";
import { serialize } from "../src/serializer.ts";
import { commonShortcutKeymap } from "../src/shortcuts.ts";
import { pretty, setup } from "./utils.ts";

describe("callouts", () => {
  test("normalizes known callout kinds and rejects unknown markers", () => {
    expect(normalizeCalloutKind("note")).toBe("note");
    expect(normalizeCalloutKind("TIP")).toBe("tip");
    expect(normalizeCalloutKind("unknown")).toBeNull();
    expect(calloutAttrsFromSource(" danger ")).toEqual({
      alert: "danger",
      alertSource: "DANGER",
    });
    expect(calloutAttrsFromSource("")).toBeNull();
  });

  test.each([
    ["NOTE", "note"],
    ["TIP", "tip"],
    ["IMPORTANT", "important"],
    ["WARNING", "warning"],
    ["DANGER", "danger"],
    ["CAUTION", "caution"],
  ])("parses %s marker into blockquote attrs", (source, kind) => {
    const doc = parse(`> [!${source}]\n> body`);
    const bq = doc.child(0);

    expect(bq.attrs.alert).toBe(kind);
    expect(bq.attrs.alertSource).toBe(source);
    expect(bq.textContent).toBe("body");
  });

  test("serializes callout marker before blockquote content", () => {
    const doc = parse("> [!DANGER]\n> serious risk");

    expect(serialize(doc)).toBe("> [!DANGER]\n> serious risk");
  });

  test("ordinary blockquotes stay plain", () => {
    const doc = parse("> [not a callout]\n> body");
    const bq = doc.child(0);

    expect(bq.attrs.alert).toBeNull();
    expect(bq.attrs.alertSource).toBeNull();
    expect(serialize(doc)).toBe("> \\[not a callout\\]\n> body");
  });

  test("DOM serializer exposes stable callout attributes", () => {
    const fragment = DOMSerializer.fromSchema(schema).serializeFragment(
      parse("> [!TIP]\n> body").content,
    );
    const bq = fragment.firstChild as HTMLElement | null;

    expect(bq?.tagName.toLowerCase()).toBe("blockquote");
    expect(bq?.classList.contains("md-alert")).toBe(true);
    expect(bq?.classList.contains("md-alert-tip")).toBe(true);
    expect(bq?.getAttribute("data-alert")).toBe("tip");
    expect(bq?.getAttribute("data-alert-source")).toBe("TIP");
    expect(bq?.textContent).toBe("body");
  });

  test("DOM parser reads callout attributes without adding title text", () => {
    const host = document.createElement("div");
    host.innerHTML =
      '<blockquote class="md-alert md-alert-important" data-alert-source="IMPORTANT"><p>body</p></blockquote>';
    const doc = PMDOMParser.fromSchema(schema).parse(host);
    const bq = doc.child(0);

    expect(bq.attrs.alert).toBe("important");
    expect(bq.attrs.alertSource).toBe("IMPORTANT");
    expect(bq.textContent).toBe("body");
  });

  test("DOM parser accepts compatible callout class names", () => {
    const host = document.createElement("div");
    host.innerHTML = [
      '<blockquote class="markdown-alert-warning"><p>warning</p></blockquote>',
      '<blockquote class="md-alert-text-danger"><p>danger</p></blockquote>',
      '<blockquote class="plain"><p>plain</p></blockquote>',
    ].join("");
    const blocks = Array.from(host.querySelectorAll<HTMLElement>("blockquote"));

    expect(getCalloutAttrsFromElement(blocks[0]!)).toEqual({
      alert: "warning",
      alertSource: "WARNING",
    });
    expect(getCalloutAttrsFromElement(blocks[1]!)).toEqual({
      alert: "danger",
      alertSource: "DANGER",
    });
    expect(getCalloutAttrsFromElement(blocks[2]!)).toBeNull();
  });

  test("callout marker folding keeps inline content after the marker line", () => {
    const doc = parse("> [!NOTE]\n> body\n> second");
    const bq = doc.child(0);

    expect(bq.attrs.alert).toBe("note");
    expect(bq.childCount).toBe(1);
    expect(bq.textContent).toBe("body\nsecond");
    expect(serialize(doc)).toBe("> [!NOTE]\n> body\n> second");
  });

  test("callout marker folding drops only the marker line break", () => {
    const hardBreakDoc = parse("> [!NOTE]  \n> body");
    const hardBreakCallout = hardBreakDoc.child(0);

    expect(hardBreakCallout.attrs.alert).toBe("note");
    expect(hardBreakCallout.textContent).toBe("body");

    const doc = schema.nodes.doc.create(null, [
      schema.nodes.blockquote.create(null, [
        schema.nodes.paragraph.create(null, [
          schema.text("[!TIP]"),
          schema.text("\nmarked", [schema.marks.em.create()]),
        ]),
      ]),
    ]);
    const folded = foldMarkdownCallouts(doc);
    const foldedCallout = folded.child(0);

    expect(foldedCallout.attrs.alert).toBe("tip");
    expect(foldedCallout.textContent).toBe("marked");
    expect(foldedCallout.firstChild?.firstChild?.marks[0]?.type.name).toBe("em");
  });

  test("pretty output distinguishes callouts from plain blockquotes", () => {
    expect(pretty(setup("> [!WARNING]\n> body"))).toBe(
      "<callout:WARNING>body|</callout>",
    );
    expect(pretty(setup("> body"))).toBe("<bq>body|</bq>");
  });

  test("Enter converts a raw marker blockquote into a live callout", () => {
    const doc = schema.nodes.doc.create(null, [
      schema.nodes.blockquote.create(null, [
        schema.nodes.paragraph.create(null, schema.text("[!NOTE]")),
      ]),
    ]);
    const base = createState(doc);
    const state = base.apply(base.tr.setSelection(TextSelection.atEnd(doc)));
    let next = state;

    const handled = convertCurrentBlockquoteCallout(state, (tr) => {
      next = state.apply(tr);
    });

    expect(handled).toBe(true);
    expect(pretty(next)).toBe("<callout:NOTE>|</callout>");
    expect(serialize(next.doc)).toBe("> [!NOTE]\n");
    expect(parse(serialize(next.doc)).child(0).attrs.alert).toBe("note");
  });

  test("Shift-Enter also converts a raw marker blockquote into a live callout", () => {
    const doc = schema.nodes.doc.create(null, [
      schema.nodes.blockquote.create(null, [
        schema.nodes.paragraph.create(null, schema.text("[!TIP]")),
      ]),
    ]);
    const base = createState(doc);
    const state = base.apply(base.tr.setSelection(TextSelection.atEnd(doc)));
    let next = state;

    const handled = commonShortcutKeymap(schema)["Shift-Enter"]!(state, (tr) => {
      next = state.apply(tr);
    });

    expect(handled).toBe(true);
    expect(pretty(next)).toBe("<callout:TIP>|</callout>");
    expect(serialize(next.doc)).toBe("> [!TIP]\n");
    expect(parse(serialize(next.doc)).child(0).attrs.alert).toBe("tip");
  });
});
