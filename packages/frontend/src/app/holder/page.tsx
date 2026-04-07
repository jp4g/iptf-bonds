"use client";

import RequireWallet from "@/components/layout/RequireWallet";
import AddBondForm from "@/components/holder/AddBondForm";
import HoldingsList from "@/components/holder/HoldingsList";

export default function HolderPage() {
  return (
    <RequireWallet>
      <main className="flex-grow max-w-4xl mx-auto w-full px-6 py-10 space-y-10">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 mb-1">My Holdings</h1>
          <p className="text-sm text-neutral-500">View and manage your bond holdings</p>
        </div>

        <AddBondForm />
        <HoldingsList />
      </main>
    </RequireWallet>
  );
}
