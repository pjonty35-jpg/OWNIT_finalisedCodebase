"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const LINKS: { href: string; label: string }[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/production", label: "Production" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/designs", label: "Designs" },
  { href: "/admin/customers", label: "Customers" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-line bg-coal p-5 lg:flex">
      <Logo href="/admin" />
      <p className="label-caps mt-1">Admin</p>
      <nav aria-label="Admin" className="mt-8 flex-1 space-y-1">
        {LINKS.map((l) => {
          const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "block rounded-lg px-3.5 py-2.5 text-sm transition",
                active ? "bg-raise text-ivory" : "text-mute hover:bg-white/5 hover:text-ivory"
              )}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t border-line pt-4">
        <Link href="/" className="block rounded-lg px-3.5 py-2.5 text-sm text-mute hover:text-ivory">← Storefront</Link>
        <button onClick={signOut} className="block w-full rounded-lg px-3.5 py-2.5 text-left text-sm text-mute hover:text-red-300">
          Sign out
        </button>
      </div>
    </aside>
  );
}
