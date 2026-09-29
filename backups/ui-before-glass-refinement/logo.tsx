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
      {lockup ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/img/brand/lockup.webp"
          alt="OWNIT — Design It. Own It. Wear It."
          width={262}
          height={76}
          className="h-auto w-[262px]"
          fetchPriority="high"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/img/brand/wordmark.webp"
          alt="OWNIT"
          width={191}
          height={30}
          className="h-[30px] w-auto sm:h-[32px]"
          fetchPriority="high"
        />
      )}
    </Link>
  );
}

/** Standalone lockup for heroes and empty spaces (not a link). */
export function LogoLockup({ className, width = 262 }: { className?: string; width?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/img/brand/lockup.webp"
      alt="OWNIT — Design It. Own It. Wear It."
      width={width}
      height={Math.round((width * 304) / 1046)}
      className={cn("h-auto", className)}
    />
  );
}
