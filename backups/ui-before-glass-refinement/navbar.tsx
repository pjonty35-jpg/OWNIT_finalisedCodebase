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
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
      <div
        className={cn(
          "mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 rounded-2xl border px-3 transition-all duration-300 sm:h-16 sm:gap-4 sm:rounded-full sm:px-5",
          scrolled
            ? "liquid-bar border-white/10 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.85)]"
            : "border-white/[0.07] bg-ink/25 backdrop-blur-md"
        )}
      >
        <div className="flex items-center gap-8">
          <Logo />
          <nav aria-label="Primary" className="hidden lg:flex items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
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
                {item.hot ? (
                  <span aria-hidden className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-ivory animate-pulse" />
                ) : null}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          {user && engagement ? (
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-mute hover:text-ivory hover:bg-white/5 transition"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          </button>
          <Link
            href="/cart"
            aria-label={`Cart, ${cart} items`}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-mute hover:text-ivory hover:bg-white/5 transition"
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
            <ButtonLink href="/signin" size="sm" className="ml-1 hidden sm:inline-flex">
              Sign In
            </ButtonLink>
          )}
          <button
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-full text-ivory hover:bg-white/5"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu — floating glass card */}
      {menuOpen ? (
        <div className="mx-auto mt-2 max-w-6xl lg:hidden liquid rounded-2xl overflow-hidden shadow-[0_30px_80px_-24px_rgba(0,0,0,0.9)]">
          <nav aria-label="Mobile" className="flex flex-col p-3">
            {NAV.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center justify-between rounded-xl px-4 py-3.5 text-base transition-colors",
                  isActive(item.href) ? "bg-white/[0.07] text-ivory" : "text-mute hover:bg-white/5 hover:text-ivory"
                )}
                style={{ animation: `riseIn .4s var(--ease-out-soft) ${i * 0.05}s both` }}
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

const TRENDING = ["BETTER THINGS AHEAD", "oversized hoodie", "minimal line art", "jersey 07", "same dreams"];

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ products: { slug: string; name: string }[]; designs: { id: string; title: string }[] }>({ products: [], designs: [] });

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults({ products: [], designs: [] });
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then(setResults)
        .catch(() => {});
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] bg-ink/90 backdrop-blur-sm animate-pop-in" onClick={onClose}>
      <div className="wrap pt-24" onClick={(e) => e.stopPropagation()}>
        <div className="card-surface overflow-hidden shadow-2xl">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products, designs, creators…"
            aria-label="Search"
            className="w-full bg-transparent px-6 h-16 text-lg text-ivory placeholder:text-faint focus:outline-none border-b border-line"
          />
          <div className="max-h-[50vh] overflow-y-auto p-4">
            {q.trim().length < 2 ? (
              <div>
                <p className="label-caps mb-3">Trending</p>
                <div className="flex flex-wrap gap-2">
                  {TRENDING.map((t) => (
                    <button
                      key={t}
                      onClick={() => setQ(t)}
                      className="press rounded-full border border-line2 px-3.5 py-1.5 text-xs text-mute hover:text-ivory hover:border-mute transition"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {results.products.map((p) => (
                  <Link key={p.slug} href={`/products/${p.slug}`} onClick={onClose} className="block rounded-lg px-3 py-2.5 text-sm text-ivory hover:bg-white/5">
                    {p.name}
                  </Link>
                ))}
                {results.designs.map((d) => (
                  <Link key={d.id} href={`/inspiration/${d.id}`} onClick={onClose} className="block rounded-lg px-3 py-2.5 text-sm text-mute hover:bg-white/5">
                    ✦ {d.title} <span className="text-faint">— design</span>
                  </Link>
                ))}
                {results.products.length === 0 && results.designs.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-faint">Nothing found. Try another search.</p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
