import { useEffect, useRef, useState } from "react";
import { Camera, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cameraSupported, requestCamera, scanVideoFrame } from "@/lib/nearo/qr";
import { parseQrPayload } from "@/lib/nearo/format";

/**
 * QR scanner — uses the camera via getUserMedia + jsQR. When camera access is
 * denied or unavailable, falls back cleanly to manual code entry.
 */
export function QrScannerDialog({
  open,
  onOpenChange,
  onScan,
  onManualEntry,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (sessionId: string) => void;
  onManualEntry: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setCameraError(null);

    const stop = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setScanning(false);
    };

    if (!cameraSupported()) {
      setCameraError("This browser does not support camera access. Enter the code manually instead.");
      return;
    }

    void (async () => {
      const res = await requestCamera();
      if (cancelled) {
        res.ok && res.stream.getTracks().forEach((t) => t.stop());
        return;
      }
      if (!res.ok) {
        setCameraError(res.error);
        return;
      }
      streamRef.current = res.stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = res.stream;
        video.setAttribute("playsinline", "true"); // iOS Safari
        await video.play().catch(() => {});
        setScanning(true);
        const tick = () => {
          if (cancelled) return;
          const text = scanVideoFrame(video);
          if (text) {
            const parsed = parseQrPayload(text);
            if (parsed.sessionId) {
              stop();
              onScan(parsed.sessionId);
              onOpenChange(false);
              return;
            }
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      }
    })();

    return () => {
      cancelled = true;
      stop();
    };
  }, [open, onOpenChange, onScan]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Scan Nearo QR</DialogTitle>
          <DialogDescription>
            Point the camera at the QR code shown on the other device.
          </DialogDescription>
        </DialogHeader>

        {cameraError ? (
          <div className="flex flex-col items-start gap-3">
            <div className="flex w-full items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <Camera className="mt-0.5 size-4 shrink-0 text-destructive" />
              <p className="text-muted-foreground">{cameraError}</p>
            </div>
            <Button variant="outline" className="w-full" onClick={onManualEntry}>
              <Keyboard className="size-4" />
              Enter code manually
            </Button>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-xl border border-border bg-black">
            <video
              ref={videoRef}
              className="aspect-square w-full object-cover"
              muted
              playsInline
              aria-label="Camera view for scanning QR code"
            />
            {!scanning && (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-white/70">
                Starting camera…
              </div>
            )}
            {scanning && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="size-40 rounded-2xl border-2 border-white/80" />
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
