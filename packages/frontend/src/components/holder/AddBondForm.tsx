"use client";

import { useState } from "react";
import { useBondContract } from "@/hooks/useBondContract";
import { useToast } from "@/hooks/useToast";
import { decodeBondCode } from "@/lib/bond-utils";
import { saveRegisteredBond } from "@/lib/storage";

export default function AddBondForm() {
  const { registerBond } = useBondContract();
  const { showToast } = useToast();

  const [bondCode, setBondCode] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!bondCode.trim()) return;
    setAdding(true);

    try {
      const decoded = decodeBondCode(bondCode.trim());
      await registerBond(decoded.contractAddress, decoded.issuerAddress);

      saveRegisteredBond({
        contractAddress: decoded.contractAddress,
        issuerAddress: decoded.issuerAddress,
        bondName: decoded.bondName,
        registeredAt: new Date().toISOString(),
      });

      showToast(`Bond "${decoded.bondName}" added`, "success");
      setBondCode("");

      // Trigger a re-render of the holdings list
      window.dispatchEvent(new Event("bonds-updated"));
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to add bond",
        "error"
      );
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6">
      <h2 className="text-base font-semibold text-neutral-900 mb-4">Add Bond</h2>
      <p className="text-xs text-neutral-500 mb-3">
        Paste the bond code from your issuer to register a bond in your wallet.
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={bondCode}
          onChange={(e) => setBondCode(e.target.value)}
          placeholder="Paste bond code here..."
          className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          disabled={adding}
        />
        <button
          onClick={handleAdd}
          disabled={adding || !bondCode.trim()}
          className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:bg-neutral-300 text-white text-sm font-medium transition-colors cursor-pointer"
        >
          {adding ? "Adding..." : "Add Bond"}
        </button>
      </div>
    </div>
  );
}
