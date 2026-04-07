import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(request: NextRequest) {
  const data = await request.json();
  const db = await getDb();

  await db.execute({
    sql: `INSERT INTO escrow_orders (escrow_address, bond_contract_address, seller_address, bond_amount, payment_amount, secret_key)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      data.escrowAddress,
      data.bondContractAddress,
      data.sellerAddress,
      data.bondAmount,
      data.paymentAmount,
      data.secretKey,
    ],
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bond = searchParams.get("bond");
  if (!bond) {
    return NextResponse.json({ error: "bond query param required" }, { status: 400 });
  }

  const seller = searchParams.get("seller");
  const status = searchParams.get("status") ?? "open";

  const db = await getDb();

  let sql = "SELECT * FROM escrow_orders WHERE bond_contract_address = ?";
  const args: string[] = [bond];

  if (seller) {
    sql += " AND seller_address = ?";
    args.push(seller);
  }

  if (status !== "all") {
    sql += " AND status = ?";
    args.push(status);
  }

  sql += " ORDER BY created_at DESC";

  const result = await db.execute({ sql, args });
  return NextResponse.json(result.rows);
}
