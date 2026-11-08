import { prisma } from '@/lib/chat'
import { readBill } from '@/lib/bill-reader'

// Reads a bill's photos with AI and stores the result on the bill for checking.
// Used when a bill is uploaded and by "Read again". Never touches a bill already added to stock.
export async function readAndStore(billId: string, images: { mime: string; base64: string }[]) {
  try {
    const read = await readBill(images)
    const billDate = read.billDate ? new Date(read.billDate + 'T00:00:00+05:30') : null
    await prisma.$transaction([
      prisma.stockBillLine.deleteMany({ where: { billId, bill: { status: { not: 'added' } } } }),
      prisma.stockBill.updateMany({
        where: { id: billId, status: { not: 'added' } },
        data: {
          status: 'check',
          readError: null,
          supplierName: read.supplierName,
          gstin: read.gstin,
          billNo: read.billNo,
          billDate,
          dueDate: billDate ? new Date(billDate.getTime() + 30 * 86400000) : null,
          total: read.total,
        },
      }),
      prisma.stockBillLine.createMany({ data: read.lines.map((l, i) => ({ ...l, position: i, billId })) }),
    ])
    return { ok: true as const }
  } catch (e: any) {
    const code = e?.message || 'read_failed'
    await prisma.stockBill.updateMany({ where: { id: billId, status: { not: 'added' } }, data: { status: 'check', readError: code } })
    return { ok: false as const, error: code }
  }
}
