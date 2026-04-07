"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBondContract } from "@/hooks/useBondContract";
import { useToast } from "@/hooks/useToast";

export default function IssueBondForm() {
  const router = useRouter();
  const { deployBond } = useBondContract();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [totalSupply, setTotalSupply] = useState("");
  const [maturityDate, setMaturityDate] = useState("");
  const [deploying, setDeploying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !totalSupply || !maturityDate) return;

    setDeploying(true);
    try {
      const supply = BigInt(totalSupply);
      const maturity = BigInt(Math.floor(new Date(maturityDate).getTime() / 1000));

      const contractAddress = await deployBond(name, supply, maturity);
      showToast(`Bond "${name}" deployed successfully`, "success");
      router.push(`/issuer/${contractAddress}`);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to deploy bond",
        "error"
      );
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6">
      <h2 className="text-base font-semibold text-neutral-900 mb-4">Issue New Bond</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">
            Bond Name <span className="text-neutral-400">(max 31 chars)</span>
          </label>
          <input
            type="text"
            maxLength={31}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. IPTF Bond Series 1"
            className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">
              Total Supply
            </label>
            <input
              type="number"
              min="1"
              value={totalSupply}
              onChange={(e) => setTotalSupply(e.target.value)}
              placeholder="e.g. 1000000"
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">
              Maturity Date
            </label>
            <input
              type="date"
              value={maturityDate}
              onChange={(e) => setMaturityDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={deploying || !name || !totalSupply || !maturityDate}
          className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-neutral-300 text-white text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          {deploying ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Deploying...
            </>
          ) : (
            "Deploy Bond Contract"
          )}
        </button>
      </form>
    </div>
  );
}
