# Nearo

**Transfer. Nearby. Simple.**

Nearo is a privacy-focused, device-to-device transfer app for the web. Send files, images,
and text directly between nearby devices — no accounts, no cloud storage, no cables.

Think AirDrop / LocalSend, but web-first: open Nearo in a browser on both devices, pair
with a QR code or a six-digit code, and transfer directly over an encrypted peer-to-peer
channel.

---

## Features

- **Direct transfers** — files travel device-to-device over a WebRTC data channel when
  the network allows. File contents never touch a server.
- **No account required** — pick a temporary device name and go.
- **QR + pairing-code join** — scan to connect, or type the code on devices without a
  camera.
- **Files of any type** — images, video, audio, PDFs, ZIPs, anything. Multi-select and
  drag-and-drop on desktop.
- **Text transfer** — a dedicated text mode with copy and save-as-.txt on receipt.
- **Real progress** — chunked streaming with live speed, ETA, and per-file cancel.
  Progress reflects actual bytes on the wire, never simulated.
- **Temporary sessions** — pairing codes and session metadata expire automatically and
  are garbage-collected from the server.
- **Connection diagnostics** — plain-language status (Direct / Relay) plus an expandable
  technical panel (WebRTC state, ICE state, byte counters).
- **Connection test** — measure latency and throughput with generated temporary data.
- **Local-only history (opt-in)** — a session log kept in the browser, never synced.
- **PWA** — installable, standalone, with an app icon and offline app shell.
- **Accessible** — keyboard navigable, screen-reader friendly, reduced-motion aware.

## Architecture

```
┌───────────────────────────── Browser A ─────────────────────────────┐
│  React UI  ← useNearo hook ← NearoSession (protocol + state machine) │
│                                   ↓                                  │
│                             NearoPeer (WebRTC)                       │
└───────────────┬───────────────────────────────┬─────────────────────┘
                │ signaling (SDP/ICE)           │ data channel (DTLS)
                ▼                               ▼
   ┌──────────────────────┐         ┌──────────────────────────┐
   │  Convex coordinator  │         │   Browser B (NearoPeer)  │
   │ (temporary metadata, │         │                          │
   │  auto-expiring rows, │         │  same stack, peer role   │
   │  cron cleanup)       │         └──────────────────────────┘
   └──────────────────────┘
```

Three clearly separated layers:

1. **Signaling / session coordination** (`src/convex/sessions.ts`) — hands out pairing
   codes, relays WebRTC SDP + ICE, expires and deletes sessions. Stores **no file or
   text content**.
2. **Peer-to-peer transfer** (`src/lib/nearo/peer.ts`, `session.ts`, `protocol.ts`) —
   one reliable ordered `RTCDataChannel` per session carries a small JSON control
   protocol plus raw binary file chunks (16 KiB, streamed via `File.slice()`).
3. **UI** (`src/pages/`, `src/components/nearo/`, `src/hooks/use-nearo.ts`) — React +
   Tailwind + shadcn/ui. Talks only to the `useNearo` hook, never to WebRTC directly,
   so the transport can be swapped without UI changes.

## How pairing works

1. Device A taps **Send something** → the coordinator creates a temporary session and
   returns a six-digit pairing code (digits `2-9` only, to avoid 0/1 confusion) and a
   session id.
2. Device A shows the code and a QR encoding `<origin>/app?session=<id>`.
3. Device B taps **Receive something**, scans the QR (or types the code).
4. The coordinator marks the session as joined; both devices run the WebRTC
   handshake (offer/answer + ICE candidates) through the coordinator.
5. The data channel opens; each side sends a `hello` frame with its display name, and
   the dashboard appears on both devices.

Sessions expire after ~10 minutes idle / 30 minutes active (heartbeats extend them),
and a cron job deletes all expired rows.

## How transfers work

- The sender announces a file with a `file-meta` frame, then streams the file as raw
  `ArrayBuffer` chunks (never base64) using `File.slice()` — memory stays flat
  regardless of file size.
- Backpressure uses the standard `bufferedAmountLowThreshold` mechanism.
- The receiver assembles chunks into a `Blob`, shows byte-accurate progress, and offers
  **Save** (browser download), **Copy** (where `ClipboardItem` is supported), and
  **Send back**.
- Text is a single JSON frame — up to reasonable message sizes.
- Either device can send at any time; transfers are serialized per direction to keep
  the ordered channel simple and predictable.

## Security / privacy model

- **Encryption** comes from the platform: WebRTC data channels are DTLS-encrypted by
  the browser. Nearo adds no custom crypto and makes no unverifiable claims.
- **Stored data**: only session id, pairing code, display names, timestamps, and
  signaling payloads. No file contents, no transferred text, no accounts, no analytics.
- **Session lifetime**: pairing codes and sessions expire automatically; expired rows
  are deleted by a cron job.
- **Verification**: the UI shows the peer's chosen device name — check it before
  sending sensitive files.
- **Honest limits**: if a direct path can't be negotiated, Nearo says so. With no TURN
  server configured, such networks simply fail with a clear explanation rather than
  silently relaying private data.

## Browser compatibility

| Browser | Works | Notes |
| --- | --- | --- |
| Chrome / Edge (desktop + Android) | ✅ | Full support |
| Firefox | ✅ | Full support |
| Safari (macOS, iOS/iPadOS) | ✅ | iOS 16+ recommended |
| Samsung Internet | ✅ | Full support |

Known browser-side limits: no direct gallery writes on iOS/Android (downloads are
used), no LAN discovery beacons, and the coordinator must be reachable once at the
start of each session.

## Local development

Requirements: [Bun](https://bun.sh) (or Node 20+), and a Convex deployment.

```bash
bun install
bun convex dev        # pushes functions + generates src/convex/_generated
bun run dev           # Vite dev server on http://localhost:5173
```

The Convex deployment URL is read from `VITE_CONVEX_URL`.

## Deployment

```bash
bun convex deploy     # push functions to production
bun run build         # static build in dist/
```

Serve `dist/` from any static host or CDN. The PWA manifest and service worker are
plain static files under `public/`.

## Known limitations

- **No TURN relay** — networks that block direct WebRTC paths cannot connect. Nearo
  explains this in the UI instead of silently relaying.
- **One coordinator call required** — browsers cannot do fully serverless LAN pairing,
  so the initial handshake needs connectivity to the coordinator (the transfer itself
  typically flows directly afterwards).
- **No folders** — browsers don't expose folder structures through the plain file
  picker; use multi-select or drag-and-drop for many files.
- **Received files live in memory** — save them before closing the tab; Nearo keeps no
  history by default.
- **Signaling availability** — very large batches of ICE candidates may be dropped if
  they exceed the size cap; ICE will still converge in typical networks.

## Roadmap

- [ ] Optional self-hosted TURN configuration with explicit "Relay" labeling
- [ ] Folder transfer via `webkitdirectory` where supported
- [ ] WebTransport / WebCodecs path for very large files
- [ ] Encrypted local history (opt-in, passcode-protected)
- [ ] Multi-peer sessions (one host, several receivers)

## License

MIT.
