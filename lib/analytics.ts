// lib/analytics.ts
// Server-only. Aggregates all stats for /admin/analytics in one round of queries.

// Same inline Prisma singleton your API routes use (you have no shared lib/prisma).
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/* ──────────────────────────────────────────────────────────────────────────
 *  Your kit statuses: confirmed, assembling, ready, delivered,
 *  cancel_requested, cancelled.
 *  Revenue = every order that ISN'T cancelled, so confirmed/assembling/ready/
 *  delivered all count automatically. If a cancelled order ever shows up in
 *  revenue, just add its exact status word to KIT.cancelled below.
 * ────────────────────────────────────────────────────────────────────────── */
const KIT = {
  cancelled: ["cancelled", "refunded"], // money NOT kept
  delivered: "delivered",               // done — excluded from "pending fulfillment"
};
const ORDER = {
  revenue: ["paid", "confirmed", "completed"], // marketplace Order statuses = revenue
};
const LISTING = {
  active: "approved",  // your post-approval "live" status
  pending: "pending",  // awaiting your approval
};

/* ── IST (UTC+5:30) day/month boundaries ── */
const IST_OFFSET = 5.5 * 60 * 60 * 1000;

function istStartOfToday(now = new Date()): Date {
  const ist = new Date(now.getTime() + IST_OFFSET);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - IST_OFFSET);
}
function istStartOfMonth(now = new Date()): Date {
  const ist = new Date(now.getTime() + IST_OFFSET);
  ist.setUTCDate(1);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - IST_OFFSET);
}
function daysAgo(n: number, now = new Date()): Date {
  const d = istStartOfToday(now);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}
function istDayKey(date: Date): string {
  return new Date(date.getTime() + IST_OFFSET).toISOString().slice(0, 10);
}

export type DashboardStats = Awaited<ReturnType<typeof getDashboardStats>>;

export async function getDashboardStats() {
  const now = new Date();
  const todayStart = istStartOfToday(now);
  const monthStart = istStartOfMonth(now);
  const trendStart = daysAgo(29, now);
  const notDone = [...KIT.cancelled, KIT.delivered]; // for "pending fulfillment"

  const [
    kitMonth, kitToday, orderMonth, orderToday,
    kitPendingCount, kitOutstanding, kitCancelledMonth,
    topCombosRaw, restockRaw,
    activeListings, pendingListings, soldListings, topSellersRaw,
    newUsersMonth, openRequests, ratingAgg,
    kitTrendRows, orderTrendRows,
  ] = await Promise.all([
    prisma.kitOrder.aggregate({ _sum: { paidNow: true }, _count: true,
      where: { status: { notIn: KIT.cancelled }, createdAt: { gte: monthStart } } }),
    prisma.kitOrder.aggregate({ _sum: { paidNow: true }, _count: true,
      where: { status: { notIn: KIT.cancelled }, createdAt: { gte: todayStart } } }),
    prisma.order.aggregate({ _sum: { amount: true }, _count: true,
      where: { status: { in: ORDER.revenue }, createdAt: { gte: monthStart } } }),
    prisma.order.aggregate({ _sum: { amount: true }, _count: true,
      where: { status: { in: ORDER.revenue }, createdAt: { gte: todayStart } } }),
    prisma.kitOrder.count({ where: { status: { notIn: notDone } } }),
    prisma.kitOrder.aggregate({ _sum: { payLater: true },
      where: { status: { notIn: KIT.cancelled } } }),
    prisma.kitOrder.count({
      where: { status: { in: KIT.cancelled }, createdAt: { gte: monthStart } } }),
    prisma.kitOrder.groupBy({ by: ["school", "class"], _count: { _all: true },
      _sum: { totalAmount: true }, where: { status: { notIn: KIT.cancelled } } }),
    prisma.stockNotify.groupBy({ by: ["itemName"], _count: { _all: true },
      where: { notified: false } }),
    prisma.listing.count({ where: { status: LISTING.active, sold: false } }),
    prisma.listing.count({ where: { status: LISTING.pending } }),
    prisma.listing.count({ where: { sold: true } }),
    prisma.listing.groupBy({ by: ["sellerId"], _count: { _all: true },
      where: { sold: true } }),
    prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.bookRequest.count({ where: { status: "open" } }),
    prisma.review.aggregate({ _avg: { rating: true }, _count: true }),
    prisma.kitOrder.findMany({ where: { status: { notIn: KIT.cancelled },
      createdAt: { gte: trendStart } }, select: { createdAt: true, paidNow: true } }),
    prisma.order.findMany({ where: { status: { in: ORDER.revenue },
      createdAt: { gte: trendStart } }, select: { createdAt: true, amount: true } }),
  ]);

  const kitRevMonth = kitMonth._sum.paidNow ?? 0;
  const orderRevMonth = orderMonth._sum.amount ?? 0;
  const revenueMonth = kitRevMonth + orderRevMonth;
  const revenueToday = (kitToday._sum.paidNow ?? 0) + (orderToday._sum.amount ?? 0);
  const ordersMonth = kitMonth._count + orderMonth._count;
  const avgOrderValue = ordersMonth > 0 ? Math.round(revenueMonth / ordersMonth) : 0;

  const byDay = new Map<string, { kit: number; marketplace: number }>();
  for (let i = 29; i >= 0; i--) byDay.set(istDayKey(daysAgo(i, now)), { kit: 0, marketplace: 0 });
  for (const r of kitTrendRows) { const b = byDay.get(istDayKey(r.createdAt)); if (b) b.kit += r.paidNow; }
  for (const r of orderTrendRows) { const b = byDay.get(istDayKey(r.createdAt)); if (b) b.marketplace += r.amount; }
  const trend = [...byDay].map(([date, v]) => ({ date, ...v }));

  const topCombos = topCombosRaw
    .map((c) => ({ school: c.school, class: c.class, orders: c._count._all, revenue: c._sum.totalAmount ?? 0 }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 10);

  const restock = restockRaw
    .map((r) => ({ itemName: r.itemName, requests: r._count._all }))
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 10);

  const topSellerIds = topSellersRaw
    .map((s) => ({ sellerId: s.sellerId, sold: s._count._all }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);
  const sellerUsers = topSellerIds.length
    ? await prisma.user.findMany({
        where: { id: { in: topSellerIds.map((s) => s.sellerId) } },
        select: { id: true, name: true } })
    : [];
  const sellerName = new Map(sellerUsers.map((u) => [u.id, u.name]));
  const topSellers = topSellerIds.map((s) => ({ name: sellerName.get(s.sellerId) ?? "Unknown", sold: s.sold }));

  return {
    generatedAt: now.toISOString(),
    kpis: {
      revenueMonth,
      revenueToday,
      ordersMonth,
      avgOrderValue,
      pendingFulfillment: kitPendingCount,
      outstandingPayLater: kitOutstanding._sum.payLater ?? 0,
      cancelledMonth: kitCancelledMonth,
      newUsersMonth,
      openRequests,
      avgRating: ratingAgg._avg.rating ? Number(ratingAgg._avg.rating.toFixed(1)) : null,
      reviewCount: ratingAgg._count,
    },
    revenueSplit: { kit: kitRevMonth, marketplace: orderRevMonth },
    trend,
    topCombos,
    restock,
    marketplace: { active: activeListings, pendingApproval: pendingListings, sold: soldListings, topSellers },
  };
}