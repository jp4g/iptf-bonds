import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "iptf-bonds.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  // Ensure data directory exists
  const fs = require("fs");
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Initialize schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS issued_bonds (
      contract_address TEXT PRIMARY KEY,
      issuer_address   TEXT NOT NULL,
      name             TEXT NOT NULL,
      total_supply     TEXT NOT NULL,
      maturity_date    TEXT NOT NULL,
      deployed_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS address_book (
      bond_contract_address TEXT NOT NULL REFERENCES issued_bonds(contract_address),
      holder_address        TEXT NOT NULL,
      label                 TEXT,
      created_at            TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (bond_contract_address, holder_address)
    );

    CREATE TABLE IF NOT EXISTS registered_bonds (
      holder_address        TEXT NOT NULL,
      bond_contract_address TEXT NOT NULL,
      issuer_address        TEXT NOT NULL,
      bond_name             TEXT NOT NULL,
      registered_at         TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (holder_address, bond_contract_address)
    );

    CREATE INDEX IF NOT EXISTS idx_registered_bonds_holder ON registered_bonds(holder_address);
    CREATE INDEX IF NOT EXISTS idx_address_book_bond ON address_book(bond_contract_address);
  `);

  return db;
}
