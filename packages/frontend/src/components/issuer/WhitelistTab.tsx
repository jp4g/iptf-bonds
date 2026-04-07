"use client";

import { useState } from "react";
import { useBondContract } from "@/hooks/useBondContract";
import { useToast } from "@/hooks/useToast";

interface WhitelistTabProps {
  bondAddress: string;
}

export default function WhitelistTab({ bondAddress }: WhitelistTabProps) {
  const { whitelist, ban, checkWhitelist } = useBondContract();
  const { showToast } = useToast();

  const [addAddress, setAddAddress] = useState("");
  const [checkAddress, setCheckAddress] = useState("");
  const [checkResult, setCheckResult] = useState<boolean | null>(null);
  const [adding, setAdding] = useState(false);
  const [banning, setBanning] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleAdd = async () => {
    if (!addAddress) return;
    setAdding(true);
    try {
      await whitelist(bondAddress, addAddress);
      showToast("Address whitelisted", "success");
      setAddAddress("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to whitelist", "error");
    } finally {
      setAdding(false);
    }
  };

  const handleBan = async () => {
    if (!addAddress) return;
    setBanning(true);
    try {
      await ban(bondAddress, addAddress);
      showToast("Address banned", "success");
      setAddAddress("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to ban", "error");
    } finally {
      setBanning(false);
    }
  };

  const handleCheck = async () => {
    if (!checkAddress) return;
    setChecking(true);
    try {
      const result = await checkWhitelist(bondAddress, checkAddress);
      setCheckResult(result);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to check", "error");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add / Ban */}
      <div>
        <h3 className="text-sm font-medium text-neutral-700 mb-2">Manage Whitelist</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={addAddress}
            onChange={(e) => setAddAddress(e.target.value)}
            placeholder="Aztec address (0x...)"
            className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
          <button
            onClick={handleAdd}
            disabled={adding || !addAddress}
            className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:bg-neutral-300 text-white text-sm font-medium transition-colors cursor-pointer"
          >
            {adding ? "Adding..." : "Whitelist"}
          </button>
          <button
            onClick={handleBan}
            disabled={banning || !addAddress}
            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 disabled:bg-neutral-300 text-white text-sm font-medium transition-colors cursor-pointer"
          >
            {banning ? "Banning..." : "Ban"}
          </button>
        </div>
      </div>

      {/* Check Status */}
      <div>
        <h3 className="text-sm font-medium text-neutral-700 mb-2">Check Status</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={checkAddress}
            onChange={(e) => {
              setCheckAddress(e.target.value);
              setCheckResult(null);
            }}
            placeholder="Aztec address (0x...)"
            className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
          <button
            onClick={handleCheck}
            disabled={checking || !checkAddress}
            className="px-4 py-2 rounded-lg border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            {checking ? "Checking..." : "Check"}
          </button>
        </div>
        {checkResult !== null && (
          <div className={`mt-2 px-3 py-2 rounded-lg text-sm ${
            checkResult
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            {checkResult ? "Whitelisted" : "Not whitelisted"}
          </div>
        )}
      </div>
    </div>
  );
}
