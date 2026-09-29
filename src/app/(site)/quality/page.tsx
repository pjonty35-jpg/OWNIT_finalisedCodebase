import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PageHero, Section } from "@/components/page";
import { ButtonLink } from "@/components/ui";

export const metadata: Metadata = pageMetadata({
  title: "Quality",
  description: "Fabric, printing, fit and finishing — the OWNIT quality philosophy.",
  path: "/quality",
});

const PILLARS = [
  { title: "Fabric first", body: "240–400 GSM heavyweight knits, bio-washed before cutting so the tee you design on is the one that arrives — no shrinking surprises." },
  { title: "Print integrity", body: "DTG and DTF inks rated for 40+ washes. We colour-match your design against the garment before a single unit runs." },
  { title: "Considered fits", body: "Patterns graded on real bodies, not size charts from a decade ago. Regular and oversized blocks, both drape-tested." },
  { title: "Human QC", body: "Every piece is inspected by a person — print placement, colour, stitching — before it's folded into your box." },
];

export default function QualityPage() {
  return (
    <div>
      <PageHero eyebrow="No shortcuts" title="Quality is the whole point" note="A custom garment is only as good as the blank under it. Ours earn the ink." />
      <Section className="pt-0">
        <div className="grid gap-4 md:grid-cols-2">
          {PILLARS.map((p) => (
            <div key={p.title} className="card-surface p-8">
              <h2 className="headline text-xl">{p.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-mute">{p.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 rounded-2xl border border-dashed border-line p-10 text-center">
          <p className="hand-note -rotate-2 text-2xl">Feel it before you believe it</p>
          <p className="mx-auto mt-3 max-w-md text-sm text-mute">Order one piece. Wash it ten times. Then decide.</p>
          <ButtonLink href="/shop" variant="outline" className="mt-6">Explore the blanks</ButtonLink>
        </div>
      </Section>
    </div>
  );
}
