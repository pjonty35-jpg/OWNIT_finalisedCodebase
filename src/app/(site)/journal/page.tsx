import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";
import { PageHero, Section } from "@/components/page";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({
  title: "Journal",
  description: "Stories on design, quality and the OWNIT community.",
  path: "/journal",
});

// Public listing — cached with ISR.
export const revalidate = 60;

export default async function JournalPage() {
  const posts = await db.journalPost.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" } });
  return (
    <div>
      <PageHero eyebrow="Notes from the studio" title="Journal" note="Design thinking, fabric science and creator stories." />
      <Section className="pt-0">
        <div className="grid gap-4 md:grid-cols-3">
          {posts.map((p) => (
            <Link key={p.id} href={`/journal/${p.slug}`} className="group rounded-2xl border border-line bg-surface p-6 transition hover:-translate-y-1 hover:border-line2">
              <p className="label-caps">{p.tag}</p>
              <h2 className="headline mt-3 text-xl leading-snug">{p.title}</h2>
              <p className="mt-3 text-sm text-mute">{p.excerpt}</p>
              <p className="mt-5 text-xs text-faint">{formatDate(p.publishedAt)} · Read →</p>
            </Link>
          ))}
          {posts.length === 0 ? <p className="text-sm text-mute">No entries yet.</p> : null}
        </div>
      </Section>
    </div>
  );
}
