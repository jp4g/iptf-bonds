// Display helpers
export function truncateAddress(address: string, prefix = 6, suffix = 4): string {
  if (address.length <= prefix + suffix + 3) return address;
  return `${address.slice(0, prefix)}...${address.slice(-suffix)}`;
}

export function formatMaturityDate(unixTimestamp: bigint): string {
  const date = new Date(Number(unixTimestamp) * 1000);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getTimeRemaining(
  currentBlockTime: bigint,
  maturityUnix: bigint
): { expired: boolean; display: string } {
  if (currentBlockTime >= maturityUnix) {
    return { expired: true, display: "Matured" };
  }

  const remaining = Number(maturityUnix - currentBlockTime);
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);

  if (days > 0) {
    return { expired: false, display: `${days}d ${hours}h remaining` };
  }
  const minutes = Math.floor((remaining % 3600) / 60);
  return { expired: false, display: `${hours}h ${minutes}m remaining` };
}

// Name encoding/decoding for Field storage
export function encodeNameToField(name: string): bigint {
  const bytes = new TextEncoder().encode(name.slice(0, 31));
  let value = 0n;
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8n) | BigInt(bytes[i]);
  }
  return value;
}

export function decodeNameFromField(field: bigint | string): string {
  const value = typeof field === "string" ? BigInt(field) : field;
  if (value === 0n) return "";
  const bytes: number[] = [];
  let v = value;
  while (v > 0n) {
    bytes.unshift(Number(v & 0xffn));
    v >>= 8n;
  }
  return new TextDecoder().decode(new Uint8Array(bytes)).replace(/\0+$/, "");
}
