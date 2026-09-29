import type { Metadata } from "next";
import { db } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";
import { PageHero, Section } from "@/components/page";
import { ButtonLink } from "@/components/ui";

export const metadata: Metadata = pageMetadata({
  title: "FAQ",
  description: "Answers on ordering, design ownership, production, shipping and returns at OWNIT.",
  path: "/faq",
});

// Static content — cached with ISR.
export const revalidate = 60;

export default async function FaqPage() {
  const faqs = await db.faq.findMany({ orderBy: { sortOrder: "asc" } });
  const sections = [...new Set(faqs.map((f) => f.section))];
  return (
    <div>
      <PageHero eyebrow="Good questions" title="FAQ" note="Everything people ask before their first piece." />
      <Section className="max-w-3xl pt-0">
        {sections.map((section) => (
          <div key={section} className="mb-10">
            <h2 className="headline mb-4 text-xl">{section}</h2>
            <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
              {faqs.filter((f) => f.section === section).map((f) => (
                <details key={f.id} className="group px-6 py-5">
                  <summary className="cursor-pointer list-none text-sm font-medium text-ivory marker:hidden">
                    <span className="mr-3 inline-block text-mute transition group-open:rotate-45">+</span>
                    {f.question}
                  </summary>
                  <p className="mt-3 pl-7 text-sm leading-relaxed text-mute">{f.answer}</p>
                </details>
              ))}
            </div>
          </div>
        ))}
        <div className="mt-8 flex items-center justify-between rounded-2xl border border-dashed border-line p-8">
          <p className="text-sm text-mute">Still stuck?</p>
          <ButtonLink href="/contact" variant="outline" size="sm">Contact us</ButtonLink>
        </div>
      </Section>
    </div>
  );
}
