import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminCustomers() {
  const users = await db.user.findMany({
    where: { role: "customer", deletedAt: null },
    include: { orders: { select: { total: true, paymentStatus: true } }, designs: { select: { id: true }, where: { deletedAt: null } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-6xl">
      <p className="label-caps">People</p>
      <h1 className="headline mt-2 text-3xl">Customers</h1>

      <div className="card-surface mt-8 overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-faint">
              <th className="px-5 py-3.5 font-medium">Name</th>
              <th className="px-5 py-3.5 font-medium">Email</th>
              <th className="px-5 py-3.5 font-medium">Joined</th>
              <th className="px-5 py-3.5 font-medium">Orders</th>
              <th className="px-5 py-3.5 font-medium">Designs</th>
              <th className="px-5 py-3.5 font-medium text-right">Spent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => {
              const spent = u.orders.filter((o) => o.paymentStatus === "paid").reduce((s, o) => s + o.total, 0);
              return (
                <tr key={u.id} className="transition hover:bg-white/[0.03]">
                  <td className="px-5 py-3.5 font-semibold">{u.name ?? "—"}</td>
                  <td className="px-5 py-3.5 text-xs text-mute">{u.email}</td>
                  <td className="px-5 py-3.5 text-xs text-mute">{formatDate(u.createdAt)}</td>
                  <td className="px-5 py-3.5"><Badge>{u.orders.length}</Badge></td>
                  <td className="px-5 py-3.5"><Badge>{u.designs.length}</Badge></td>
                  <td className="px-5 py-3.5 text-right">₹{Math.round(spent / 100).toLocaleString("en-IN")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
