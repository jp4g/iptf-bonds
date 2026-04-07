"use client";

import { Icon } from "@iconify/react";
import { useBondEvents } from "@/hooks/useBondEvents";
import { truncateAddress } from "@/lib/bond-utils";

interface HoldersTabProps {
  bondAddress: string;
}

export default function HoldersTab({ bondAddress }: HoldersTabProps) {
  const { holderBalances, loading, fetchEvents } = useBondEvents();

  const holders = Array.from(holderBalances.entries());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-700">Bond Holders</h3>
        <button
          onClick={() => fetchEvents(bondAddress)}
          disabled={loading}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors cursor-pointer"
        >
          <Icon icon="solar:refresh-linear" width={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {holders.length === 0 ? (
        <p className="text-sm text-neutral-500 text-center py-4">
          {loading ? "Loading..." : "No holder data. Click Refresh to fetch events."}
        </p>
      ) : (
        <div className="rounded-lg border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-medium text-neutral-500">Address</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-neutral-500">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {holders.map(([addr, balance]) => (
                <tr key={addr}>
                  <td className="px-4 py-2 font-mono text-xs text-neutral-600">
                    {truncateAddress(addr, 10, 6)}
                  </td>
                  <td className="px-4 py-2 text-right text-neutral-700">
                    {balance.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
