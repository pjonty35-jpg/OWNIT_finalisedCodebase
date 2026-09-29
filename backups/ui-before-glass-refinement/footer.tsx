import Link from "next/link";
import { Logo } from "./logo";

const COLS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Create",
    links: [
      { href: "/create", label: "Design Studio" },
      { href: "/inspiration", label: "Inspiration" },
      { href: "/how-it-works", label: "How It Works" },
      { href: "/quality", label: "Quality" },
    ],
  },
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "All Products" },
      { href: "/collections", label: "Collections" },
      { href: "/journal", label: "Journal" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/help", label: "Help Centre" },
      { href: "/contact", label: "Contact" },
      { href: "/shipping", label: "Shipping" },
      { href: "/returns", label: "Returns" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
      { href: "/copyright", label: "Copyright" },
      { href: "/about", label: "About" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-coal">
      {/* Artwork backdrop: warm glow behind the brand column */}
      <div aria-hidden className="footer-bg" />

      <div className="wrap relative z-10 flex flex-col items-center py-16 text-center">
        {/* Brand: logo + tagline, centered */}
        <div className="flex flex-col items-center">
          <Logo />
          <p className="label-caps mt-4 text-ivory">Design It. Own It. Wear It.</p>
          <p className="mt-4 max-w-sm text-sm text-mute">
            Your imagination, made wearable. Premium blank apparel, your original artwork, made one at a time.
          </p>
        </div>

        {/* Links */}
        <div className="mt-14 grid grid-cols-2 gap-x-10 gap-y-10 sm:grid-cols-4 sm:gap-x-16">
          {COLS.map((col) => (
            <nav key={col.title} aria-label={col.title} className="flex flex-col items-center">
              <p className="label-caps mb-4">{col.title}</p>
              <ul className="flex flex-col items-center space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href} className="text-sm text-mute transition-colors hover:text-ivory">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Editorial watermark */}
        <div aria-hidden className="pointer-events-none mt-14 w-full select-none overflow-hidden">
          <p className="headline text-stroke text-center text-[18vw] leading-[0.8] lg:text-[11rem]">OWNIT</p>
        </div>
      </div>
    </footer>
  );
}
