"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

// Every Reveal instance shares a single observer. The landing page has many
// cards; one observer avoids creating an observer and timer per card.
const revealCallbacks = new Map<Element, () => void>();
let revealObserver: IntersectionObserver | null = null;

function getRevealObserver() {
  if (revealObserver) return revealObserver;
  revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const reveal = revealCallbacks.get(entry.target);
        reveal?.();
        revealCallbacks.delete(entry.target);
        revealObserver?.unobserve(entry.target);
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
  );
  return revealObserver;
}

/* ---------------- Button ---------------- */

type ButtonVariant = "primary" | "outline" | "ghost" | "danger" | "glass";
type ButtonSize = "sm" | "md" | "lg";

const btnBase =
  "inline-flex items-center justify-center gap-2 font-medium tracking-wide transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap active:scale-[0.97]";

const btnVariants: Record<ButtonVariant, string> = {
  primary: "bg-ivory text-ink hover:bg-white sheen hover:shadow-[0_0_36px_rgba(245,242,234,0.22)]",
  outline: "border border-line2 text-ivory hover:border-ivory/60 hover:bg-white/5",
  ghost: "text-mute hover:text-ivory hover:bg-white/5",
  danger: "border border-red-900/60 text-red-300 hover:bg-red-950/40",
  glass:
    "liquid-chip text-ivory border-0 hover:brightness-125 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_10px_32px_-12px_rgba(0,0,0,0.6)]",
};

const btnSizes: Record<ButtonSize, string> = {
  sm: "text-xs px-3.5 h-9 rounded-lg",
  md: "text-sm px-5 h-11 rounded-xl",
  lg: "text-sm px-7 h-13 rounded-xl",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={cn(btnBase, btnVariants[variant], btnSizes[size], className)} {...props} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cn(btnBase, btnVariants[variant], btnSizes[size], className)}>
      {children}
    </Link>
  );
}

/* ---------------- Liquid glass panel ---------------- */

/**
 * Apple-style glass pane: refracting blur, luminous rim, and a specular
 * highlight that follows the pointer. Server-safe; hydration-free.
 */
export function GlassPanel({
  children,
  className,
  specular = true,
}: {
  children: ReactNode;
  className?: string;
  specular?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className={cn("liquid rounded-2xl", specular && "specular", className)}
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el || e.pointerType === "touch") return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
        el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
      }}
    >
      {children}
    </div>
  );
}

/* ---------------- Motion primitives ---------------- */

/** Fade-and-rise once the element scrolls into view. Zero-JS fallback = visible. */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li" | "span";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Already in view (or no IO support): show immediately — no reveal delay
    // for above-the-fold content, and no reliance on observer timing.
    if (typeof IntersectionObserver === "undefined" || el.getBoundingClientRect().top < window.innerHeight) {
      setSeen(true);
      return;
    }
    const io = getRevealObserver();
    const reveal = () => setSeen(true);
    revealCallbacks.set(el, reveal);
    io.observe(el);
    return () => {
      revealCallbacks.delete(el);
      io.unobserve(el);
    };
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={className}
      style={{
        opacity: seen ? 1 : 0,
        transform: seen ? "none" : "translateY(22px)",
        transition: `opacity 0.7s var(--ease-out-soft) ${delay}s, transform 0.7s var(--ease-out-soft) ${delay}s`,
      }}
    >
      {children}
    </Tag>
  );
}

