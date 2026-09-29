"use client";

import { useState } from "react";
import type { Metadata } from "next";
import { PageHero, Section } from "@/components/page";
import { Button, Field, Input, Textarea, useToast } from "@/components/ui";

export default function ContactPage() {
  const { push } = useToast();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send");
      setSent(true);
      push("Message sent — we'll get back within a day", "success");
    } catch (err) {
      push(err instanceof Error ? err.message : "Could not send", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <PageHero eyebrow="Talk to us" title="Contact" note="Order questions, design help, wholesale, press — one inbox, real humans." />
      <Section className="max-w-2xl pt-0">
        {sent ? (
          <div className="card-surface p-10 text-center">
            <p className="headline text-2xl">Message received.</p>
            <p className="mt-3 text-sm text-mute">We reply within one working day.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="card-surface space-y-5 p-8">
            <Field label="Email">
              <Input name="email" type="email" required placeholder="you@example.com" />
            </Field>
            <Field label="Subject">
              <Input name="subject" required minLength={3} placeholder="What's this about?" />
            </Field>
            <Field label="Message">
              <Textarea name="message" required minLength={10} rows={6} placeholder="Tell us everything…" />
            </Field>
            <Button type="submit" disabled={sending} className="w-full">
              {sending ? "Sending…" : "Send message"}
            </Button>
          </form>
        )}
      </Section>
    </div>
  );
}
