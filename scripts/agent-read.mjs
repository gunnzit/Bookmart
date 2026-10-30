// scripts/agent-read.mjs
// ─────────────────────────────────────────────────────────────────────────
// READ-ONLY database reports for the business agents (operations, finance,
// manager). The owner has allowed this one script permanently in
// .claude/settings.json, so agents never ask again.
//
// It can only READ: every write operation is refused below, before it can
// reach the database. Only the fixed reports in REPORTS run. No raw SQL,
// no arguments that become queries. Phone numbers are never selected, and
// customer names are cut to the first name.
//
//   node scripts/agent-read.mjs ops                  morning checklist data
//   node scripts/agent-read.mjs finance [YYYY-MM-DD] sales for that IST day (default yesterday) + last 7 days
//   node scripts/agent-read.mjs counts               size of the shop
//
// Add a report here (read calls only) when an agent needs new data.
// ─────────────────────────────────────────────────────────────────────────

import { PrismaClient } from '@prisma/client'

const WRITES = new Set(['create', 'createMany', 'createManyAndReturn', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany'])
const prisma = new PrismaClient().$extends({
  query: {
    $allModels: {
      $allOperations({ operation, model, args, query }) {
        if (WRITES.has(operation)) throw new Error(`agent-read is read-only: refused ${model}.${operation}`)
        return query(args)
      },
    },
  },
})

const DAY = 864e5
const IST = 5.5 * 36e5
const first = name => String(name || '').trim().split(/\s+/)[0] || ''
const short = id => String(id).slice(-6)
const sum = (a, f) => a.reduce((s, x) => s + f(x), 0)
const open = { notIn: ['delivered', 'cancelled'] }

// Start of an IST calendar day, as a UTC Date
function istDayStart(ymd) {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d) - IST)
}
function istToday() {
  return new Date(Date.now() + IST).toISOString().slice(0, 10)
}

