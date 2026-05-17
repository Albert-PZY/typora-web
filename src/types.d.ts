// markdown-it-emoji ships a `lib/data/full.mjs` with the full shortcode
// → glyph map. The package has no .d.ts for it; declare a minimal
// shape so the emoji feature can import it without `any`.
declare module "markdown-it-emoji/lib/data/full.mjs" {
  const data: Record<string, string>;
  export default data;
}

interface FileSystemWritableFileStream {
  write(data: string | Blob | BufferSource): Promise<void>;
  close(): Promise<void>;
}

interface FileSystemFileHandle {
  readonly name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritableFileStream>;
}

interface Window {
  showOpenFilePicker?: (options?: unknown) => Promise<FileSystemFileHandle[]>;
  showSaveFilePicker?: (options?: unknown) => Promise<FileSystemFileHandle>;
}
