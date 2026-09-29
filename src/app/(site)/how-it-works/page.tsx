import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PageHero, Section } from "@/components/page";
import { ButtonLink } from "@/components/ui";

export const metadata: Metadata = pageMetadata({
  title: "How It Works",
  description: "Design your own premium apparel: create, preview in 3D, we produce, you wear.",
  path: "/how-it-works",
});

const STEPS = [
  { n: "01", title: "Create Your Design", body: "Open the studio and pick a premium blank. Add text, upload artwork, draw, or remix a community design. Everything is editable, layer by layer.", note: "Your imagination looks good here" },
  { n: "02", title: "See It in 3D", body: "Rotate a realistic 3D preview of your garment. Check placement on the front, back and sides. What you see is what we print.", note: "What you see is what we print" },
  { n: "03", title: "We Make It", body: "Your order goes to production one piece at a time — premium fabrics, precise printing, human quality control before anything ships.", note: "Made one at a time" },
  { n: "04", title: "You Wear It", body: "Track your order from our floor to your door. Wear something no one else can buy — because no one else could make it.", note: "One of one" },
];

export default function HowItWorksPage() {
  return (
    <div>
      <PageHero eyebrow="The OWNIT loop" title="How it works" note="Four steps between an idea and something you actually wear." />
      <Section className="pt-0">
        <ol className="space-y-4">
          {STEPS.map((s) => (
            <li key={s.n} className="card-surface grid gap-6 p-8 md:grid-cols-[100px_1fr_180px] md:items-center">
              <span className="headline text-4xl text-line2">{s.n}</span>
              <div>
                <h2 className="headline text-2xl">{s.title}</h2>
                <p className="mt-2 max-w-xl text-sm text-mute">{s.body}</p>
              </div>
              <span className="hand-note hidden rotate-2 text-xl md:block">{s.note}</span>
            </li>
          ))}
        </ol>
        <div className="mt-12 flex flex-col items-center gap-4 text-center">
          <p className="hand-note -rotate-2 text-2xl">Ready when you are</p>
          <ButtonLink href="/create" size="lg">CREATE YOUR OWN</ButtonLink>
        </div>
      </Section>
    </div>
  );
}
