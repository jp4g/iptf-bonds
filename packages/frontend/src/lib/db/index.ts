import { mkdir } from "node:fs/promises";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";

let client: Client | null = null;
let initialized = false;

export async function getDb(): Promise<Client> {
  if (client && initialized) return client;

  if (!client) {
    const configuredDatabaseUrl = process.env.TURSO_DATABASE_URL?.trim();
    const configuredAuthToken = process.env.TURSO_AUTH_TOKEN?.trim();
    const databaseUrlIsConfigured = configuredDatabaseUrl !== undefined && configuredDatabaseUrl !== "";

    if (databaseUrlIsConfigured) {
      const databaseUsesRemoteTurso =
        configuredDatabaseUrl.startsWith("libsql://") || configuredDatabaseUrl.startsWith("https://");
      const authTokenIsConfigured = configuredAuthToken !== undefined && configuredAuthToken !== "";

      if (databaseUsesRemoteTurso && !authTokenIsConfigured) {
        throw new Error("TURSO_AUTH_TOKEN is not set");
      }

      client = createClient({
        url: configuredDatabaseUrl,
        authToken: authTokenIsConfigured ? configuredAuthToken : undefined,
      });
    } else {
      const isProductionEnvironment = process.env.NODE_ENV === "production";
      if (isProductionEnvironment) {
        throw new Error("TURSO_DATABASE_URL is not set");
      }

      const localDatabaseDirectory = path.join(process.cwd(), "data");
      const localDatabasePath = path.join(localDatabaseDirectory, "iptf-bonds.db");

      await mkdir(localDatabaseDirectory, { recursive: true });

      // Local development can persist to a SQLite file without Turso credentials.
      client = createClient({ url: `file:${localDatabasePath}` });
    }
  }

  if (!initialized) {
    await client.batch(
      [
        {
          sql: `CREATE TABLE IF NOT EXISTS issued_bonds (
            contract_address TEXT PRIMARY KEY,
            issuer_address   TEXT NOT NULL,
            name             TEXT NOT NULL,
            total_supply     TEXT NOT NULL,
            maturity_date    TEXT NOT NULL,
            deployed_block   INTEGER,
            deployed_at      TEXT NOT NULL DEFAULT (datetime('now'))
          )`,
          args: [],
        },
        {
          sql: `CREATE TABLE IF NOT EXISTS address_book (
            bond_contract_address TEXT NOT NULL REFERENCES issued_bonds(contract_address),
            holder_address        TEXT NOT NULL,
            label                 TEXT,
            created_at            TEXT NOT NULL DEFAULT (datetime('now')),
            PRIMARY KEY (bond_contract_address, holder_address)
          )`,
          args: [],
        },
        {
          sql: `CREATE TABLE IF NOT EXISTS registered_bonds (
            holder_address        TEXT NOT NULL,
            bond_contract_address TEXT NOT NULL,
            issuer_address        TEXT NOT NULL,
            bond_name             TEXT NOT NULL,
            registered_at         TEXT NOT NULL DEFAULT (datetime('now')),
            PRIMARY KEY (holder_address, bond_contract_address)
          )`,
          args: [],
        },
        {
          sql: `CREATE INDEX IF NOT EXISTS idx_registered_bonds_holder ON registered_bonds(holder_address)`,
          args: [],
        },
        {
          sql: `CREATE INDEX IF NOT EXISTS idx_address_book_bond ON address_book(bond_contract_address)`,
          args: [],
        },
        {
          sql: `CREATE TABLE IF NOT EXISTS escrow_orders (
            escrow_address         TEXT PRIMARY KEY,
            bond_contract_address  TEXT NOT NULL REFERENCES issued_bonds(contract_address),
            seller_address         TEXT NOT NULL,
            bond_amount            TEXT NOT NULL,
            payment_amount         TEXT NOT NULL,
            secret_key             TEXT NOT NULL,
            status                 TEXT NOT NULL DEFAULT 'open',
            created_at             TEXT NOT NULL DEFAULT (datetime('now'))
          )`,
          args: [],
        },
        {
          sql: `CREATE INDEX IF NOT EXISTS idx_escrow_orders_bond ON escrow_orders(bond_contract_address)`,
          args: [],
        },
        {
          sql: `CREATE INDEX IF NOT EXISTS idx_escrow_orders_seller ON escrow_orders(seller_address)`,
          args: [],
        },
      ],
      "write"
    );

    // Migrate: add deployed_block column if missing (idempotent)
    try {
      await client.execute({
        sql: `ALTER TABLE issued_bonds ADD COLUMN deployed_block INTEGER`,
        args: [],
      });
    } catch {
      // Column already exists — ignore
    }

    initialized = true;
  }

  return client;
}
