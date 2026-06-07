// app/admin/analytics/page.tsx
import type { ReactNode } from "react";
import { getDashboardStats } from "@/lib/analytics";

export const dynamic = "force-dynamic"; // always show fresh numbers

function rupees(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

export default async function AnalyticsPage() {
  const s = await getDashboardStats();
  const maxTrend = Math.max(1, ...s.trend.map((d) => d.kit + d.marketplace));

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold mb-1">Analytics</h1>
      <p className="text-sm text-gray-500 mb-6">
        Updated {new Date(s.generatedAt).toLocaleString("en-IN")}
      </p>

      {/* Top numbers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card label="Revenue (this month)" value={rupees(s.kpis.revenueMonth)} />
        <Card label="Revenue (today)" value={rupees(s.kpis.revenueToday)} />
        <Card label="Orders (this month)" value={String(s.kpis.ordersMonth)} />
        <Card label="Avg order value" value={rupees(s.kpis.avgOrderValue)} />
        <Card label="Pending fulfillment" value={String(s.kpis.pendingFulfillment)} />
        <Card label="Owed (pay later)" value={rupees(s.kpis.outstandingPayLater)} />
        <Card label="Cancelled (this month)" value={String(s.kpis.cancelledMonth)} />
        <Card label="New users (this month)" value={String(s.kpis.newUsersMonth)} />
      </div>

      <p className="text-sm text-gray-600 mb-8">
        This month: <b>{rupees(s.revenueSplit.kit)}</b> from kits ·{" "}
        <b>{rupees(s.revenueSplit.marketplace)}</b> from marketplace
      </p>

      {/* Last 30 days */}
      <Section title="Revenue — last 30 days">
        <div className="flex items-end gap-1 h-32">
          {s.trend.map((d) => {
            const h = Math.round(((d.kit + d.marketplace) / maxTrend) * 100);
            return (
              <div
                key={d.date}
                title={`${d.date}: ${rupees(d.kit + d.marketplace)}`}
                className="flex-1 rounded-t bg-indigo-500/80"
                style={{ height: `${Math.max(2, h)}%` }}
              />
            );
          })}
        </div>
      </Section>

      {/* What to pre-assemble */}
      <Section title="Top school + class (what to pre-assemble)">
        <Table
          head={["School", "Class", "Orders", "Revenue"]}
          rows={s.topCombos.map((c) => [c.school, c.class, String(c.orders), rupees(c.revenue)])}
          empty="No kit orders yet"
        />
      </Section>

      {/* What to restock */}
      <Section title="Restock demand (out-of-stock items people want)">
        <Table
          head={["Item", "People waiting"]}
          rows={s.restock.map((r) => [r.itemName, String(r.requests)])}
          empty="No notify-me requests"
        />
      </Section>

      {/* Marketplace */}
      <Section title="Marketplace">
        <div className="flex flex-wrap gap-6 text-sm mb-4">
          <span>Active: <b>{s.marketplace.active}</b></span>
          <span>Pending approval: <b>{s.marketplace.pendingApproval}</b></span>
          <span>Sold: <b>{s.marketplace.sold}</b></span>
        </div>
        <Table
          head={["Top seller", "Items sold"]}
          rows={s.marketplace.topSellers.map((t) => [t.name, String(t.sold)])}
          empty="No sales yet"
        />
      </Section>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Table({ head, rows, empty }: { head: string[]; rows: string[][]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-gray-400">{empty}</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-gray-100">
              {r.map((cell, j) => (
                <td key={j} className="px-3 py-2">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}