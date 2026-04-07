import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(request: NextRequest) {
  const data = await request.json();
  const db = getDb();
  db.prepare(`
    INSERT INTO issued_bonds (contract_address, issuer_address, name, total_supply, maturity_date)
    VALUES (?, ?, ?, ?, ?)
  `).run(data.contractAddress, data.issuerAddress, data.name, data.totalSupply, data.maturityDate);

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const issuer = request.nextUrl.searchParams.get("issuer");
  if (!issuer) {
    return NextResponse.json({ error: "issuer query param required" }, { status: 400 });
  }

  const db = getDb();
  const bonds = db.prepare(`
    SELECT contract_address, issuer_address, name, total_supply, maturity_date, deployed_at
    FROM issued_bonds WHERE issuer_address = ?
    ORDER BY deployed_at DESC
  `).all(issuer);

  return NextResponse.json(bonds);
}
