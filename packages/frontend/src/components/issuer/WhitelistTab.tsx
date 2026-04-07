"use client";

import { useState, useEffect } from "react";
import { useBondContract } from "@/hooks/useBondContract";
import { useToast } from "@/hooks/useToast";
import { listWhitelist, type AddressBookEntry } from "@/lib/api";
import { truncateAddress } from "@/lib/bond-utils";

interface WhitelistTabProps {
  bondAddress: string;
  bondName: string;
}

export default function WhitelistTab({ bondAddress, bondName }: WhitelistTabProps) {
  const { whitelist, ban, checkWhitelist } = useBondContract();
  const { showToast } = useToast();

  const [addAddress, setAddAddress] = useState("");
  const [label, setLabel] = useState("");
  const [checkAddress, setCheckAddress] = useState("");
  const [checkResult, setCheckResult] = useState<boolean | null>(null);
  const [adding, setAdding] = useState(false);
  const [banning, setBanning] = useState(false);
  const [checking, setChecking] = useState(false);
  const [entries, setEntries] = useState<AddressBookEntry[]>([]);

  const refreshEntries = () => {
    listWhitelist(bondAddress).then(setEntries).catch(console.error);
  };

  useEffect(() => {
    refreshEntries();
  }, [bondAddress]);

  const handleAdd = async () => {
    if (!addAddress) return;
    setAdding(true);
    try {
      await whitelist(bondAddress, addAddress, { label: label || undefined, bondName });
      showToast("Address whitelisted", "success");
      setAddAddress("");
      setLabel("");
      refreshEntries();
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
      refreshEntries();
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
        <div className="flex gap-2 mb-2">
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
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (optional, e.g. &quot;Fund A&quot;)"
          className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
        />
      </div>

      {/* Address Book */}
      {entries.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-2">Address Book</h3>
          <div className="border border-neutral-200 rounded-lg divide-y divide-neutral-100">
            {entries.map((entry) => (
              <div key={entry.holder_address} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-mono text-neutral-900 truncate">
                    {truncateAddress(entry.holder_address, 10, 6)}
                  </p>
                  {entry.label && (
                    <p className="text-xs text-neutral-500">{entry.label}</p>
                  )}
                </div>
                <p className="text-xs text-neutral-400 shrink-0 ml-4">
                  {new Date(entry.created_at + "Z").toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

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