const REPORTS = {
  async counts() {
    const [users, listings, sold, kitOrders, projects, orders, featured] = await Promise.all([
      prisma.user.count(), prisma.listing.count(), prisma.listing.count({ where: { sold: true } }),
      prisma.kitOrder.count(), prisma.projectRequest.count(), prisma.order.count(),
      prisma.listing.count({ where: { featured: true } }),
    ])
    return { users, listings, sold, unsold: listings - sold, kitOrders, projects, orders, featuredNow: featured }
  },

  async ops() {
    const now = new Date()
    const [kits, pendingCount, pending, reports, projStatus, projUrgent, oos, waiting, reqCount, reqNew] = await Promise.all([
      prisma.kitOrder.findMany({ where: { status: open }, orderBy: { createdAt: 'asc' },
        select: { id: true, school: true, class: true, deliveryMode: true, address: true, totalAmount: true, payLater: true, status: true, createdAt: true } }),
      prisma.listing.count({ where: { status: 'pending' } }),
      prisma.listing.findMany({ where: { status: 'pending' }, orderBy: { createdAt: 'asc' }, take: 10,
        select: { id: true, title: true, price: true, location: true, createdAt: true } }),
      prisma.report.findMany({ where: { createdAt: { gte: new Date(now - 7 * DAY) } }, select: { listingId: true, reason: true, createdAt: true } }),
      prisma.projectRequest.groupBy({ by: ['status'], where: { status: open }, _count: true }),
      prisma.projectRequest.findMany({ where: { status: open, deadline: { lte: new Date(+now + 3 * DAY) } },
        select: { id: true, buyerName: true, category: true, topic: true, classLevel: true, deadline: true, status: true } }),
      prisma.outOfStockItem.findMany(),
      prisma.stockNotify.groupBy({ by: ['itemName'], where: { notified: false }, _count: true }),
      prisma.bookRequest.count({ where: { status: 'open' } }),
      prisma.bookRequest.findMany({ where: { status: 'open' }, orderBy: { createdAt: 'desc' }, take: 5,
        select: { title: true, category: true, maxPrice: true, location: true, createdAt: true } }),
    ])
    const waitMap = Object.fromEntries(waiting.map(w => [w.itemName, w._count]))
    return {
      kitOrdersOpen: kits.map(k => ({ ...k, id: short(k.id) })),
      listingsPending: { count: pendingCount, oldest: pending.map(l => ({ ...l, id: short(l.id), ageDays: Math.floor((now - l.createdAt) / DAY) })) },
      reportsLast7Days: reports,
      projects: { byStatus: Object.fromEntries(projStatus.map(s => [s.status, s._count])),
        dueIn3DaysOrOverdue: projUrgent.map(p => ({ ...p, id: short(p.id), buyerName: first(p.buyerName), overdue: p.deadline < now })) },
      outOfStock: oos.map(o => ({ name: o.name, since: o.createdAt, peopleWaiting: waitMap[o.name] || 0 }))
        .sort((a, b) => b.peopleWaiting - a.peopleWaiting),
      waitingOnItemsNotMarkedOut: waiting.filter(w => !oos.some(o => o.name === w.itemName)).map(w => ({ name: w.itemName, peopleWaiting: w._count })),
      bookRequestsOpen: { count: reqCount, newest: reqNew },
    }
  },

  async finance(day) {
    const ymd = day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : new Date(istDayStart(istToday()) - DAY + IST).toISOString().slice(0, 10)
    const ds = istDayStart(ymd), de = new Date(+ds + DAY), w0 = new Date(+de - 7 * DAY)
    const [kits, projs, orders, featured] = await Promise.all([
      prisma.kitOrder.findMany({ select: { id: true, school: true, kitSubtotal: true, deliveryFee: true, totalAmount: true, paidNow: true, payLater: true,
        buyerName: true, paymentId: true, razorpayOrderId: true, status: true, createdAt: true } }),
      prisma.projectRequest.findMany({ select: { id: true, buyerName: true, status: true, quotePrice: true, advancePaidPaise: true, balancePaidPaise: true, updatedAt: true } }),
      prisma.order.findMany({ select: { id: true, status: true, amount: true, createdAt: true } }),
      prisma.listing.count({ where: { featured: true } }),
    ])
    const inR = (d, a, b) => d >= a && d < b
    const period = (a, b) => {
      const K = kits.filter(x => inR(x.createdAt, a, b))
      const P = projs.filter(x => inR(x.updatedAt, a, b) && x.advancePaidPaise + x.balancePaidPaise > 0)
      const O = orders.filter(x => inR(x.createdAt, a, b))
      return {
        kits: { count: K.length, total: sum(K, x => x.totalAmount), paidNow: sum(K, x => x.paidNow) },
        projectsPaid_proxyUpdatedAt: { count: P.length, rupees: sum(P, x => x.advancePaidPaise + x.balancePaidPaise) / 100 },
        marketplaceOrders: { count: O.length, amount: sum(O, x => x.amount) },
      }
    }
    const payLater = kits.filter(x => x.payLater > 0 && x.status !== 'cancelled').sort((a, b) => a.createdAt - b.createdAt)
    const projDue = projs.filter(x => x.quotePrice != null && x.status !== 'cancelled' && x.quotePrice * 100 > x.advancePaidPaise + x.balancePaidPaise)
    const dup = f => Object.entries(kits.reduce((m, x) => ((m[x[f]] ??= []).push(short(x.id)), m), {})).filter(([k, v]) => k && v.length > 1)
    const refunds = kits.filter(x => x.status === 'cancelled' && x.paidNow > 0)
    return {
      day: ymd,
      dayTotals: period(ds, de),
      last7DaysTotals: period(w0, de),
      toCollect: {
        kitPayLater: { count: payLater.length, total: sum(payLater, x => x.payLater),
          oldest5: payLater.slice(0, 5).map(x => ({ id: short(x.id), first: first(x.buyerName), school: x.school, payLater: x.payLater, created: x.createdAt })) },
        projects: { count: projDue.length, rupees: sum(projDue, x => x.quotePrice * 100 - x.advancePaidPaise - x.balancePaidPaise) / 100,
          rows: projDue.map(x => ({ id: short(x.id), first: first(x.buyerName), status: x.status, quote: x.quotePrice })) },
      },
      flags: {
        duplicatePaymentId: dup('paymentId'),
        duplicateRazorpayOrderId: dup('razorpayOrderId'),
        subtotalPlusDeliveryNotTotal: kits.filter(x => x.kitSubtotal + x.deliveryFee !== x.totalAmount).map(x => short(x.id)),
        paidNowPlusPayLaterNotTotal: kits.filter(x => x.paidNow + x.payLater !== x.totalAmount).map(x => short(x.id)),
      },
      refundsPossiblyOwed: refunds.map(x => ({ id: short(x.id), first: first(x.buyerName), paidNow: x.paidNow, created: x.createdAt })),
      featuredListingsNow: featured,
      note: 'Featured-boost revenue is not stored in the database; it needs a Razorpay export.',
    }
  },
}

const [name, arg] = process.argv.slice(2)
if (!REPORTS[name]) {
  console.error('Usage: node scripts/agent-read.mjs <' + Object.keys(REPORTS).join('|') + '> [YYYY-MM-DD]')
  process.exit(2)
}
try {
  console.log(JSON.stringify(await REPORTS[name](arg), null, 1))
} catch (e) {
  console.error('ERROR', String(e.message).split('\n').slice(-3).join(' | '))
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
