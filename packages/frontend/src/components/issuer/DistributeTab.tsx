"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { useBondContract } from "@/hooks/useBondContract";
import { useToast } from "@/hooks/useToast";
import ProgressBar from "@/components/ui/ProgressBar";

interface Distribution {
  address: string;
  amount: string;
}

interface DistributeTabProps {
  bondAddress: string;
}

export default function DistributeTab({ bondAddress }: DistributeTabProps) {
  const { batchDistribute } = useBondContract();
  const { showToast } = useToast();

  const [rows, setRows] = useState<Distribution[]>([{ address: "", amount: "" }]);
  const [distributing, setDistributing] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });

  const addRow = () => setRows([...rows, { address: "", amount: "" }]);

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof Distribution, value: string) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    setRows(updated);
  };

  const handleDistribute = async () => {
    const validRows = rows.filter((r) => r.address && r.amount);
    if (validRows.length === 0) return;

    setDistributing(true);
    setProgress({ completed: 0, total: validRows.length });

    try {
      const distributions = validRows.map((r) => ({
        address: r.address,
        amount: BigInt(r.amount),
      }));

      await batchDistribute(bondAddress, distributions, (completed, total) => {
        setProgress({ completed, total });
      });

      showToast(`Distributed to ${validRows.length} addresses`, "success");
      setRows([{ address: "", amount: "" }]);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Distribution failed",
        "error"
      );
    } finally {
      setDistributing(false);
      setProgress({ completed: 0, total: 0 });
    }
  };

  const validCount = rows.filter((r) => r.address && r.amount).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-700">Distribute Bonds</h3>
        <p className="text-xs text-amber-600">Addresses must be whitelisted before distribution</p>
      </div>

      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={index} className="flex gap-2 items-center">
            <input
              type="text"
              value={row.address}
              onChange={(e) => updateRow(index, "address", e.target.value)}
              placeholder="Aztec address (0x...)"
              className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              disabled={distributing}
            />
            <input
              type="number"
              min="1"
              value={row.amount}
              onChange={(e) => updateRow(index, "amount", e.target.value)}
              placeholder="Amount"
              className="w-32 px-3 py-2 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              disabled={distributing}
            />
            <button
              onClick={() => removeRow(index)}
              disabled={rows.length <= 1 || distributing}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-red-100 text-neutral-400 hover:text-red-500 disabled:opacity-30 transition-colors cursor-pointer"
            >
              <Icon icon="solar:minus-circle-linear" width={16} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addRow}
        disabled={distributing}
        className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1 cursor-pointer"
      >
        <Icon icon="solar:add-circle-linear" width={16} />
        Add Row
      </button>

      {distributing && progress.total > 0 && (
        <div className="space-y-1">
          <ProgressBar
            progress={(progress.completed / progress.total) * 100}
            complete={progress.completed === progress.total}
          />
          <p className="text-xs text-neutral-500 text-center">
            {progress.completed}/{progress.total} distributions complete
          </p>
        </div>
      )}

      <button
        onClick={handleDistribute}
        disabled={distributing || validCount === 0}
        className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-neutral-300 text-white text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2"
      >
        {distributing ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Distributing...
          </>
        ) : (
          `Distribute All (${validCount})`
        )}
      </button>
    </div>
  );
}
