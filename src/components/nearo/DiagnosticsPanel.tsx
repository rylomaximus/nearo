import { ChevronDown, ShieldCheck } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { formatBytes } from "@/lib/nearo/format";
import type { Diagnostics, TransportKind } from "@/lib/nearo/types";

const TRANSPORT_LABEL: Record<TransportKind, string> = {
  direct: "Direct",
  relay: "Relay",
  unknown: "Checking…",
};

/**
 * Diagnostics panel — plain-language status by default with an expandable
 * "Technical details" section for advanced users. No dev jargon unless asked.
 */
export function DiagnosticsPanel({
  diagnostics,
  className,
}: {
  diagnostics: Diagnostics;
  className?: string;
}) {
  const transportLabel = TRANSPORT_LABEL[diagnostics.transport];
  return (
    <Collapsible className={className}>
      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-2 p-4">
          <div className="flex items-center gap-2 text-sm">
            <ShieldCheck className="size-4 text-muted-foreground" />
            <span className="font-medium">Connection</span>
            <span className="text-muted-foreground">{transportLabel} · encrypted transport</span>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {diagnostics.transport === "direct"
              ? "Files are moving device-to-device and are not passing through any server."
              : diagnostics.transport === "relay"
                ? "A relay is forwarding the traffic because a direct route wasn't available. The data is still end-to-end encrypted between the devices."
                : "Determining the connection route…"}
          </p>
        </div>
        <CollapsibleTrigger className="group flex w-full items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted/50">
          Technical details
          <ChevronDown className="size-3.5 transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <dl className="flex flex-col gap-1.5 border-t border-border p-4 text-xs">
            <Row label="Transport" value={transportLabel} />
            <Row label="WebRTC state" value={diagnostics.webrtcState} />
            <Row label="ICE state" value={diagnostics.iceState} />
            <Row label="Signaling state" value={diagnostics.signalingState} />
            <Row label="Data channel" value={diagnostics.dataChannelState} />
            <Row label="Bytes sent (link)" value={formatBytes(diagnostics.bytesSent)} />
            <Row label="Bytes received (link)" value={formatBytes(diagnostics.bytesReceived)} />
            {diagnostics.selectedCandidatePair && (
              <Row
                label="Route"
                value={`${diagnostics.selectedCandidatePair.protocol} · ${diagnostics.selectedCandidatePair.type}`}
              />
            )}
          </dl>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono-tabular text-foreground/80">{value}</dd>
    </div>
  );
}
