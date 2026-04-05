import { before, describe, test } from "node:test";
import { expect } from "@jest/globals";
import { getInitialTestAccountsData } from "@aztec/accounts/testing";
import { AztecAddress } from "@aztec/aztec.js/addresses";
import { createAztecNodeClient, type AztecNode } from "@aztec/aztec.js/node";
import { EmbeddedWallet } from "@aztec/wallets/embedded";
import { PrivateBondsContract, PrivateBondsContractArtifact } from "../src/artifacts/index.js";
import {
    deployBondContract,
    whitelistInvestor,
    distributeBonds,
    expectBondBalancePrivate,
    getBondContract,
} from "../src/contract.js";

const { AZTEC_NODE_URL = "http://localhost:8080" } = process.env;

describe("PrivateBonds", () => {

    let node: AztecNode;

    let issuerWallet: EmbeddedWallet;
    let aliceWallet: EmbeddedWallet;
    let bobWallet: EmbeddedWallet;

    let issuerAddress: AztecAddress;
    let aliceAddress: AztecAddress;
    let bobAddress: AztecAddress;

    let bonds: PrivateBondsContract;
    let bondsInstance: any;

    const TOTAL_SUPPLY = 1_000_000n;
    const MATURITY = 0n; // maturity in the past so redeem works immediately

    before(async () => {
        // setup aztec node client
        node = createAztecNodeClient(AZTEC_NODE_URL);

        // setup wallets
        issuerWallet = await EmbeddedWallet.create(node, { ephemeral: true, pxeConfig: { proverEnabled: false } });
        aliceWallet = await EmbeddedWallet.create(node, { ephemeral: true, pxeConfig: { proverEnabled: false } });
        bobWallet = await EmbeddedWallet.create(node, { ephemeral: true, pxeConfig: { proverEnabled: false } });
        const [issuerAccount, aliceAccount, bobAccount] = await getInitialTestAccountsData();

        issuerAddress = (await issuerWallet.createSchnorrAccount(issuerAccount.secret, issuerAccount.salt, issuerAccount.signingKey)).address;
        aliceAddress = (await aliceWallet.createSchnorrAccount(aliceAccount.secret, aliceAccount.salt, aliceAccount.signingKey)).address;
        bobAddress = (await bobWallet.createSchnorrAccount(bobAccount.secret, bobAccount.salt, bobAccount.signingKey)).address;

        // register senders across wallets
        await issuerWallet.registerSender(aliceAddress, "alice");
        await issuerWallet.registerSender(bobAddress, "bob");
        await aliceWallet.registerSender(issuerAddress, "issuer");
        await aliceWallet.registerSender(bobAddress, "bob");
        await bobWallet.registerSender(issuerAddress, "issuer");
        await bobWallet.registerSender(aliceAddress, "alice");
    });

    test("deploy and verify issuer balance", async () => {
        ({ contract: bonds, instance: bondsInstance } = await deployBondContract(
            issuerWallet, issuerAddress, TOTAL_SUPPLY, MATURITY
        ));

        // register bond contract in other wallets
        await aliceWallet.registerContract(bondsInstance, PrivateBondsContractArtifact);
        await bobWallet.registerContract(bondsInstance, PrivateBondsContractArtifact);

        expect(await expectBondBalancePrivate(issuerWallet, issuerAddress, bonds, TOTAL_SUPPLY)).toBe(true);
    });

    test("whitelist and distribute bonds", async () => {
        await whitelistInvestor(issuerWallet, issuerAddress, bonds, aliceAddress);
        await distributeBonds(issuerWallet, issuerAddress, bonds, aliceAddress, 500_000n);

        expect(await expectBondBalancePrivate(issuerWallet, issuerAddress, bonds, 500_000n)).toBe(true);
        expect(await expectBondBalancePrivate(aliceWallet, aliceAddress, bonds, 500_000n)).toBe(true);
    });

    test("transfer between whitelisted parties", async () => {
        await whitelistInvestor(issuerWallet, issuerAddress, bonds, bobAddress);

        await bonds
            .withWallet(aliceWallet)
            .methods
            .transfer_private(bobAddress, 200_000n)
            .send({ from: aliceAddress });

        expect(await expectBondBalancePrivate(aliceWallet, aliceAddress, bonds, 300_000n)).toBe(true);
        expect(await expectBondBalancePrivate(bobWallet, bobAddress, bonds, 200_000n)).toBe(true);
    });

    test("redeem at maturity", async () => {
        await bonds
            .withWallet(bobWallet)
            .methods
            .redeem(200_000n)
            .send({ from: bobAddress });

        expect(await expectBondBalancePrivate(bobWallet, bobAddress, bonds, 0n)).toBe(true);
    });
});
