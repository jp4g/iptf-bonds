import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  const db = getDb();
  const bond = db.prepare(`
    SELECT contract_address, issuer_address, name, total_supply, maturity_date, deployed_at
    FROM issued_bonds WHERE contract_address = ?
  `).get(address);

  if (!bond) {
    return NextResponse.json({ error: "Bond not found" }, { status: 404 });
  }
  return NextResponse.json(bond);
}
