export type FileResult =
  | { status: "opened"; name: string }
  | { status: "saved"; name: string; handle?: FileSystemFileHandle }
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

export type MarkdownTreeEntry = {
  name: string;
  path: string;
  kind: "file" | "directory";
  children?: MarkdownTreeEntry[];
  handle?: FileSystemFileHandle;
};

async function readDirectoryEntries(
  directory: FileSystemDirectoryHandle,
  basePath = directory.name,
): Promise<MarkdownTreeEntry> {
  const children: MarkdownTreeEntry[] = [];
  for await (const [, handle] of directory.entries()) {
    const path = `${basePath}/${handle.name}`;
    if ("entries" in handle) {
      const child = await readDirectoryEntries(handle, path);
      if ((child.children?.length ?? 0) > 0) children.push(child);
    } else if (/\.(md|markdown|mdown)$/i.test(handle.name)) {
      children.push({ name: handle.name, path, kind: "file", handle });
    }
  }
  children.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "directory" ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
  return { name: directory.name, path: basePath, kind: "directory", children };
}

export async function pickMarkdownDirectory(): Promise<
  | { status: "picked"; tree: MarkdownTreeEntry }
  | { status: "cancelled" }
  | { status: "unsupported" }
  | { status: "error"; message: string }
> {
  if (!window.showDirectoryPicker) return { status: "unsupported" };
  try {
    const handle = await window.showDirectoryPicker({ mode: "read" });
    return { status: "picked", tree: await readDirectoryEntries(handle) };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { status: "cancelled" };
    }
    return { status: "error", message: error instanceof Error ? error.message : String(error) };
  }
}

export async function readMarkdownFileHandle(
  handle: FileSystemFileHandle,
): Promise<
  | { status: "opened"; handle: FileSystemFileHandle; name: string; text: string }
  | { status: "error"; message: string }
> {
  try {
    const file = await handle.getFile();
    return { status: "opened", handle, name: handle.name || file.name, text: await file.text() };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : String(error) };
  }
}

export async function createMarkdownFile(): Promise<
  | { status: "created"; handle: FileSystemFileHandle; name: string }
  | { status: "cancelled" }
  | { status: "unsupported" }
  | { status: "error"; message: string }
> {
  if (!window.showSaveFilePicker) return { status: "unsupported" };
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
    const result = await writeMarkdownFile(handle, "");
    if (result.status === "saved") return { status: "created", handle, name: result.name };
    if (result.status === "error") return result;
    return { status: "error", message: "Unable to create file" };
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
    return { status: "saved", name: handle.name, handle };
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
