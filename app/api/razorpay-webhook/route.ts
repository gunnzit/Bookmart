import { NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { PrismaClient } from "@prisma/client";
import { sendOrderAlert } from "@/lib/notify";
 
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
 
function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}
 
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
 
export async function POST(request: Request) {
  // 1) Raw body is required to verify the signature — do NOT parse it first.
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";
 
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET || "")
    .update(raw)
    .digest("hex");
 
  if (!signature || expected !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
 
  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: true }); // not JSON — ignore
  }
 
  // 2) Only successful captures matter here.
  if (event?.event !== "payment.captured") {
    return NextResponse.json({ ok: true });
  }
 
  const payment = event?.payload?.payment?.entity;
  const orderId: string | undefined = payment?.order_id;
  const paymentId: string | undefined = payment?.id;
  const amountPaise = Number(payment?.amount || 0);
  if (!orderId) return NextResponse.json({ ok: true });
 
  // 3) Already saved by the normal /verify flow? Nothing to do.
  const existing = await prisma.kitOrder.findFirst({ where: { razorpayOrderId: orderId } });
  if (existing) return NextResponse.json({ ok: true });
 
  // 4) The webhook can arrive before /verify finishes. Wait, then re-check.
  await sleep(5000);
  const again = await prisma.kitOrder.findFirst({ where: { razorpayOrderId: orderId } });
  if (again) return NextResponse.json({ ok: true });
 
  // 5) Still nothing. Was this a kit payment? (ignore featured-listing payments)
  let isKit = false;
  let contact = "";
  try {
    const order = await getRazorpay().orders.fetch(orderId);
    isKit = (order?.notes as any)?.type === "school_kit";
    contact = String(payment?.contact || payment?.email || "");
  } catch {
    isKit = true; // if we can't check, err on the side of alerting
  }
 
  if (isKit) {
    const rupees = Math.round(amountPaise / 100);
    await sendOrderAlert(
      [
        "\u26A0\uFE0F PAYMENT WITH NO ORDER SAVED",
        "A kit payment was captured but no order is in the database.",
        "\uD83D\uDCB0 \u20B9" + rupees,
        "\uD83C\uDD94 " + (paymentId || "unknown"),
        "\uD83D\uDD17 order " + orderId,
        contact ? "\uD83D\uDCDE " + contact : "",
        "",
        "Open Razorpay \u2192 Payments and fulfil or refund this manually.",
      ]
        .filter(Boolean)
        .join("\n")
    );
  }
 
  return NextResponse.json({ ok: true });