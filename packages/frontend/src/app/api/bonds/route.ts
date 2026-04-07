import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(request: NextRequest) {
  const data = await request.json();
  const db = await getDb();
  await db.execute({
    sql: `INSERT INTO issued_bonds (contract_address, issuer_address, name, total_supply, maturity_date, deployed_block)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [data.contractAddress, data.issuerAddress, data.name, data.totalSupply, data.maturityDate, data.deployedBlock ?? null],
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const issuer = request.nextUrl.searchParams.get("issuer");
  if (!issuer) {
    return NextResponse.json({ error: "issuer query param required" }, { status: 400 });
  }

  const db = await getDb();
  const result = await db.execute({
    sql: `SELECT contract_address, issuer_address, name, total_supply, maturity_date, deployed_block, deployed_at
          FROM issued_bonds WHERE issuer_address = ?
          ORDER BY deployed_at DESC`,
    args: [issuer],
  });

  return NextResponse.json(result.rows);
}
