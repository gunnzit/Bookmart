// lib/analytics.ts
// Server-only. Aggregates all stats for /admin/analytics in one round of queries.

// Same inline Prisma singleton your API routes use (you have no shared lib/prisma).
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/* ──────────────────────────────────────────────────────────────────────────
 *  ⚠️  THE ONLY THING I GUESSED AT — CONFIRM THESE MATCH YOUR status STRINGS.
 *  Everything else is built against your actual schema. If a revenue or
 *  cancelled number ever looks wrong, it's almost certainly one of these.
 * ────────────────────────────────────────────────────────────────────────── */
const KIT = {
  revenue: ["confirmed"],                 // statuses that count as kept revenue
  cancelled: ["cancelled", "refunded", "cancel_requested", "refund_requested"],
  pendingFulfillment: ["confirmed"],      // still to pack / hand over (see note below)
};
const ORDER = {
  revenue: ["paid", "confirmed", "completed"], // marketplace Order statuses = revenue
};
const LISTING = {
  active: "approved",                     // your post-approval "live" status
  pending: "pending",                     // awaiting your approval
};
// NOTE: until you track a "delivered"/"completed" kit status, pendingFulfillment =
// every confirmed order. When you build order-tracking, add that status here.

/* ── IST (UTC+5:30) day/month boundaries — your buyers and you are in India,
 *    so "today" and "this month" must be IST, not the server's UTC. ───────── */
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
  // YYYY-MM-DD in IST
  return new Date(date.getTime() + IST_OFFSET).toISOString().slice(0, 10);
}

export type DashboardStats = Awaited<ReturnType<typeof getDashboardStats>>;

export async function getDashboardStats() {
  const now = new Date();
  const todayStart = istStartOfToday(now);
  const monthStart = istStartOfMonth(now);
  const trendStart = daysAgo(29, now); // last 30 days incl. today

  const [
    kitMonth, kitToday, orderMonth, orderToday,
    kitPendingCount, kitOutstanding, kitCancelledMonth,
    topCombosRaw, restockRaw,
    activeListings, pendingListings, soldListings, topSellersRaw,
    newUsersMonth, openRequests, ratingAgg,
    kitTrendRows, orderTrendRows,
  ] = await Promise.all([
    prisma.kitOrder.aggregate({ _sum: { paidNow: true }, _count: true,
      where: { status: { in: KIT.revenue }, createdAt: { gte: monthStart } } }),
    prisma.kitOrder.aggregate({ _sum: { paidNow: true }, _count: true,
      where: { status: { in: KIT.revenue }, createdAt: { gte: todayStart } } }),
    prisma.order.aggregate({ _sum: { amount: true }, _count: true,
      where: { status: { in: ORDER.revenue }, createdAt: { gte: monthStart } } }),
    prisma.order.aggregate({ _sum: { amount: true }, _count: true,
      where: { status: { in: ORDER.revenue }, createdAt: { gte: todayStart } } }),
    prisma.kitOrder.count({ where: { status: { in: KIT.pendingFulfillment } } }),
    prisma.kitOrder.aggregate({ _sum: { payLater: true },
      where: { status: { in: KIT.revenue } } }),
    prisma.kitOrder.count({
      where: { status: { in: KIT.cancelled }, createdAt: { gte: monthStart } } }),
    prisma.kitOrder.groupBy({ by: ["school", "class"], _count: { _all: true },
      _sum: { totalAmount: true }, where: { status: { in: KIT.revenue } } }),
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
    prisma.kitOrder.findMany({ where: { status: { in: KIT.revenue },
      createdAt: { gte: trendStart } }, select: { createdAt: true, paidNow: true } }),
    prisma.order.findMany({ where: { status: { in: ORDER.revenue },
      createdAt: { gte: trendStart } }, select: { createdAt: true, amount: true } }),
  ]);

  // ── KPIs ──
  const kitRevMonth = kitMonth._sum.paidNow ?? 0;
  const orderRevMonth = orderMonth._sum.amount ?? 0;
  const revenueMonth = kitRevMonth + orderRevMonth;
  const revenueToday = (kitToday._sum.paidNow ?? 0) + (orderToday._sum.amount ?? 0);
  const ordersMonth = kitMonth._count + orderMonth._count;
  const avgOrderValue = ordersMonth > 0 ? Math.round(revenueMonth / ordersMonth) : 0;

  // ── 30-day revenue trend (bucketed in JS — fine at your volume) ──
  const byDay = new Map<string, { kit: number; marketplace: number }>();
  for (let i = 29; i >= 0; i--) byDay.set(istDayKey(daysAgo(i, now)), { kit: 0, marketplace: 0 });
  for (const r of kitTrendRows) { const b = byDay.get(istDayKey(r.createdAt)); if (b) b.kit += r.paidNow; }
  for (const r of orderTrendRows) { const b = byDay.get(istDayKey(r.createdAt)); if (b) b.marketplace += r.amount; }
  const trend = [...byDay].map(([date, v]) => ({ date, ...v }));

  // ── Top school + class combos (what to pre-assemble) ──
  const topCombos = topCombosRaw
    .map((c) => ({ school: c.school, class: c.class, orders: c._count._all, revenue: c._sum.totalAmount ?? 0 }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 10);

  // ── Restock demand (unnotified notify-me requests by item) ──
  const restock = restockRaw
    .map((r) => ({ itemName: r.itemName, requests: r._count._all }))
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 10);

  // ── Top sellers by sold listings (resolve names) ──
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