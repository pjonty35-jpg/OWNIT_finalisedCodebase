import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHero, Section } from "@/components/page";
import { ButtonLink } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";

interface PolicySection {
  heading: string;
  body: string[];
}

const POLICIES: Record<string, { title: string; eyebrow: string; intro: string; sections: PolicySection[] }> = {
  shipping: {
    title: "Shipping",
    eyebrow: "From our floor to your door",
    intro: "Every piece is made to order. Production takes 3–5 working days before your parcel ships.",
    sections: [
      { heading: "Rates & timelines", body: ["Standard delivery is ₹99 and typically arrives 3–7 days after production. Orders above ₹2,999 ship free.", "Express delivery (₹249) prioritises your parcel in the courier network once it leaves our floor."] },
      { heading: "Tracking", body: ["You'll receive a tracking link by email the moment your parcel ships, and you can always track from your account's order page."] },
      { heading: "International", body: ["We ship across India at launch, with international delivery rolling out region by region. Duties and taxes for international orders are calculated at checkout when live in your region."] },
    ],
  },
  returns: {
    title: "Returns & Refunds",
    eyebrow: "Straight answers",
    intro: "Every OWNIT piece is made one-of-one to your design, so we can't restock or resell it. That shapes our policy.",
    sections: [
      { heading: "Print or manufacturing defects", body: ["If your piece arrives with a defect or a print error on our side, tell us within 7 days of delivery with photos. We'll remake it or refund it in full — your choice."] },
      { heading: "Change of mind", body: ["Because each item is produced uniquely for you, we can't accept returns for change of mind, wrong size choice or design approval you signed off in the studio. The 3D preview shows exactly what we print."] },
      { heading: "Refund timelines", body: ["Approved refunds return to the original payment method within 5–7 working days of approval."] },
    ],
  },
  copyright: {
    title: "Copyright & Your Content",
    eyebrow: "Your art stays yours",
    intro: "You keep ownership of everything you create on OWNIT. We print it; we don't claim it.",
    sections: [
      { heading: "Your rights", body: ["You retain full ownership of your original artwork. By ordering, you grant OWNIT only the permission needed to print and deliver your design — nothing more."] },
      { heading: "What you must not upload", body: ["Content you don't own or have permission to use (including brand logos, celebrity images, and third-party artwork), hateful or harassing content, and anything illegal in your or our jurisdiction. When in doubt, upload what you made."] },
      { heading: "Reporting & moderation", body: ["Every published community design can be reported in one click. Reports go to human review, and we remove content that breaks these rules. Repeat violations end publishing access."] },
      { heading: "Community remixes", body: ["Remixing always credits the original creator and links back. Remixes are new works owned by the remixer, inspired by yours — attribution travels with it."] },
    ],
  },
  terms: {
    title: "Terms of Service",
    eyebrow: "The rules of the studio",
    intro: "Plain-language terms for using OWNIT. By ordering, you agree to these.",
    sections: [
      { heading: "Using OWNIT", body: ["You can browse everything without an account. Creating designs, ordering and publishing to the community require an account with accurate details."] },
      { heading: "Orders & pricing", body: ["All prices are shown in INR and calculated server-side at checkout — the total you approve is the total you pay. We may cancel and refund orders where artwork breaks our content policy."] },
      { heading: "Your content", body: ["You own your designs. You're responsible for having the rights to what you upload. Don't upload content you don't have permission to use."] },
      { heading: "Production & delivery", body: ["Made-to-order pieces ship after production (typically 3–5 working days). Timelines are estimates, not guarantees, except where we've missed our stated window."] },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    eyebrow: "Respect, by default",
    intro: "We collect the minimum needed to make, sell and deliver your pieces — and we don't sell your data.",
    sections: [
      { heading: "What we collect", body: ["Account details (email, name), order and delivery information, your saved designs, and standard technical logs. No invasive tracking, no data sales."] },
      { heading: "How we use it", body: ["To produce and deliver your orders, provide support, prevent fraud, and — only if you opt in — send product news. You can export or delete your data anytime from account settings."] },
      { heading: "Security", body: ["Passwords are hashed, sessions are httpOnly, uploads are validated and stored privately, and payment details never touch our servers — they go straight to the payment provider."] },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(POLICIES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const policy = POLICIES[slug];
  if (!policy) return pageMetadata({ title: "Not found", description: "", noIndex: true });
  return pageMetadata({ title: policy.title, description: policy.intro.slice(0, 150), path: `/${slug}` });
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = POLICIES[slug];
  if (!policy) notFound();
  return (
    <div>
      <PageHero eyebrow={policy.eyebrow} title={policy.title} note={policy.intro} />
      <Section className="max-w-3xl pt-0">
        <div className="space-y-8">
          {policy.sections.map((s) => (
            <div key={s.heading} className="card-surface p-7">
              <h2 className="headline text-lg">{s.heading}</h2>
              <div className="mt-3 space-y-3">
                {s.body.map((p, i) => (
                  <p key={i} className="text-sm leading-relaxed text-mute">{p}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 flex items-center justify-between rounded-2xl border border-dashed border-line p-7">
          <p className="text-sm text-mute">Questions about this policy?</p>
          <ButtonLink href="/contact" variant="outline" size="sm">Contact us</ButtonLink>
        </div>
      </Section>
    </div>
  );
}
