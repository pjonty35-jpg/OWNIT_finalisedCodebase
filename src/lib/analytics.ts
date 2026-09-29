/**
 * Analytics abstraction. Wire real providers (GA4, Plausible, PostHog…) by
 * implementing the interface. Event names follow the OWNIT event plan; no
 * invasive tracking, no PII beyond what events already carry.
 */

type EventName =
  | "page_view"
  | "create_clicked"
  | "editor_opened"
  | "design_created"
  | "design_saved"
  | "design_shared"
  | "design_remixed"
  | "product_viewed"
  | "added_to_cart"
  | "checkout_started"
  | "payment_completed"
  | "order_completed";

interface AnalyticsProvider {
  readonly name: string;
  track(name: EventName, props?: Record<string, string | number | boolean | null | undefined>): void;
}

class ConsoleAnalytics implements AnalyticsProvider {
  readonly name = "console";
  track(name: EventName, props?: Record<string, string | number | boolean | null | undefined>) {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      console.debug(`[analytics] ${name}`, props ?? {});
    }
  }
}

let provider: AnalyticsProvider | null = null;

export function analytics(): AnalyticsProvider {
  if (!provider) provider = new ConsoleAnalytics();
  return provider;
}

export function trackEvent(name: EventName, props?: Record<string, string | number | boolean | null | undefined>) {
  analytics().track(name, props);
}
