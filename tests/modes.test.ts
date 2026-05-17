import { describe, expect, test } from "@voidzero-dev/vite-plus-test";

import { createEditor } from "../src/lib.ts";

describe("editor modes", () => {
  test("focus mode toggles through the controller", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const editor = createEditor(host, { initialContent: "one\n\ntwo" });
    try {
      expect(editor.isFocusMode()).toBe(false);
      editor.setFocusMode(true);
      expect(editor.isFocusMode()).toBe(true);
      expect(host.querySelector(".typora-web-wrap")?.classList.contains("tw-focus-mode")).toBe(true);
      editor.toggleFocusMode();
      expect(editor.isFocusMode()).toBe(false);
    } finally {
      editor.destroy();
      host.remove();
    }
  });

  test("focus mode toggles with F8 and marks active and muted blocks", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const editor = createEditor(host, { initialContent: "one\n\ntwo" });
    try {
      editor.view.dom.dispatchEvent(new KeyboardEvent("keydown", { key: "F8", bubbles: true }));

      expect(editor.isFocusMode()).toBe(true);
      expect(host.querySelector(".tw-focus-active")).not.toBeNull();
      expect(host.querySelector(".tw-focus-muted")).not.toBeNull();
    } finally {
      editor.destroy();
      host.remove();
    }
  });

  test("typewriter mode toggles through the controller", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const editor = createEditor(host, { initialContent: "one\n\ntwo" });
    try {
      expect(editor.isTypewriterMode()).toBe(false);
      editor.setTypewriterMode(true);
      expect(editor.isTypewriterMode()).toBe(true);
      expect(host.querySelector(".typora-web-wrap")?.classList.contains("tw-typewriter-mode")).toBe(true);
      editor.toggleTypewriterMode();
      expect(editor.isTypewriterMode()).toBe(false);
    } finally {
      editor.destroy();
      host.remove();
    }
  });

  test("typewriter mode toggles with F9 and requests cursor centering", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const editor = createEditor(host, { initialContent: "one" });
    const oldScrollTo = window.scrollTo;
    const oldCoordsAtPos = editor.view.coordsAtPos;
    let scrollCalls = 0;
    try {
      window.scrollTo = (() => {
        scrollCalls++;
      }) as typeof window.scrollTo;
      editor.view.coordsAtPos = (() => ({
        top: 480,
        bottom: 500,
        left: 0,
        right: 0,
      })) as typeof editor.view.coordsAtPos;

      editor.view.dom.dispatchEvent(new KeyboardEvent("keydown", { key: "F9", bubbles: true }));

      expect(editor.isTypewriterMode()).toBe(true);
      expect(scrollCalls).toBe(1);
    } finally {
      editor.view.coordsAtPos = oldCoordsAtPos;
      window.scrollTo = oldScrollTo;
      editor.destroy();
      host.remove();
    }
  });
});
