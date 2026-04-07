import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export function GET(request: NextRequest) {
  const holder = request.nextUrl.searchParams.get("holder");
  if (!holder) {
    return NextResponse.json({ error: "holder query param required" }, { status: 400 });
  }

  const db = getDb();
  const bonds = db.prepare(`
    SELECT holder_address, bond_contract_address, issuer_address, bond_name, registered_at
    FROM registered_bonds WHERE holder_address = ?
    ORDER BY registered_at DESC
  `).all(holder);

  return NextResponse.json(bonds);
}
