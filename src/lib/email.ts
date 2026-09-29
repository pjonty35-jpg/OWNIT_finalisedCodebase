/**
 * Transactional email abstraction. The `console` provider logs emails to the
 * server console (perfect for development); add a real provider by
 * implementing the interface and registering it below.
 */

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailProvider {
  readonly name: string;
  send(input: SendEmailInput): Promise<void>;
}

class ConsoleEmailProvider implements EmailProvider {
  readonly name = "console";
  async send(input: SendEmailInput) {
    console.log(
      `[email:${this.name}] to=${input.to} subject="${input.subject}"\n${input.text ?? input.html}`
    );
  }
}

class ResendEmailProvider implements EmailProvider {
  readonly name = "resend";
  async send(input: SendEmailInput) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY missing");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "OWNIT <hello@ownit.example>",
        to: input.to,
        subject: input.subject,
        html: input.html,
      }),
    });
    if (!res.ok) throw new Error(`Resend failed: ${res.status}`);
  }
}

export function getEmailProvider(): EmailProvider {
  return process.env.EMAIL_PROVIDER === "resend" ? new ResendEmailProvider() : new ConsoleEmailProvider();
}

export async function sendEmail(input: SendEmailInput) {
  try {
    await getEmailProvider().send(input);
  } catch (err) {
    // Email failures must never break the checkout flow.
    console.error("[email] send failed:", err);
  }
}

export function orderConfirmationEmail(orderNumber: string, total: string, trackUrl: string) {
  const html = `
  <div style="font-family:Helvetica,Arial,sans-serif;background:#0a0a0a;color:#f5f2ea;padding:32px">
    <h1 style="letter-spacing:0.08em">OWNIT</h1>
    <p>DESIGN IT. OWN IT. WEAR IT.</p>
    <h2>Order ${orderNumber} confirmed</h2>
    <p>Your ideas are going into production. Total: <strong>${total}</strong></p>
    <p><a href="${trackUrl}" style="color:#f5f2ea">Track your order</a></p>
  </div>`;
  return { subject: `OWNIT order ${orderNumber} confirmed`, html };
}
