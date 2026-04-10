"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { FolderOpen, Loader2 } from "lucide-react";
import { parseDroppedFiles, type DroppedFile } from "@/lib/parser";
import { useAnalysis } from "@/lib/analysis-context";
import { cn } from "@/lib/utils";

declare module "react" {
  interface InputHTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    webkitdirectory?: string;
    directory?: string;
  }
}

async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

async function collectFiles(fileList: FileList | null): Promise<DroppedFile[]> {
  if (!fileList) return [];
  const out: DroppedFile[] = [];
  for (const file of Array.from(fileList)) {
    if (!file.name.endsWith(".jsonl")) continue;
    // webkitRelativePath is set when using webkitdirectory
    const relPath =
      (file as File & { webkitRelativePath?: string }).webkitRelativePath ||
      file.name;
    const content = await readFileAsText(file);
    out.push({ path: relPath, content });
  }
  return out;
}

async function collectFromDataTransferItems(
  items: DataTransferItemList
): Promise<DroppedFile[]> {
  const out: DroppedFile[] = [];

  async function walk(
    entry: FileSystemEntry,
    prefix: string
  ): Promise<void> {
    if (entry.isFile) {
      const fileEntry = entry as FileSystemFileEntry;
      if (!entry.name.endsWith(".jsonl")) return;
      const file = await new Promise<File>((resolve, reject) =>
        fileEntry.file(resolve, reject)
      );
      const content = await readFileAsText(file);
      out.push({ path: `${prefix}/${entry.name}`, content });
    } else if (entry.isDirectory) {
      const dirEntry = entry as FileSystemDirectoryEntry;
      const reader = dirEntry.createReader();
      const entries = await new Promise<FileSystemEntry[]>((resolve, reject) => {
        const all: FileSystemEntry[] = [];
        const readBatch = () => {
          reader.readEntries((batch) => {
            if (batch.length === 0) {
              resolve(all);
            } else {
              all.push(...batch);
              readBatch();
            }
          }, reject);
        };
        readBatch();
      });
      for (const child of entries) {
        await walk(child, `${prefix}/${entry.name}`);
      }
    }
  }

  const entries: FileSystemEntry[] = [];
  for (const item of Array.from(items)) {
    const entry = item.webkitGetAsEntry?.();
    if (entry) entries.push(entry);
  }
  for (const entry of entries) {
    await walk(entry, "");
  }
  return out;
}

export function DropZone() {
  const t = useTranslations("upload");
  const router = useRouter();
  const { setSessions } = useAnalysis();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: DroppedFile[]) {
    setError(null);
    setBusy(true);
    try {
      const sessions = await parseDroppedFiles(files);
      if (sessions.length === 0) {
        setError(t("no_sessions"));
        return;
      }
      setSessions(sessions);
      router.push("/dashboard");
    } finally {
      setBusy(false);
    }
  }

  async function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (busy) return;
    const items = e.dataTransfer.items;
    let files: DroppedFile[];
    const firstItem = items && items.length > 0 ? items[0] : null;
    if (firstItem && typeof firstItem.webkitGetAsEntry === "function") {
      files = await collectFromDataTransferItems(items);
    } else {
      files = await collectFiles(e.dataTransfer.files);
    }
    await handleFiles(files);
  }

  async function onChange(e: ChangeEvent<HTMLInputElement>) {
    if (busy) return;
    const files = await collectFiles(e.target.files);
    await handleFiles(files);
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "cursor-pointer rounded-md border-2 border-dashed p-12 text-center transition-all bg-card/30 backdrop-blur-sm",
          dragging
            ? "border-primary bg-primary/10 shadow-[0_0_24px_hsl(var(--primary)/0.25)]"
            : "border-border hover:border-primary/60 hover:bg-card/60 hover:shadow-[0_0_16px_hsl(var(--primary)/0.15)]",
          busy && "pointer-events-none opacity-70"
        )}
      >
        {busy ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            <p className="text-base text-muted-foreground">{t("parsing")}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <FolderOpen className="h-12 w-12 text-muted-foreground" />
            <p className="text-xl font-medium">{t("drop_here")}</p>
            <p className="text-base text-muted-foreground">{t("or_click")}</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          webkitdirectory=""
          directory=""
          multiple
          onChange={onChange}
          className="hidden"
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
