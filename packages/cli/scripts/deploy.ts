import "dotenv/config";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createAztecNodeClient } from "@aztec/aztec.js/node";
import { Fr } from "@aztec/aztec.js/fields";
import { GrumpkinScalar } from "@aztec/foundation/curves/grumpkin";
import { EmbeddedWallet } from "@aztec/wallets/embedded";
import { bootstrapAztecFPC, deployAztecFPC, fundAztecFPC } from "@jp4g/fpc-deployer";
import { deployTokenContract } from "@iptf/contracts/contract";
import { TOKEN_METADATA } from "@iptf/contracts/constants";
import { getSponsoredPaymentMethod, getPriorityFeeOptions } from "@iptf/contracts/fees";
import { isTestnet } from "@iptf/contracts/utils";
import { AztecAddress } from "@aztec/stdlib/aztec-address";
import { testnetPriorityFee, testnetTimeout, testnetInterval } from "./utils";

const { L2_NODE_URL, L1_RPC_URL, L1_CHAIN_ID, L1_PRIVATE_KEY } = process.env;
if (!L2_NODE_URL) throw new Error("L2_NODE_URL not set in env");
if (!L1_RPC_URL) throw new Error("L1_RPC_URL not set in env");
if (!L1_CHAIN_ID) throw new Error("L1_CHAIN_ID not set in env");
if (!L1_PRIVATE_KEY) throw new Error("L1_PRIVATE_KEY not set in env");

const l1Config = {
    l1RpcUrl: L1_RPC_URL,
    l1ChainId: Number(L1_CHAIN_ID),
    l1PrivateKey: L1_PRIVATE_KEY,
};

const main = async () => {
    const node = createAztecNodeClient(L2_NODE_URL);
    console.log("Connected to Aztec node at", L2_NODE_URL);

    // =========================================================================
    // 1. Bootstrap FPC deployer account (creates + funds account via L1 bridge)
    // =========================================================================
    console.log("Bootstrapping FPC deployer account...");
    const deployerKeys = await bootstrapAztecFPC({
        l2Url: L2_NODE_URL,
        ...l1Config,
    });
    console.log(`FPC deployer bootstrapped: ${deployerKeys.address}`);

    // =========================================================================
    // 2. Deploy Sponsored FPC contract
    // =========================================================================
    console.log("Deploying Sponsored FPC contract...");
    const { fpcAddress } = await deployAztecFPC({
        l2Url: L2_NODE_URL,
        ...deployerKeys,
    });
    console.log(`Sponsored FPC deployed: ${fpcAddress}`);

    // =========================================================================
    // 3. Fund FPC with fee juice via L1 bridge
    // =========================================================================
    console.log("Funding FPC with fee juice...");
    const fundResult = await fundAztecFPC({
        l2Url: L2_NODE_URL,
        ...l1Config,
        ...deployerKeys,
        fpcAddress,
        amount: 1000n * 10n ** 18n,
    });
    console.log(`FPC funded — balance: ${fundResult.balance}`);

    // =========================================================================
    // 4. Create minter account using FPC for fees
    // =========================================================================
    console.log("Creating minter account...");
    let pxeConfig = {};
    if (await isTestnet(node)) pxeConfig = { proverEnabled: true };

    const wallet = await EmbeddedWallet.create(node, { pxeConfig });
    const fpcAztecAddress = AztecAddress.fromString(fpcAddress);
    const paymentMethod = await getSponsoredPaymentMethod(node, wallet, fpcAztecAddress);

    const minterSalt = Fr.random();
    const minterSecretKey = Fr.random();
    const minterSigningKey = GrumpkinScalar.random();

    const minterAccount = await wallet.createSchnorrAccount(
        minterSecretKey,
        minterSalt,
        minterSigningKey
    );

    let deployFee: Record<string, unknown> = { paymentMethod };
    if (await isTestnet(node)) {
        const priorityFee = await getPriorityFeeOptions(node, testnetPriorityFee);
        deployFee = { ...priorityFee, paymentMethod };
    }

    await minterAccount.deploy({ fee: deployFee }).wait(
        await isTestnet(node)
            ? { timeout: testnetTimeout, interval: testnetInterval }
            : {}
    );

    const minterAddress = minterAccount.address;
    console.log(`Minter account deployed: ${minterAddress}`);

    const minterCredentials = {
        address: minterAddress.toString(),
        secretKey: minterSecretKey.toString(),
        salt: minterSalt.toString(),
        signingKey: minterSigningKey.toString(),
    };

    // =========================================================================
    // 5. Deploy stablecoin with minter as admin
    // =========================================================================
    console.log("Deploying stablecoin Token contract...");
    const minterWallet = wallet;
    minterWallet.setDefaultAccount(minterAddress);

    const sendOpts: Record<string, unknown> = { from: minterAddress, fee: deployFee };
    if (await isTestnet(node)) {
        sendOpts.wait = { timeout: testnetTimeout, interval: testnetInterval };
    }

    const { contract: stablecoin } = await deployTokenContract(
        minterWallet,
        minterAddress,
        TOKEN_METADATA.stablecoin,
        { send: sendOpts as any }
    );
    console.log(`Stablecoin deployed: ${stablecoin.address}`);

    // =========================================================================
    // 6. Write outputs
    // =========================================================================
    const deployments = {
        fpc: { address: fpcAddress },
        stablecoin: { address: stablecoin.address.toString() },
        minter: minterCredentials,
    };

    const deploymentsPath = resolve(__dirname, "data/deployments.json");
    writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
    console.log(`Deployments written to ${deploymentsPath}`);

    const envLocalPath = resolve(__dirname, "../../frontend/.env.local");
    const envContent = [
        `NEXT_PUBLIC_AZTEC_NODE_URL=${L2_NODE_URL}`,
        `NEXT_PUBLIC_SPONSORED_FPC_ADDRESS=${fpcAddress}`,
        `NEXT_PUBLIC_STABLECOIN_ADDRESS=${stablecoin.address}`,
        `NEXT_PUBLIC_STABLECOIN_MINTER=${JSON.stringify(minterCredentials)}`,
    ].join("\n") + "\n";
    writeFileSync(envLocalPath, envContent);
    console.log(`Frontend env written to ${envLocalPath}`);
};

main().then(() => process.exit(0));
