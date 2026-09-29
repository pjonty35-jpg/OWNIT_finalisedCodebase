import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";
import { Section } from "@/components/page";
import { ButtonLink } from "@/components/ui";
import { formatDate } from "@/lib/utils";

// Public article — cached with ISR.
export const revalidate = 60;

async function load(slug: string) {
  return db.journalPost.findUnique({ where: { slug }, include: { author: { select: { name: true } } } });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await load(slug);
  if (!post) return pageMetadata({ title: "Not found", description: "", noIndex: true });
  return pageMetadata({ title: post.title, description: post.excerpt, path: `/journal/${slug}` });
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await load(slug);
  if (!post || !post.published) notFound();
  return (
    <article className="wrap max-w-3xl pt-32 pb-24 lg:pt-40">
      <Link href="/journal" className="text-xs text-faint hover:text-ivory">← Journal</Link>
      <p className="label-caps mt-8">{post.tag}</p>
      <h1 className="headline mt-3 text-4xl sm:text-5xl">{post.title}</h1>
      <p className="mt-4 text-sm text-faint">{formatDate(post.publishedAt)}{post.author?.name ? ` · ${post.author.name}` : ""}</p>
      <div className="mt-10 space-y-6">
        {post.body.split("\n\n").map((para, i) => (
          <p key={i} className="text-base leading-relaxed text-ivory/85">{para}</p>
        ))}
      </div>
      <Section className="mt-16 border-t border-line pt-10">
        <p className="hand-note -rotate-2 text-2xl">Inspired? Make it yours.</p>
        <ButtonLink href="/create" className="mt-5">Create Your Own</ButtonLink>
      </Section>
    </article>
  );
}
