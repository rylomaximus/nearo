import { useState } from "react";
import { Check, Copy, Download, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatTimeOfDay } from "@/lib/nearo/format";
import type { ReceivedText } from "@/lib/nearo/types";

/**
 * Text transfer panel — a plain editor plus per-item actions on the receiving
 * side. Text travels only over the data channel; nothing is stored remotely.
 */
export function TextTransferPanel({
  receivedTexts,
  onSend,
}: {
  receivedTexts: ReceivedText[];
  onSend: (text: string) => boolean;
}) {
  const [text, setText] = useState("");
  const [lastCopiedId, setLastCopiedId] = useState<string | null>(null);

  const send = () => {
    if (!text.trim()) return;
    if (onSend(text)) {
      setText("");
    } else {
      toast.error("Could not send text — the connection is not open.");
    }
  };

  const copy = async (t: ReceivedText) => {
    try {
      await navigator.clipboard.writeText(t.text);
      setLastCopiedId(t.id);
      window.setTimeout(() => setLastCopiedId(null), 1500);
    } catch {
      toast.error("Clipboard unavailable — select the text and copy manually.");
    }
  };

  const save = (t: ReceivedText) => {
    const blob = new Blob([t.text], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `nearo-text-${new Date(t.receivedAt).toISOString().slice(0, 10)}.txt`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 30_000);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="nearo-text-input" className="text-sm font-medium">
          Send text
        </label>
        <Textarea
          id="nearo-text-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or type text to send to the other device…"
          className="min-h-32 resize-y"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") send();
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {text.length.toLocaleString()} characters
          </span>
          <Button onClick={send} disabled={!text.trim()} size="sm">
            <Send className="size-4" />
            Send text
          </Button>
        </div>
      </div>

      {receivedTexts.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Received</h3>
          <ul className="flex flex-col gap-2">
            {receivedTexts.map((t) => (
              <li key={t.id} className="rounded-xl border border-border bg-card p-3">
                <p className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words text-sm text-foreground/90">
                  {t.text}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {formatTimeOfDay(t.receivedAt)} · {t.text.length.toLocaleString()} chars
                  </span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => void copy(t)}>
                      {lastCopiedId === t.id ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      {lastCopiedId === t.id ? "Copied" : "Copy"}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => save(t)}>
                      <Download className="size-3.5" />
                      .txt
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
