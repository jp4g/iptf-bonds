"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listIssuedBonds, type IssuedBondRow } from "@/lib/api";
import { truncateAddress, formatMaturityDate } from "@/lib/bond-utils";
import { useAztecWallet } from "@/hooks/useAztecWallet";

export default function BondList() {
  const { address } = useAztecWallet();
  const [bonds, setBonds] = useState<IssuedBondRow[]>([]);

  useEffect(() => {
    if (!address) return;
    listIssuedBonds(address).then(setBonds).catch(console.error);
  }, [address]);

  if (bonds.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-6 text-center">
        <p className="text-sm text-neutral-500">No bonds issued yet. Deploy your first bond above.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200">
      <div className="p-4 border-b border-neutral-100">
        <h2 className="text-base font-semibold text-neutral-900">My Issued Bonds</h2>
      </div>
      <div className="divide-y divide-neutral-100">
        {bonds.map((bond) => (
          <Link
            key={bond.contract_address}
            href={`/issuer/${bond.contract_address}`}
            className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900">{bond.name}</p>
              <p className="text-xs font-mono text-neutral-400 truncate">
                {truncateAddress(bond.contract_address, 10, 6)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-neutral-700">{Number(bond.total_supply).toLocaleString()}</p>
              <p className="text-xs text-neutral-400">{formatMaturityDate(BigInt(bond.maturity_date))}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
