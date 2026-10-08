import { BRAND } from "@/lib/brand";

/**
 * Wordmark with a simple gut-loop mark. `light` for use on dark/photo backgrounds;
 * `compact` hides the name on very narrow screens.
 */
export function Logo({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold ${light ? "text-white" : "text-teal-900"}`}>
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
        <rect width="32" height="32" rx="9" className={light ? "fill-white/15" : "fill-teal-700"} />
        <path
          d="M9 11.5c0-2 1.6-3.5 3.5-3.5h6.8a3.6 3.6 0 0 1 0 7.2h-6.6a3.4 3.4 0 0 0 0 6.8H23"
          fill="none"
          stroke={light ? "#a7f3d0" : "#ccfbf1"}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle cx="23" cy="22" r="1.9" fill={light ? "#a7f3d0" : "#ccfbf1"} />
      </svg>
      <span className={`font-display text-lg tracking-tight ${compact ? "max-[420px]:sr-only" : ""}`}>{BRAND}</span>
    </span>
  );
}
