import type { AztecNode } from "@aztec/aztec.js/node";

export const wad = (n: bigint = 1n, decimals: bigint = 18n) =>
    n * 10n ** decimals;

export const precision = wad;
