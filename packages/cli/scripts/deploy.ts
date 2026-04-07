import "dotenv/config";
import { writeFileSync } from "node:fs";
import { createAztecNodeClient } from "@aztec/aztec.js/node";
import { isTestnet } from "@iptf/contracts/utils";
import { deployBondContract, deployTokenContract } from "@iptf/contracts/contract";
import { TOKEN_METADATA } from "@iptf/contracts/constants";
import { getTestnetSendWaitOptions, getIPTFAccounts, BOND_SUPPLY, MATURITY_SECONDS } from "./utils";

const { L2_NODE_URL } = process.env;
if (!L2_NODE_URL) throw new Error("L2_NODE_URL not set in env");

const main = async () => {
    const node = createAztecNodeClient(L2_NODE_URL);
    console.log("Connected to Aztec node at", L2_NODE_URL);

    let pxeConfig = {};
    if (await isTestnet(node)) pxeConfig = { proverEnabled: true };

    const { wallet, issuerAddress } = await getIPTFAccounts(node, pxeConfig);
    const opts = await getTestnetSendWaitOptions(node, wallet, issuerAddress);

    // deploy stablecoin first (needed as payment_token for bonds)
    console.log("Deploying stablecoin Token contract...");
    const { contract: stablecoin } = await deployTokenContract(
        wallet,
        issuerAddress,
        TOKEN_METADATA.stablecoin,
        opts
    );
    console.log(`Stablecoin deployed: ${stablecoin.address}`);

    // deploy bond contract (issuer gets full supply in private balance)
    const maturity = BigInt(Math.floor(Date.now() / 1000)) + MATURITY_SECONDS;
    console.log("Deploying PrivateBonds contract...");
    const { contract: bonds } = await deployBondContract(
        wallet,
        issuerAddress,
        "IPTF Bond Series 1",
        BOND_SUPPLY,
        maturity,
        stablecoin.address,
        undefined, // auto-compute DvP escrow class ID
        opts
    );
    console.log(`PrivateBonds deployed: ${bonds.address}`);

    // persist deployments
    const deployments = {
        bonds: { address: bonds.address },
        stablecoin: { address: stablecoin.address },
    };
    const filepath = `${__dirname}/data/deployments.json`;
    writeFileSync(filepath, JSON.stringify(deployments, null, 2));
    console.log(`Deployments written to ${filepath}`);
}

main().then(() => process.exit(0));
