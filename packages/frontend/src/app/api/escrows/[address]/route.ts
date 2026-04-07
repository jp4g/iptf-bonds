import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const [{ address: escrowAddress }, data] = await Promise.all([params, request.json()]);
  const db = await getDb();

  const result = await db.execute({
    sql: `UPDATE escrow_orders SET status = ? WHERE escrow_address = ? AND status = 'open'`,
    args: [data.status, escrowAddress],
  });

  if (result.rowsAffected === 0) {
    return NextResponse.json({ error: "Order not found or already filled" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
