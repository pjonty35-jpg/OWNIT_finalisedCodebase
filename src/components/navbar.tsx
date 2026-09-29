"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./logo";
import { ButtonLink, PointsFly } from "./ui";
import { cn } from "@/lib/utils";
import { idle } from "@/lib/performance";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/create", label: "Create", hot: true },
  { href: "/collections", label: "Collections" },
  { href: "/inspiration", label: "Inspiration" },
  { href: "/about", label: "About" },
];

interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface Engagement {
  points: number;
  tier: { id: string; name: string };
  streak: number;
  checkedInToday: boolean;
}

export function Navbar() {
  const pathname = usePathname();
  const isStudio = pathname === "/create";
  const isHome = pathname === "/";
  const [user, setUser] = useState<SessionUser | null>(null);
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [cart, setCart] = useState<number>(0);
  const [cartPop, setCartPop] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [checkinFly, setCheckinFly] = useState<{ points: number; streak: number } | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const cartCount = useRef(0);
  const scrollFrame = useRef<number | null>(null);
  const scrolledValue = useRef(false);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    const update = () => {
      scrollFrame.current = null;
      const next = window.scrollY > 12;
      if (next !== scrolledValue.current) {
        scrolledValue.current = next;
        setScrolled(next);
      }
    };
    const onScroll = () => {
      if (scrollFrame.current === null) scrollFrame.current = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    async function refresh() {
      try {
        const [me, cartRes] = await Promise.all([fetch("/api/auth/me"), fetch("/api/cart")]);
        const meData = await me.json();
        const cartData = await cartRes.json();
        if (!alive) return;
        setUser(meData.user ?? null);
        setEngagement(meData.engagement ?? null);
        const count = cartData.count ?? 0;
        if (count !== cartCount.current) {
          cartCount.current = count;
          if (count > 0) {
            setCart(count);
            setCartPop(true);
            setTimeout(() => setCartPop(false), 500);
          } else {
            setCart(0);
          }
        }
      } catch {
        /* offline */
      }
    }
    // Auth/cart status is useful, but it should never compete with the hero's
    // first paint or the first user input.
    const cancelInitialRefresh = idle(() => void refresh(), 900);
    const onCart = () => void refresh();
    window.addEventListener("ownit:cart", onCart);
    return () => {
      alive = false;
      cancelInitialRefresh();
      window.removeEventListener("ownit:cart", onCart);
    };
  }, []);

  async function checkIn() {
    if (checkingIn || engagement?.checkedInToday) return;
    setCheckingIn(true);
    try {
      const res = await fetch("/api/rewards/checkin", { method: "POST" });
      if (res.status === 401) {
        window.location.href = "/signin?next=/";
        return;
      }
      const data = await res.json();
      if (data.ok) {
        setCheckinFly({ points: data.points, streak: data.streak });
        setEngagement(data.engagement);
        setTimeout(() => setCheckinFly(null), 1800);
      } else {
        setEngagement(data.engagement);
      }
    } catch {
      /* offline */
    } finally {
      setCheckingIn(false);
    }
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className={cn("brand-nav fixed inset-x-0 top-0 z-50 px-3 sm:px-5", isStudio && "studio-navigation")}>
      <div
        className={cn(
          "nav-shell mx-auto flex items-center justify-between gap-3 sm:gap-4",
          scrolled && "nav-shell-scrolled"
        )}
      >
        <div className="flex items-center gap-8">
          <Logo />
          <nav aria-label="Primary" className="hidden lg:flex items-center gap-1">
            {NAV.filter(item => !isStudio || item.href !== "/inspiration").map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "group relative rounded-full px-3.5 py-2 text-sm transition-colors",
                  isActive(item.href) ? "text-ivory" : "text-mute hover:text-ivory"
                )}
              >
                <span className={cn(item.hot && !isActive(item.href) && "group-hover:text-ivory")}>{item.label}</span>
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-3 -bottom-0.5 h-px origin-left bg-ivory transition-transform duration-300",
                    isActive(item.href) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  )}
                />
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          {!isHome ? (
            <Link href="/" className="home-return" aria-label="Back to Home">
              <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5m6-6-6 6 6 6" />
              </svg>
              <span>Back to Home</span>
            </Link>
          ) : null}
          {user && engagement && !isStudio ? (
            <button
              onClick={checkIn}
              disabled={engagement.checkedInToday || checkingIn}
              title={engagement.checkedInToday ? "Streak safe — come back tomorrow" : "Daily check-in — earn points"}
              className={cn(
                "press mr-1 hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:inline-flex",
                engagement.checkedInToday
                  ? "border-line bg-surface text-mute cursor-default"
                  : "border-ivory/40 bg-ivory/10 text-ivory hover:border-ivory hover:bg-ivory/20"
              )}
            >
              <span aria-hidden>🔥</span>
              <span>{engagement.streak}d</span>
              <span className="text-line2">·</span>
              <span>✦ {engagement.points}</span>
            </button>
          ) : null}

          <button
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            className={cn("nav-icon inline-flex h-10 w-10 items-center justify-center rounded-full text-mute hover:text-ivory hover:bg-white/5 transition-colors", isStudio && "studio-search-trigger")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            {isStudio && <span>Search for inspiration…</span>}
          </button>
          <Link
            href="/cart"
            aria-label={`Cart, ${cart} items`}
            className="nav-icon relative inline-flex h-10 w-10 items-center justify-center rounded-full text-mute hover:text-ivory hover:bg-white/5 transition-colors"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 7h12l1.2 13H4.8L6 7z" />
              <path d="M9 9V6a3 3 0 016 0v3" />
            </svg>
            {cart > 0 ? (
              <span
                className={cn(
                  "absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ivory px-1 text-[0.625rem] font-bold text-ink",
                  cartPop && "animate-heartbeat"
                )}
              >
                {cart}
              </span>
            ) : null}
          </Link>
          {user ? (
            <Link
              href="/account"
              aria-label="Account"
              className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-line2 bg-raise text-sm font-semibold text-ivory transition hover:border-ivory hover:-translate-y-0.5"
            >
              {(user.name?.[0] ?? user.email[0] ?? "O").toUpperCase()}
            </Link>
          ) : (
            <ButtonLink href="/signin" size="sm" className="nav-signin ml-1">
              Sign In
            </ButtonLink>
          )}
          <button
            aria-label="Menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((v) => !v)}
            className="nav-icon lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-full text-ivory hover:bg-white/5"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu — floating glass card */}
      {menuOpen ? (
        <div id="mobile-navigation" className="brand-mobile-menu mx-auto mt-2 max-w-6xl lg:hidden rounded-2xl overflow-hidden shadow-[0_30px_80px_-24px_rgba(0,0,0,0.9)]">
          <nav aria-label="Mobile" className="flex flex-col p-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center justify-between rounded-xl px-4 py-3.5 text-base transition-colors",
                  isActive(item.href) ? "bg-white/[0.07] text-ivory" : "text-mute hover:bg-white/5 hover:text-ivory"
                )}
              >
                {item.label}
                <span aria-hidden>→</span>
              </Link>
            ))}
            {user && engagement ? (
              <button
                onClick={checkIn}
                disabled={engagement.checkedInToday}
                className="mt-4 flex items-center justify-between rounded-xl border border-ivory/30 bg-ivory/10 px-4 py-3 text-sm font-semibold"
              >
                <span>🔥 {engagement.streak}-day streak</span>
                <span>{engagement.checkedInToday ? "✓ Checked in" : "Check in · +5✦"}</span>
              </button>
            ) : null}
            {!user ? (
              <ButtonLink href="/signin" size="sm" className="mt-4 self-start">
                Sign In
              </ButtonLink>
            ) : null}
          </nav>
        </div>
      ) : null}

      {/* Search overlay */}
      {searchOpen ? <SearchOverlay onClose={() => setSearchOpen(false)} /> : null}

      {checkinFly ? <PointsFly amount={checkinFly.points} label={`day ${checkinFly.streak} streak`} /> : null}
    </header>
  );
}

