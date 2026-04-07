"use client";

import RequireWallet from "@/components/layout/RequireWallet";
import IssueBondForm from "@/components/issuer/IssueBondForm";
import BondList from "@/components/issuer/BondList";

export default function IssuerPage() {
  return (
    <RequireWallet>
      <main className="flex-grow max-w-4xl mx-auto w-full px-6 py-10 space-y-10">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 mb-1">Issue Bonds</h1>
          <p className="text-sm text-neutral-500">Deploy and manage private bonds on Aztec</p>
        </div>

        <IssueBondForm />
        <BondList />
      </main>
    </RequireWallet>
  );
}
