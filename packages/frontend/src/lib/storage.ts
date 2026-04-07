/**
 * localStorage helpers for persisting Aztec wallet account data.
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
}
