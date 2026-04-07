// Thin fetch wrappers for the SQLite-backed API routes

export interface IssuedBondRow {
  contract_address: string;
  issuer_address: string;
  name: string;
  total_supply: string;
  maturity_date: string;
  deployed_at: string;
}

export interface AddressBookEntry {
  holder_address: string;
  label: string | null;
  created_at: string;
}

export interface RegisteredBondRow {
  holder_address: string;
  bond_contract_address: string;
  issuer_address: string;
  bond_name: string;
  registered_at: string;
}

// --- Issued Bonds ---

export async function createIssuedBond(data: {
  contractAddress: string;
  issuerAddress: string;
  name: string;
  totalSupply: string;
  maturityDate: string;
}): Promise<void> {
  const res = await fetch("/api/bonds", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create bond");
}

export async function listIssuedBonds(issuerAddress: string): Promise<IssuedBondRow[]> {
  const res = await fetch(`/api/bonds?issuer=${encodeURIComponent(issuerAddress)}`);
  if (!res.ok) throw new Error("Failed to list bonds");
  return res.json();
}

export async function getIssuedBond(contractAddress: string): Promise<IssuedBondRow> {
  const res = await fetch(`/api/bonds/${encodeURIComponent(contractAddress)}`);
  if (!res.ok) throw new Error("Failed to get bond");
  return res.json();
}

// --- Whitelist / Address Book ---

export async function addToWhitelist(data: {
  bondAddress: string;
  holderAddress: string;
  label?: string;
  issuerAddress: string;
  bondName: string;
}): Promise<void> {
  const res = await fetch(`/api/bonds/${encodeURIComponent(data.bondAddress)}/whitelist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      holderAddress: data.holderAddress,
      label: data.label,
      issuerAddress: data.issuerAddress,
      bondName: data.bondName,
    }),
  });
  if (!res.ok) throw new Error("Failed to add to whitelist");
}

export async function removeFromWhitelist(bondAddress: string, holderAddress: string): Promise<void> {
  const res = await fetch(`/api/bonds/${encodeURIComponent(bondAddress)}/whitelist`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ holderAddress }),
  });
  if (!res.ok) throw new Error("Failed to remove from whitelist");
}

export async function listWhitelist(bondAddress: string): Promise<AddressBookEntry[]> {
  const res = await fetch(`/api/bonds/${encodeURIComponent(bondAddress)}/whitelist`);
  if (!res.ok) throw new Error("Failed to list whitelist");
  return res.json();
}

// --- Registered Bonds (holder perspective) ---

export async function listRegisteredBonds(holderAddress: string): Promise<RegisteredBondRow[]> {
  const res = await fetch(`/api/registered-bonds?holder=${encodeURIComponent(holderAddress)}`);
  if (!res.ok) throw new Error("Failed to list registered bonds");
  return res.json();
}
