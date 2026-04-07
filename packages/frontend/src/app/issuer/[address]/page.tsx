"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import RequireWallet from "@/components/layout/RequireWallet";
import TabBar from "@/components/ui/TabBar";
import WhitelistTab from "@/components/issuer/WhitelistTab";
import DistributeTab from "@/components/issuer/DistributeTab";
import HoldersTab from "@/components/issuer/HoldersTab";
import TransfersTab from "@/components/issuer/TransfersTab";
import { useBondContract } from "@/hooks/useBondContract";
import { truncateAddress } from "@/lib/bond-utils";

const TABS = [
  { key: "whitelist", label: "Whitelist" },
  { key: "distribute", label: "Distribute" },
  { key: "holders", label: "Holders" },
  { key: "transfers", label: "Transfers" },
];

export default function ManageBondPage() {
  const params = useParams();
  const bondAddress = params.address as string;
  const { getBondInfo } = useBondContract();

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

  return (
    <RequireWallet>
      <main className="flex-grow max-w-4xl mx-auto w-full px-6 py-10 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            {loading ? "Loading..." : bondName}
          </h1>
          <p className="text-xs font-mono text-neutral-400 mt-1">
            {truncateAddress(bondAddress, 10, 8)}
          </p>
        </div>

        {/* Tabs */}
        <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

        {/* Tab content */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          {activeTab === "whitelist" && <WhitelistTab bondAddress={bondAddress} bondName={bondName ?? "Bond"} />}
          {activeTab === "distribute" && <DistributeTab bondAddress={bondAddress} />}
          {activeTab === "holders" && <HoldersTab bondAddress={bondAddress} />}
          {activeTab === "transfers" && <TransfersTab bondAddress={bondAddress} />}
        </div>
      </main>
    </RequireWallet>
  );
}
