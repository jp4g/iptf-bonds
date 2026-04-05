import { AztecAddress } from "@aztec/aztec.js/addresses";

export const TOKEN_METADATA = {
    stablecoin: { name: "USD Coin", symbol: "USDC", decimals: 6 },
}

export type EscrowConfig = {
    owner: AztecAddress,
    partial_note: bigint,
    bond_address: AztecAddress,
    bond_amount: bigint,
    payment_token_address: AztecAddress,
    payment_amount: bigint,
    randomness: bigint,
};
