import Link from "next/link";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PageHero, Section } from "@/components/page";

export const metadata: Metadata = pageMetadata({
  title: "Help Centre",
  description: "Guides for ordering, designing, shipping and account management on OWNIT.",
  path: "/help",
});

const TOPICS = [
  { title: "Ordering", links: [["How OWNIT works", "/how-it-works"], ["FAQ", "/faq"], ["Contact", "/contact"]] },
  { title: "Design", links: [["Open the studio", "/create"], ["Copyright & your art", "/copyright"], ["Quality & printing", "/quality"]] },
  { title: "Delivery", links: [["Shipping info", "/shipping"], ["Returns & refunds", "/returns"], ["Track your order", "/account"]] },
];

export default function HelpPage() {
  return (
    <div>
      <PageHero eyebrow="We've got you" title="Help centre" note="Short answers first. Real support when you need it." />
      <Section className="pt-0">
        <div className="grid gap-4 md:grid-cols-3">
          {TOPICS.map((t) => (
            <div key={t.title} className="card-surface p-7">
              <h2 className="headline text-lg">{t.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {t.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-mute hover:text-ivory">{label} →</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
