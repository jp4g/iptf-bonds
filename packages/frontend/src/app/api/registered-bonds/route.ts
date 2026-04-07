import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  const holder = request.nextUrl.searchParams.get("holder");
  if (!holder) {
    return NextResponse.json({ error: "holder query param required" }, { status: 400 });
  }

  const db = await getDb();
  const result = await db.execute({
    sql: `SELECT holder_address, bond_contract_address, issuer_address, bond_name, registered_at
          FROM registered_bonds WHERE holder_address = ?
          ORDER BY registered_at DESC`,
    args: [holder],
  });

  return NextResponse.json(result.rows);
}
