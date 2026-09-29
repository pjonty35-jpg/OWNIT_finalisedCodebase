import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Brand marks from the official OWNIT logo artwork.
 * - `Logo`       — navbar/footer wordmark (OWNIT + slash), crisp at small sizes.
 * - `LogoLockup` — full lockup with "DESIGN IT. OWN IT. WEAR IT." for feature spots.
 * Rendered as <img> so the hand-drawn texture and slash stay exact.
 */
export function Logo({
  className,
  href = "/",
  lockup = false,
}: {
  className?: string;
  href?: string;
  lockup?: boolean;
}) {
  return (
    <Link href={href} aria-label="OWNIT home" className={cn("inline-flex shrink-0 select-none items-center", className)}>
      <span className={lockup ? "brand-logo-lockup w-[262px]" : "brand-logo"}>
      {lockup ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/img/brand/OWNIT_logo.png"
          alt="OWNIT — Design It. Own It. Wear It."
          width={1280}
          height={1280}
          fetchPriority="high"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/img/brand/OWNIT_logo.png"
          alt="OWNIT"
          width={1280}
          height={1280}
          fetchPriority="high"
        />
      )}
      </span>
    </Link>
  );
}

/** Standalone lockup for heroes and empty spaces (not a link). */
export function LogoLockup({ className, width = 262 }: { className?: string; width?: number }) {
  return (
    <span className={cn("brand-logo-lockup", className)} style={{ width }}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src="/img/brand/OWNIT_logo.png"
      alt="OWNIT — Design It. Own It. Wear It."
      width={1280}
      height={1280}
    />
    </span>
  );
}
