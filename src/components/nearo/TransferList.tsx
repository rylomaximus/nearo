import { CheckCircle2, CircleDashed, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { estimateEta, formatBytes, formatDuration, formatSpeed } from "@/lib/nearo/format";
import type { IncomingFile } from "@/lib/nearo/types";
import type { TransferItem } from "@/hooks/use-nearo";

function statusIcon(state: TransferItem["state"]) {
  switch (state) {
    case "active":
      return <Loader2 className="size-4 animate-spin text-muted-foreground" />;
    case "done":
      return <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />;
    case "failed":
      return <X className="size-4 text-destructive" />;
    case "cancelled":
      return <CircleDashed className="size-4 text-muted-foreground" />;
  }
}

/**
 * Live transfer list: filename, real byte progress, speed + ETA from measured
 * throughput, per-item cancel. Progress is always real — driven by bytes
 * actually sent/received over the data channel.
 */
export function TransferList({
  items,
  onCancel,
  className,
}: {
  items: TransferItem[];
  onCancel?: (id: string) => void;
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <ul className={cn("flex flex-col divide-y divide-border rounded-xl border border-border bg-card", className)}>
      {items.map((item) => {
        const pct = item.size > 0 ? Math.min(100, Math.round((item.transferred / item.size) * 100)) : 0;
        const elapsed = (item.endedAt ?? Date.now()) - item.startedAt;
        const speed = item.state === "active" && elapsed > 400 ? (item.transferred / elapsed) * 1000 : undefined;
        const eta = item.state === "active" ? estimateEta(item.size - item.transferred, speed ?? 0) : null;
        const active = item.state === "active";
        return (
          <li key={item.id} className="flex flex-col gap-2 px-4 py-3">
            <div className="flex items-center gap-3">
              {statusIcon(item.state)}
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.name}</span>
              <span className="font-mono-tabular text-xs text-muted-foreground">
                {formatBytes(item.transferred)} / {formatBytes(item.size)}
              </span>
              {active && onCancel && item.direction === "send" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => onCancel(item.id)}
                  aria-label={`Cancel sending ${item.name}`}
                >
                  <X className="size-3.5" />
                </Button>
              )}
            </div>
            <Progress value={pct} className="h-1.5" aria-label={`${item.name}: ${pct}%`} />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{pct}%</span>
              <span className="flex items-center gap-2">
                {speed !== undefined && <span className="font-mono-tabular">{formatSpeed(speed)}</span>}
                {eta !== null && <span className="font-mono-tabular">~{formatDuration(eta)} left</span>}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Received files with inline previews for images, Save via the browser
 * download, and Copy when the browser Clipboard API supports it.
 */
export function ReceivedFilesList({
  files,
  onSendBack,
}: {
  files: IncomingFile[];
  onSendBack?: (file: File) => void;
}) {
  if (files.length === 0) return null;
  return (
    <ul className="flex flex-col gap-3">
      {files.map((file) => {
        const isImage = file.mime.startsWith("image/");
        const url = isImage ? URL.createObjectURL(file.blob) : null;
        const fileObj = new File([file.blob], file.name, { type: file.mime });
        const save = () => {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(file.blob);
          a.download = file.name;
          a.click();
          window.setTimeout(() => URL.revokeObjectURL(a.href), 30_000);
        };
        const copy = async () => {
          try {
            // Only works for a few mime types where the browser supports it.
            const item = new ClipboardItem({ [file.mime]: file.blob });
            await navigator.clipboard.write([item]);
            return true;
          } catch {
            return false;
          }
        };
        return (
          <li key={file.id} className="flex gap-3 rounded-xl border border-border bg-card p-3">
            {url ? (
              <img
                src={url}
                alt={file.name}
                className="size-14 shrink-0 rounded-lg border border-border object-cover"
              />
            ) : (
              <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
                {file.name.split(".").pop()?.slice(0, 4).toUpperCase() || "FILE"}
              </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-medium">{file.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatBytes(file.size)}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs" onClick={save}>
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => void copy()}
                >
                  Copy
                </Button>
                {onSendBack && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2.5 text-xs"
                    onClick={() => onSendBack(fileObj)}
                  >
                    Send back
                  </Button>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
