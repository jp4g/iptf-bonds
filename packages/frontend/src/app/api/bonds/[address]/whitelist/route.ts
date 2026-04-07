import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const [{ address: bondAddress }, data] = await Promise.all([params, request.json()]);
  const db = await getDb();

  await db.batch(
    [
      {
        sql: `INSERT OR REPLACE INTO address_book (bond_contract_address, holder_address, label) VALUES (?, ?, ?)`,
        args: [bondAddress, data.holderAddress, data.label ?? null],
      },
      {
        sql: `INSERT OR REPLACE INTO registered_bonds (holder_address, bond_contract_address, issuer_address, bond_name) VALUES (?, ?, ?, ?)`,
        args: [data.holderAddress, bondAddress, data.issuerAddress, data.bondName],
      },
    ],
    "write"
  );

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const [{ address: bondAddress }, data] = await Promise.all([params, request.json()]);
  const db = await getDb();

  await db.batch(
    [
      {
        sql: `DELETE FROM address_book WHERE bond_contract_address = ? AND holder_address = ?`,
        args: [bondAddress, data.holderAddress],
      },
      {
        sql: `DELETE FROM registered_bonds WHERE bond_contract_address = ? AND holder_address = ?`,
        args: [bondAddress, data.holderAddress],
      },
    ],
    "write"
  );

  return NextResponse.json({ ok: true });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address: bondAddress } = await params;
  const db = await getDb();
  const result = await db.execute({
    sql: `SELECT holder_address, label, created_at
          FROM address_book WHERE bond_contract_address = ?
          ORDER BY created_at DESC`,
    args: [bondAddress],
  });

  return NextResponse.json(result.rows);
}
