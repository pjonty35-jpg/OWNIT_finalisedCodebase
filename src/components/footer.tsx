import Link from "next/link";
import { Logo } from "./logo";

const FOOTER_GROUPS = [
  {
    title: "Create",
    links: [
      { href: "/create", label: "Design Studio" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/inspiration", label: "Inspiration" },
      { href: "/quality", label: "Quality promise" },
    ],
  },
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "All products" },
      { href: "/collections", label: "Collections" },
      { href: "/journal", label: "Journal" },
      { href: "/cart", label: "Your bag" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/help", label: "Help centre" },
      { href: "/contact", label: "Contact us" },
      { href: "/faq", label: "Frequently asked questions" },
      { href: "/info/shipping", label: "Shipping & returns" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About OWNIT" },
      { href: "/info/terms", label: "Terms" },
      { href: "/info/privacy", label: "Privacy" },
      { href: "/info/copyright", label: "Copyright" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="brand-footer">
      <div className="wrap brand-footer-grid">
        <Logo className="brand-footer-logo" />
        <div className="brand-footer-directory">
          {FOOTER_GROUPS.map(group => (
            <nav key={group.title} aria-label={group.title}>
              <p>{group.title}</p>
              <ul>{group.links.map(link => <li key={link.href}><Link href={link.href}>{link.label}</Link></li>)}</ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="wrap brand-footer-bottom"><span>© {new Date().getFullYear()} OWNIT. Made for your imagination.</span><span>NOT JUST FASHION. A HIGHER FREEDOM.</span></div>
    </footer>
  );
}
