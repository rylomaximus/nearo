import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { renderQrToDataUrl } from "@/lib/nearo/qr";
import { buildJoinUrl } from "@/lib/nearo/format";

/**
 * QR dialog — encodes ONLY the join URL (origin + session id).
 * No file data is ever embedded in a QR code.
 */
export function QrDialog({
  open,
  onOpenChange,
  sessionId,
  pairingCode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  pairingCode: string;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open || !sessionId) return;
    let cancelled = false;
    setFailed(false);
    setDataUrl(null);
    renderQrToDataUrl(buildJoinUrl(sessionId))
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open, sessionId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Scan to connect</DialogTitle>
          <DialogDescription>
            Open Nearo on the other device and scan this code. It contains only the
            temporary session reference.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 pb-2">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt={`QR code for joining Nearo session with pairing code ${pairingCode}`}
              className="animate-fade-up w-56 rounded-xl border border-border bg-white p-2"
            />
          ) : failed ? (
            <div className="flex h-56 w-56 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
              QR unavailable — use the code
            </div>
          ) : (
            <div className="h-56 w-56 animate-pulse rounded-xl bg-muted" />
          )}
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Pairing code</p>
            <p className="pairing-code text-2xl font-semibold">{pairingCode}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
