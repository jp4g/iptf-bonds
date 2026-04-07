import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const [{ address: bondAddress }, data] = await Promise.all([params, request.json()]);
  const db = getDb();

  const addToBook = db.prepare(`
    INSERT OR REPLACE INTO address_book (bond_contract_address, holder_address, label)
    VALUES (?, ?, ?)
  `);
  const addToRegistered = db.prepare(`
    INSERT OR REPLACE INTO registered_bonds (holder_address, bond_contract_address, issuer_address, bond_name)
    VALUES (?, ?, ?, ?)
  `);

  db.transaction(() => {
    addToBook.run(bondAddress, data.holderAddress, data.label ?? null);
    addToRegistered.run(data.holderAddress, bondAddress, data.issuerAddress, data.bondName);
  })();

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const [{ address: bondAddress }, data] = await Promise.all([params, request.json()]);
  const db = getDb();

  const removeFromBook = db.prepare(`
    DELETE FROM address_book WHERE bond_contract_address = ? AND holder_address = ?
  `);
  const removeFromRegistered = db.prepare(`
    DELETE FROM registered_bonds WHERE bond_contract_address = ? AND holder_address = ?
  `);

  db.transaction(() => {
    removeFromBook.run(bondAddress, data.holderAddress);
    removeFromRegistered.run(bondAddress, data.holderAddress);
  })();

  return NextResponse.json({ ok: true });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address: bondAddress } = await params;
  const db = getDb();
  const entries = db.prepare(`
    SELECT holder_address, label, created_at
    FROM address_book WHERE bond_contract_address = ?
    ORDER BY created_at DESC
  `).all(bondAddress);

  return NextResponse.json(entries);
}
