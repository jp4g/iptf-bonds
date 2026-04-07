"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import RequireWallet from "@/components/layout/RequireWallet";
import TabBar from "@/components/ui/TabBar";
import WhitelistTab from "@/components/issuer/WhitelistTab";
import DistributeTab from "@/components/issuer/DistributeTab";
import HoldersTab from "@/components/issuer/HoldersTab";
import TransfersTab from "@/components/issuer/TransfersTab";
import { useBondContract } from "@/hooks/useBondContract";
import { useAztecWallet } from "@/hooks/useAztecWallet";
import { useToast } from "@/hooks/useToast";
import { truncateAddress, encodeBondCode } from "@/lib/bond-utils";

const TABS = [
  { key: "whitelist", label: "Whitelist" },
  { key: "distribute", label: "Distribute" },
  { key: "holders", label: "Holders" },
  { key: "transfers", label: "Transfers" },
];

export default function ManageBondPage() {
  const params = useParams();
  const bondAddress = params.address as string;
  const { address } = useAztecWallet();
  const { getBondInfo } = useBondContract();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState("whitelist");
  const [bondName, setBondName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bondAddress) return;
    getBondInfo(bondAddress)
      .then((info) => {
        setBondName(info.name || "Unnamed Bond");
      })
      .catch(() => {
        setBondName("Bond");
      })
      .finally(() => setLoading(false));
  }, [bondAddress, getBondInfo]);

  const copyBondCode = async () => {
    const code = encodeBondCode({
      contractAddress: bondAddress,
      issuerAddress: address!,
      bondName: bondName ?? "Bond",
    });
    await navigator.clipboard.writeText(code);
    showToast("Bond code copied to clipboard", "success");
  };

  return (
    <RequireWallet>
      <main className="flex-grow max-w-4xl mx-auto w-full px-6 py-10 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">
              {loading ? "Loading..." : bondName}
            </h1>
            <p className="text-xs font-mono text-neutral-400 mt-1">
              {truncateAddress(bondAddress, 10, 8)}
            </p>
          </div>
          <button
            onClick={copyBondCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            <Icon icon="solar:copy-linear" width={14} />
            Copy Bond Code
          </button>
        </div>

        {/* Tabs */}
        <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

        {/* Tab content */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          {activeTab === "whitelist" && <WhitelistTab bondAddress={bondAddress} />}
          {activeTab === "distribute" && <DistributeTab bondAddress={bondAddress} />}
          {activeTab === "holders" && <HoldersTab bondAddress={bondAddress} />}
          {activeTab === "transfers" && <TransfersTab bondAddress={bondAddress} />}
        </div>
      </main>
    </RequireWallet>
  );
}