/** Infinite horizontal ticker (Gen-Z marquee). Duplicated content, CSS-animated. */
export function Marquee({
  items,
  className,
  speed = 28,
  separator = "✦",
}: {
  items: string[];
  className?: string;
  speed?: number;
  separator?: string;
}) {
  const row = [...items, ...items];
  return (
    <div className={cn("overflow-hidden", className)} aria-hidden>
      <div
        className="flex w-max items-center gap-8 whitespace-nowrap"
        style={{ animation: `marquee ${speed}s linear infinite` }}
      >
        {row.map((item, i) => (
          <span key={i} className="flex items-center gap-8">
            <span>{item}</span>
            <span className="text-faint">{separator}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Number that counts up when scrolled into view — makes stats feel alive. */
export function CountUp({ value, className, duration = 1.2 }: { value: number; className?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || started.current) return;
        started.current = true;
        io.disconnect();
        const t0 = performance.now();
        const step = (t: number) => {
          const p = Math.min(1, (t - t0) / (duration * 1000));
          const eased = 1 - Math.pow(1 - p, 3);
          setShown(Math.round(value * eased));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {shown.toLocaleString("en-IN")}
    </span>
  );
}

/** Floating "+10 ✦" that flies up — instant reward feedback. */
export function PointsFly({ amount, label }: { amount: number; label?: string }) {
  return (
    <span
      aria-live="polite"
      className="pointer-events-none fixed bottom-28 left-1/2 z-[110] -translate-x-1/2 whitespace-nowrap rounded-full border border-ivory/30 bg-ivory px-4 py-1.5 text-sm font-bold text-ink shadow-[0_8px_30px_rgba(245,242,234,0.25)]"
      style={{ animation: "pointsFly 1.6s var(--ease-out-soft) both" }}
    >
      +{amount} ✦ {label ?? "OWNIT points"}
    </span>
  );}

/* ---------------- Inputs ---------------- */

const fieldCls =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 h-11 text-sm text-ivory placeholder:text-faint shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm transition-colors focus:border-ivory/40 focus:bg-white/[0.06] focus:outline-none";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldCls, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldCls, "h-auto min-h-24 py-3", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldCls, "appearance-none pr-9 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23a39d92%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-no-repeat bg-[right_0.9rem_center]", className)} {...props}>
      {children}
    </select>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="label-caps">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-faint">{hint}</span> : null}
    </label>
  );
}

/* ---------------- Badge ---------------- */

export function Badge({ children, tone = "default", className }: { children: ReactNode; tone?: "default" | "success" | "warn" | "danger"; className?: string }) {
  const tones = {
    default: "liquid-chip text-mute border-0",
    success: "border-emerald-400/25 text-emerald-300 bg-emerald-950/40 backdrop-blur-sm",
    warn: "border-amber-400/25 text-amber-300 bg-amber-950/40 backdrop-blur-sm",
    danger: "border-red-400/25 text-red-300 bg-red-950/40 backdrop-blur-sm",
  } as const;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.6875rem] tracking-wide shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]", tones[tone], className)}>
      {children}
    </span>
  );
}

/* ---------------- Spinner ---------------- */

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-ivory/90 shadow-[0_0_14px_rgba(245,242,234,0.25)]",
        className
      )}
    />
  );
}

/* ---------------- EmptyState ---------------- */

export function EmptyState({
  title,
  note,
  action,
  icon,
}: {
  title: string;
  note?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="liquid grain relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center">
      <span aria-hidden className="pointer-events-none absolute -right-6 -top-8 select-none font-display text-[7rem] font-black leading-none text-line/40">
        ✦
      </span>
      {icon ? <div className="mb-4 text-faint animate-float-y">{icon}</div> : null}
      <p className="headline text-xl">{title}</p>
      {note ? <p className="mt-2 max-w-sm text-sm text-mute">{note}</p> : null}
      {action ? <div className="press mt-6">{action}</div> : null}
    </div>
  );
}

/* ---------------- Modal ---------------- */

const ModalCtx = createContext<{ close: () => void }>({ close: () => {} });

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby={id}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={ref}
        className={cn(
          "liquid relative z-10 max-h-[88vh] w-full overflow-y-auto rounded-2xl p-6 shadow-[0_40px_120px_-24px_rgba(0,0,0,0.9)] animate-[riseIn_.25s_var(--ease-out-soft)] sm:p-8",
          wide ? "sm:max-w-2xl" : "sm:max-w-md"
        )}
      >
        <ModalCtx.Provider value={{ close: onClose }}>
          {title ? (
            <div className="mb-5 flex items-center justify-between">
              <h2 id={id} className="headline text-lg">
                {title}
              </h2>
              <button onClick={onClose} aria-label="Close" className="text-faint hover:text-ivory text-xl leading-none">
                ×
              </button>
            </div>
          ) : null}
          {children}
        </ModalCtx.Provider>
      </div>
      <style>{`@keyframes riseIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

export function useModalClose() {
  return useContext(ModalCtx);
}

/* ---------------- Toasts ---------------- */

interface Toast {
  id: number;
  message: string;
  tone: "info" | "error" | "success";
}

const ToastCtx = createContext<{ push: (message: string, tone?: Toast["tone"]) => void }>({ push: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, tone: Toast["tone"] = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-3), { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-24 sm:bottom-8 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "liquid pointer-events-auto flex w-full items-center gap-2.5 rounded-full px-4 py-2.5 text-sm animate-pop-in",
              t.tone === "error" ? "text-red-100" : t.tone === "success" ? "text-emerald-100" : "text-ivory"
            )}
          >
            <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0 rounded-full", t.tone === "error" ? "bg-red-400" : t.tone === "success" ? "bg-emerald-400" : "bg-ivory")} />
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}
