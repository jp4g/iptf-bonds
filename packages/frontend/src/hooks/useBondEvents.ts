"use client";

import { useCallback, useState } from "react";
import { useAztecWallet } from "@/hooks/useAztecWallet";

export interface TransferEventData {
  from: string;
  to: string;
  amount: bigint;
}

export function useBondEvents() {
  const { wallet, address } = useAztecWallet();
  const [events, setEvents] = useState<TransferEventData[]>([]);
  const [holderBalances, setHolderBalances] = useState<Map<string, bigint>>(new Map());
  const [loading, setLoading] = useState(false);

  const fetchEvents = useCallback(
    async (bondAddress: string) => {
      if (!wallet || !address) return;
      setLoading(true);

      try {
        const { AztecAddress } = await import("@aztec/aztec.js/addresses");
        const { PrivateBondsContract } = await import("@iptf/contracts/artifacts");

        const bond = await PrivateBondsContract.at(
          AztecAddress.fromString(bondAddress),
          wallet
        );

        // Fetch encrypted events tagged to the issuer
        // The PXE decrypts events tagged via deliver_to(issuer, ...)
        const rawEvents = await wallet.getEvents(
          bond.address,
          "TransferEvent",
          0, // from block 0
          100 // max events
        );

        const parsed: TransferEventData[] = rawEvents.map((e: any) => ({
          from: e.from?.toString() ?? e.fields?.[0]?.toString() ?? "0x0",
          to: e.to?.toString() ?? e.fields?.[1]?.toString() ?? "0x0",
          amount: BigInt(e.amount?.toString() ?? e.fields?.[2]?.toString() ?? "0"),
        }));

        // Compute holder balances from events
        const balances = new Map<string, bigint>();
        for (const evt of parsed) {
          const fromAddr = evt.from;
          const toAddr = evt.to;
          balances.set(toAddr, (balances.get(toAddr) ?? 0n) + evt.amount);
          balances.set(fromAddr, (balances.get(fromAddr) ?? 0n) - evt.amount);
        }

        // Remove zero balances
        for (const [key, val] of balances) {
          if (val <= 0n) balances.delete(key);
        }

        setEvents(parsed);
        setHolderBalances(balances);
      } catch (err) {
        console.error("Failed to fetch events:", err);
        // Events API may not be available yet - set empty state
        setEvents([]);
        setHolderBalances(new Map());
      } finally {
        setLoading(false);
      }
    },
    [wallet, address]
  );

  return { events, holderBalances, loading, fetchEvents };
}