const SUGGESTIONS = ["oversized", "hoodie", "minimal", "jersey"];
type SearchResults = { products: { slug: string; name: string }[]; designs: { id: string; title: string }[] };

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResults>({ products: [], designs: [] });
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const dialog = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  function closeDialog() {
    dialog.current?.close();
    closeRef.current();
  }

  useEffect(() => {
    const el = dialog.current;
    const previousOverflow = document.body.style.overflow;
    el?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      el?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setResults({ products: [], designs: [] });
      setStatus("idle");
      return;
    }
    const controller = new AbortController();
    setStatus("loading");
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Search unavailable");
        const data = await response.json();
        if (!controller.signal.aborted) {
          setResults({ products: data.products ?? [], designs: data.designs ?? [] });
          setStatus("ready");
        }
      } catch {
        if (!controller.signal.aborted) setStatus("error");
      }
    }, 220);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [q]);

  return (
    <dialog ref={dialog} className="brand-search" aria-label="Search OWNIT"
      onCancel={(event) => { event.preventDefault(); closeDialog(); }}
      onClick={(event) => { if (event.target === event.currentTarget) closeDialog(); }}>
      <div>
        <div className="search-top">
          <input value={q} onChange={(event) => { setQ(event.target.value); setStatus(event.target.value.trim().length >= 2 ? "loading" : "idle"); }}
            placeholder="Search products and designs…" aria-label="Search products and designs"
            className="w-full bg-transparent px-6 h-16 text-ivory placeholder:text-mute focus:outline-none" />
          <button onClick={closeDialog} aria-label="Close search" className="search-close">×</button>
        </div>
        <div className="max-h-[55vh] overflow-y-auto p-5">
          {q.trim().length < 2 ? <div>
            <p className="label-caps mb-3">Find your starting point</p>
            <div className="flex flex-wrap gap-2">{SUGGESTIONS.map(term => <button key={term} onClick={() => setQ(term)} className="rounded-full border border-line2 px-4 py-3 text-xs text-mute hover:text-ivory hover:border-mute">{term}</button>)}</div>
          </div> : <div aria-live="polite" aria-busy={status === "loading"}>
            {status === "loading" && <p className="px-3 py-6 text-sm text-mute">Finding your next canvas…</p>}
            {status === "error" && <p className="px-3 py-6 text-sm text-mute">Search is unavailable right now. Please try again or <Link href="/shop" onClick={closeDialog} className="underline text-ivory">browse the collection</Link>.</p>}
            {status === "ready" && <div className="space-y-1">
              {results.products.map(p => <Link key={p.slug} href={`/products/${p.slug}`} onClick={closeDialog} className="block rounded-lg px-3 py-3 text-sm text-ivory hover:bg-white/5">{p.name} <span className="text-mute">— product</span></Link>)}
              {results.designs.map(d => <Link key={d.id} href={`/inspiration/${d.id}`} onClick={closeDialog} className="block rounded-lg px-3 py-3 text-sm text-ivory hover:bg-white/5">{d.title} <span className="text-mute">— design</span></Link>)}
              {results.products.length === 0 && results.designs.length === 0 && <p className="px-3 py-6 text-sm text-mute">No matches yet. Try a product type, like “hoodie”.</p>}
            </div>}
          </div>}
        </div>
      </div>
    </dialog>
  );
}
