/**
 * localStorage helpers for persisting Aztec account and bond data.
 */

const ACCOUNTS_KEY = "iptf-bonds-aztec-accounts";
const ACTIVE_ACCOUNT_KEY = "iptf-bonds-aztec-active-account";

export interface StoredAccount {
  address: string;
  signingKey: string;
  secretKey: string;
  salt: string;
}

export function loadStoredAccounts(): StoredAccount[] {
  const raw = localStorage.getItem(ACCOUNTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as StoredAccount[];
  } catch {
    return [];
  }
}

export function saveStoredAccounts(accounts: StoredAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function getStoredActiveAddress(): string | null {
  return localStorage.getItem(ACTIVE_ACCOUNT_KEY);
}

export function setStoredActiveAddress(address: string) {
  localStorage.setItem(ACTIVE_ACCOUNT_KEY, address);
}

export function removeStoredActiveAddress() {
  localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
}

export function clearAllStoredAccounts() {
  localStorage.removeItem(ACCOUNTS_KEY);
  localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
}

// --- Chain identity (detect redeployments) ---

const CHAIN_ID_KEY = "iptf-bonds-chain-id";

export function getStoredChainId(): string | null {
  return localStorage.getItem(CHAIN_ID_KEY);
}

export function setStoredChainId(id: string) {
  localStorage.setItem(CHAIN_ID_KEY, id);
}

export function clearAllStoredData() {
  localStorage.removeItem(ACCOUNTS_KEY);
  localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
  localStorage.removeItem(CHAIN_ID_KEY);
  localStorage.removeItem(ISSUED_BONDS_KEY);
  localStorage.removeItem(REGISTERED_BONDS_KEY);
}

// --- Issued Bonds (issuer perspective) ---

const ISSUED_BONDS_KEY = "iptf-bonds-issued";

export interface IssuedBond {
  contractAddress: string;
  name: string;
  totalSupply: string;
  maturityDate: string;
  deployedAt: string;
}

export function loadIssuedBonds(): IssuedBond[] {
  const raw = localStorage.getItem(ISSUED_BONDS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as IssuedBond[];
  } catch {
    return [];
  }
}

export function saveIssuedBond(bond: IssuedBond) {
  const existing = loadIssuedBonds();
  existing.push(bond);
  localStorage.setItem(ISSUED_BONDS_KEY, JSON.stringify(existing));
}

// --- Registered Bonds (holder perspective) ---

const REGISTERED_BONDS_KEY = "iptf-bonds-registered";

export interface RegisteredBond {
  contractAddress: string;
  issuerAddress: string;
  bondName: string;
  registeredAt: string;
}

export function loadRegisteredBonds(): RegisteredBond[] {
  const raw = localStorage.getItem(REGISTERED_BONDS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as RegisteredBond[];
  } catch {
    return [];
  }
}

export function saveRegisteredBond(bond: RegisteredBond) {
  const existing = loadRegisteredBonds();
  if (existing.some(b => b.contractAddress === bond.contractAddress)) return;
  existing.push(bond);
  localStorage.setItem(REGISTERED_BONDS_KEY, JSON.stringify(existing));
}
