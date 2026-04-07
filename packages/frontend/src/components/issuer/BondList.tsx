"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { loadIssuedBonds, type IssuedBond } from "@/lib/storage";
import { truncateAddress, encodeBondCode, formatMaturityDate } from "@/lib/bond-utils";
import { useAztecWallet } from "@/hooks/useAztecWallet";
import { useToast } from "@/hooks/useToast";

export default function BondList() {
  const { address } = useAztecWallet();
  const { showToast } = useToast();
  const [bonds, setBonds] = useState<IssuedBond[]>([]);

  useEffect(() => {
    setBonds(loadIssuedBonds());
  }, []);

  const copyBondCode = async (bond: IssuedBond) => {
    const code = encodeBondCode({
      contractAddress: bond.contractAddress,
      issuerAddress: address!,
      bondName: bond.name,
    });
    await navigator.clipboard.writeText(code);
    showToast("Bond code copied to clipboard", "success");
  };

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
            key={bond.contractAddress}
            href={`/issuer/${bond.contractAddress}`}
            className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900">{bond.name}</p>
              <p className="text-xs font-mono text-neutral-400 truncate">
                {truncateAddress(bond.contractAddress, 10, 6)}
              </p>
            </div>
            <div className="text-right mr-4">
              <p className="text-sm text-neutral-700">{Number(bond.totalSupply).toLocaleString()}</p>
              <p className="text-xs text-neutral-400">{formatMaturityDate(BigInt(bond.maturityDate))}</p>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                copyBondCode(bond);
              }}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md hover:bg-neutral-200 text-neutral-400 hover:text-neutral-600 transition-colors"
              title="Copy Bond Code"
            >
              <Icon icon="solar:copy-linear" width={16} />
            </button>
          </Link>
        ))}
      </div>
    </div>
  );
}
