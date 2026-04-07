"use client";

import { useEffect, useState } from "react";
import { loadRegisteredBonds, type RegisteredBond } from "@/lib/storage";
import BondCard from "./BondCard";

export default function HoldingsList() {
  const [bonds, setBonds] = useState<RegisteredBond[]>([]);

  const refresh = () => setBonds(loadRegisteredBonds());

  useEffect(() => {
    refresh();
    window.addEventListener("bonds-updated", refresh);
    return () => window.removeEventListener("bonds-updated", refresh);
  }, []);

  if (bonds.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-6 text-center">
        <p className="text-sm text-neutral-500">No bonds registered. Add a bond using the form above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-neutral-900">My Bond Holdings</h2>
      <div className="grid gap-4">
        {bonds.map((bond) => (
          <BondCard key={bond.contractAddress} bond={bond} />
        ))}
      </div>
    </div>
  );
}
