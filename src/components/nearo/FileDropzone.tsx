import { useRef, useState } from "react";
import { FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/nearo/format";
import type { OutgoingFile } from "@/lib/nearo/types";

/**
 * Dropzone + picker. Desktop: drag files straight onto the area. Mobile:
 * native file picker (multiple selection, any file type).
 */
export function FileDropzone({
  onFiles,
  queued,
  onRemove,
  disabled,
}: {
  onFiles: (files: File[]) => void;
  queued: OutgoingFile[];
  onRemove: (id: string) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const totalBytes = queued.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="flex flex-col gap-3">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Add files to send"
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (disabled) return;
          const files = Array.from(e.dataTransfer.files ?? []);
          if (files.length) onFiles(files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-6 py-10 text-center transition-colors",
          "hover:border-accent/60 hover:bg-accent/[0.03]",
          dragOver && "border-accent bg-accent/[0.06]",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <FilePlus2 className="size-6 text-muted-foreground" />
        <p className="text-sm font-medium">Drop files here or tap to browse</p>
        <p className="text-xs text-muted-foreground">
          Any file type · multiple files supported
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length) onFiles(files);
            e.target.value = ""; // allow re-selecting the same file
          }}
        />
      </div>

      {queued.length > 0 && (
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
          {queued.map((f) => (
            <li key={f.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="min-w-0 flex-1 truncate text-sm">{f.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{formatBytes(f.size)}</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => onRemove(f.id)}
                disabled={f.state === "sending"}
                aria-label={`Remove ${f.name}`}
              >
                <FileXIcon />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {queued.length > 0 && (
        <p className="text-right text-xs text-muted-foreground">
          {queued.length} {queued.length === 1 ? "file" : "files"} · {formatBytes(totalBytes)}
        </p>
      )}
    </div>
  );
}

function FileXIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="m15 11-6 6" />
      <path d="m9 11 6 6" />
    </svg>
  );
}
