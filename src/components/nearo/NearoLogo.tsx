import { cn } from "@/lib/utils";

/**
 * Nearo mark — two rounded squares converging into one link.
 * Abstract: proximity + connection. Works in monochrome (currentColor).
 */
export function NearoMark({
  className,
  animated = false,
}: {
  className?: string;
  animated?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-8", className)}
      aria-hidden="true"
    >
      {/* device A */}
      <rect x="3" y="3" width="12" height="12" rx="3.5" className="fill-current opacity-90" />
      {/* device B */}
      <rect x="17" y="17" width="12" height="12" rx="3.5" className="fill-current opacity-40" />
      {/* the link */}
      {animated ? (
        <path
          d="M12 20 C16 20 16 12 20 12"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="animate-draw"
          style={{ ["--dash" as string]: "24" }}
        />
      ) : (
        <path
          d="M12 20 C16 20 16 12 20 12"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export function NearoWordmark({
  className,
  markClassName,
  size = "md",
}: {
  className?: string;
  markClassName?: string;
  size?: "sm" | "md" | "lg";
}) {
  const textClass =
    size === "lg"
      ? "text-2xl"
      : size === "sm"
        ? "text-base"
        : "text-lg";
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <NearoMark className={markClassName} />
      <span className={cn("font-semibold tracking-tight", textClass)}>nearo</span>
    </span>
  );
}
