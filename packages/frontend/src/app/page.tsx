import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-grow flex items-center justify-center px-6">
      <div className="text-center max-w-2xl">
        <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-white text-2xl font-bold">B</span>
        </div>

        <h1 className="text-4xl font-semibold text-neutral-900 mb-4 tracking-tight">
          Private Bonds on Aztec
        </h1>

        <p className="text-lg text-neutral-500 mb-10 max-w-lg mx-auto leading-relaxed">
          Issue, distribute, and manage compliant private bonds with confidential balances and whitelist-based access control.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/issuer"
            className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
          >
            Issue Bonds
          </Link>
          <Link
            href="/holder"
            className="px-6 py-3 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
          >
            View Holdings
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-8 text-left">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">Private Balances</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Bond holdings are stored as private notes. Only the holder can view their balance.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">Whitelist Control</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Issuers control who can hold and transfer bonds via on-chain whitelisting.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">Maturity & Redemption</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Bonds can be redeemed after maturity. Block timestamps enforce maturity dates.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
