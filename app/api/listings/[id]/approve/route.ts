import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function GET(request: Request, context: any) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    if (action !== 'approve' && action !== 'reject') {
      return new Response('Invalid action', { status: 400 })
    }
    const listing = await prisma.listing.update({
      where: { id },
      data: { status: action === 'approve' ? 'active' : 'rejected' },
      include: { seller: true },
    })
    const isApprove = action === 'approve'
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${isApprove ? 'Approved' : 'Rejected'}</title><style>body{font-family:sans-serif;background:#f7f6f3;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.card{background:#fff;border-radius:16px;padding:40px;text-align:center;max-width:400px;box-shadow:0 4px 24px rgba(0,0,0,.08)}h1{color:${isApprove ? '#1D9E75' : '#E24B4A'}}a{display:inline-block;margin-top:20px;background:#1B2A4A;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none}</style></head><body><div class="card"><h1>${isApprove ? '✅ Approved!' : '❌ Rejected'}</h1><p>${listing.title}</p><p>₹${listing.price} · ${listing.location}</p><a href="https://buddybooks.in/admin">Admin Panel</a></div></body></html>`
    return new Response(html, { headers: { 'Content-Type': 'text/html' } })
  } catch (error) {
    return new Response('Error: ' + String(error), { status: 500 })
  }
}