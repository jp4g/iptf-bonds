import { existsSync, mkdirSync } from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";

const DB_PATH = path.join(process.cwd(), "data", "iptf-bonds.db");

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (db !== null) {
    return db;
  }

  const dataDirectory = path.dirname(DB_PATH);
  const dataDirectoryIsMissing = !existsSync(dataDirectory);
  if (dataDirectoryIsMissing) {
    mkdirSync(dataDirectory, { recursive: true });
  }

  const database = new DatabaseSync(DB_PATH);
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

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

  db = database;
  return database;
}

export function runInTransaction(work: () => void): void {
  const database = getDb();

  database.exec("BEGIN");

  try {
    work();
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}
