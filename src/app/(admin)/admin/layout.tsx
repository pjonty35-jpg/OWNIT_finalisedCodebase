import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { AdminNav } from "./admin-nav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/signin?next=/admin");
  if (user.role !== "admin") redirect("/");

  return (
    <div className="flex min-h-screen bg-ink">
      <AdminNav />
      <main className="flex-1 p-6 lg:p-10">{children}</main>
    </div>
  );
}
