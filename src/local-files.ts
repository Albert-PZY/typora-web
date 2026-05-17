export type FileResult =
  | { status: "opened"; name: string }
  | { status: "saved"; name: string }
  | { status: "downloaded"; name: string }
  | { status: "cancelled" }
  | { status: "unsupported" }
  | { status: "error"; message: string };

export async function pickMarkdownFile(): Promise<
  | { status: "picked"; handle: FileSystemFileHandle | null; file: File }
  | { status: "cancelled" }
  | { status: "unsupported" }
  | { status: "error"; message: string }
> {
  if (!window.showOpenFilePicker) return pickMarkdownFileWithInput();
  try {
    const handles = await window.showOpenFilePicker({
      multiple: false,
      types: [
        {
          description: "Markdown",
          accept: { "text/markdown": [".md", ".markdown", ".mdown"] },
        },
      ],
    });
    const handle = handles[0];
    if (!handle) return { status: "cancelled" };
    return { status: "picked", handle, file: await handle.getFile() };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { status: "cancelled" };
    }
    return { status: "error", message: error instanceof Error ? error.message : String(error) };
  }
}

function pickMarkdownFileWithInput(): Promise<
  | { status: "picked"; handle: null; file: File }
  | { status: "cancelled" }
  | { status: "unsupported" }
  | { status: "error"; message: string }
> {
  if (typeof document === "undefined") return Promise.resolve({ status: "unsupported" });
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".md,.markdown,.mdown,text/markdown,text/plain";
    input.style.display = "none";
    const cleanup = (): void => {
      input.remove();
    };
    input.addEventListener("change", () => {
      const file = input.files?.[0] ?? null;
      cleanup();
      resolve(file ? { status: "picked", handle: null, file } : { status: "cancelled" });
    }, { once: true });
    document.body.appendChild(input);
    try {
      input.click();
    } catch (error) {
      cleanup();
      resolve({ status: "error", message: error instanceof Error ? error.message : String(error) });
    }
  });
}

export async function writeMarkdownFile(
  handle: FileSystemFileHandle,
  markdown: string,
): Promise<FileResult> {
  try {
    const writable = await handle.createWritable();
    await writable.write(markdown);
    await writable.close();
    return { status: "saved", name: handle.name };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : String(error) };
  }
}

export async function saveMarkdownFileAs(markdown: string): Promise<FileResult> {
  if (!window.showSaveFilePicker) return downloadMarkdown(markdown, "untitled.md");
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: "untitled.md",
      types: [
        {
          description: "Markdown",
          accept: { "text/markdown": [".md", ".markdown", ".mdown"] },
        },
      ],
    });
    return writeMarkdownFile(handle, markdown);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { status: "cancelled" };
    }
    return { status: "error", message: error instanceof Error ? error.message : String(error) };
  }
}

export function downloadMarkdown(markdown: string, name: string): FileResult {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return { status: "downloaded", name };
}
