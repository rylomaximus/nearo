import { cn } from "@/lib/utils";

// Deterministic generated avatar — no uploads, no accounts, no tracking.
// The same device name always renders the same subtle geometric avatar.

const PALETTES: Array<{ bg: string; fg: string }> = [
  { bg: "bg-neutral-200 dark:bg-neutral-700", fg: "text-neutral-700 dark:text-neutral-200" },
  { bg: "bg-sky-100 dark:bg-sky-950", fg: "text-sky-900 dark:text-sky-200" },
  { bg: "bg-emerald-100 dark:bg-emerald-950", fg: "text-emerald-900 dark:text-emerald-200" },
  { bg: "bg-amber-100 dark:bg-amber-950", fg: "text-amber-900 dark:text-amber-200" },
  { bg: "bg-rose-100 dark:bg-rose-950", fg: "text-rose-900 dark:text-rose-200" },
  { bg: "bg-violet-100 dark:bg-violet-950", fg: "text-violet-900 dark:text-violet-200" },
];

const SHAPES: Array<Array<[number, number]>> = [
  [[0, 0], [1, 1]],
  [[0, 1], [1, 0]],
  [[0, 0], [0, 1], [1, 0]],
  [[1, 0], [1, 1], [0, 1]],
  [[0, 0], [1, 1], [0, 1], [1, 0]],
];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function DeviceAvatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const h = hashName(name || "device");
  const palette = PALETTES[h % PALETTES.length];
  const shape = SHAPES[(h >> 3) % SHAPES.length];
  const letter = (name || "N").trim().charAt(0).toUpperCase() || "N";

  return (
    <span
      className={cn(
        "relative inline-flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-black/5 dark:border-white/10",
        palette.bg,
        palette.fg,
        className,
      )}
      aria-hidden="true"
    >
      {shape.map(([cx, cy], i) => (
        <span
          key={i}
          className="absolute rounded-[3px] bg-current opacity-[0.14]"
          style={{
            width: "38%",
            height: "38%",
            left: `${8 + cx * 46}%`,
            top: `${8 + cy * 46}%`,
          }}
        />
      ))}
      <span className="relative text-sm font-semibold">{letter}</span>
    </span>
  );
}
