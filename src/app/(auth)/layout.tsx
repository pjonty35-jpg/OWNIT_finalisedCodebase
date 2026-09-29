import Link from "next/link";
import { LogoLockup } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <header className="wrap flex min-h-20 items-center justify-center py-4">
        <LogoLockup width={300} />
      </header>
      <main className="flex flex-1 items-center justify-center px-5 pb-16">{children}</main>
      <footer className="wrap py-6">
        <p className="label-caps text-center">More Than Clothing</p>
      </footer>
    </div>
  );
}
