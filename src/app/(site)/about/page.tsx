import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PageHero, Section } from "@/components/page";
import { ButtonLink } from "@/components/ui";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description: "OWNIT is a platform where the customer is the creative director. Design it. Own it. Wear it.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div>
      <PageHero eyebrow="More than clothing" title="The customer is the creative director" note="OWNIT began on a campus, with a frustration: the ideas in our heads had nowhere to go." />
      <Section className="pt-0">
        <div className="max-w-2xl space-y-6 text-base leading-relaxed text-ivory/85">
          <p>
            We could imagine the perfect tee — the line, the phrase, the artwork that meant something to us — but we couldn&apos;t wear it. Merch was generic or minimum-order. Print shops were a black box.
          </p>
          <p>
            So we built the opposite: a studio where the only brief is your own. Premium blanks sourced seriously. A 3D preview that tells the truth. Production that treats a single order with the same care as a thousand.
          </p>
          <p className="hand-note rotate-1 text-2xl text-mute">Same people. Different stories.</p>
          <p>
            OWNIT is for everyone who dares to be different — from campus creators to anyone whose drawer is full of clothes that don&apos;t say what they mean.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            ["Design It", "The studio is yours. Text, images, drawing, remixes — all editable, all yours."],
            ["Own It", "Your artwork stays yours. We print it; we don't claim it."],
            ["Wear It", "Made one at a time, shipped worldwide, tracked to your door."],
          ].map(([t, b]) => (
            <div key={t} className="card-surface p-6">
              <h2 className="headline text-lg">{t}</h2>
              <p className="mt-2 text-sm text-mute">{b}</p>
            </div>
          ))}
        </div>
        <div className="mt-12">
          <ButtonLink href="/create" size="lg">OPEN THE STUDIO</ButtonLink>
        </div>
      </Section>
    </div>
  );
}
