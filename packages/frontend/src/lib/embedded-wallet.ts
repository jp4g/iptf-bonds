import { Account, NO_FROM } from "@aztec/aztec.js/account";
import { AztecAddress } from "@aztec/aztec.js/addresses";
import { SponsoredFeePaymentMethod } from "@aztec/aztec.js/fee";
import { Fr } from "@aztec/aztec.js/fields";
import { createLogger } from "@aztec/aztec.js/log";
import { createAztecNodeClient } from "@aztec/aztec.js/node";
import {
  AccountManager,
  type DeployAccountOptions,
} from "@aztec/aztec.js/wallet";
import { GrumpkinScalar } from "@aztec/foundation/curves/grumpkin";
import type { FieldsOf } from "@aztec/foundation/types";
import { SchnorrAccountContract } from "@aztec/accounts/schnorr/lazy";
import { createPXE } from "@aztec/pxe/client/lazy";
import { getPXEConfig } from "@aztec/pxe/config";
import { BaseWallet, type FeeOptions } from "@aztec/wallet-sdk/base-wallet";
import { GasSettings } from "@aztec/stdlib/gas";

import {
  type StoredAccount,
  loadStoredAccounts,
  saveStoredAccounts,
  getStoredActiveAddress,
  setStoredActiveAddress,
  removeStoredActiveAddress,
  clearAllStoredAccounts,
} from "@/lib/storage";

const logger = createLogger("iptf-bonds:wallet");

export class EmbeddedBondWallet extends BaseWallet {
  connectedAccount: AztecAddress | null = null;
  protected accounts: Map<string, Account> = new Map();
  private idbQueue: Promise<unknown> = Promise.resolve();
  private fpcAddress: AztecAddress | null = null;

  enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const p = this.idbQueue.then(fn, fn);
    this.idbQueue = p.catch(() => {});
    return p;
  }

  protected async getAccountFromAddress(
    address: AztecAddress
  ): Promise<Account> {
    const account = this.accounts.get(address?.toString() ?? "");
    if (!account) {
      throw new Error(`Account not found for address: ${address}`);
    }
    return account;
  }

  getAccounts() {
    return Promise.resolve(
      Array.from(this.accounts.values()).map((acc) => ({
        alias: "",
        item: acc.getAddress(),
      }))
    );
  }

  static async initialize(nodeUrl: string) {
    const aztecNode = createAztecNodeClient(nodeUrl);

    const config = getPXEConfig();
    config.proverEnabled = true;
    config.dataDirectory = 'aztec-iptf-bonds';
    const pxe = await createPXE(aztecNode, config, {});

    // Register sponsored FPC — use env var if set, otherwise derive the canonical address
    const { SponsoredFPCContractArtifact } = await import(
      "@aztec/noir-contracts.js/SponsoredFPC"
    );
    const { getContractInstanceFromInstantiationParams } = await import(
      "@aztec/aztec.js/contracts"
    );
    const { SPONSORED_FPC_SALT } = await import("@aztec/constants");

    const fpcInstance = await getContractInstanceFromInstantiationParams(
      SponsoredFPCContractArtifact,
      { salt: new Fr(SPONSORED_FPC_SALT) }
    );

    const envAddr = process.env.NEXT_PUBLIC_SPONSORED_FPC_ADDRESS;
    const fpcAztecAddr = envAddr
      ? AztecAddress.fromString(envAddr)
      : fpcInstance.address;

    const registered = await pxe.getContracts();
    if (!registered.some(a => a.equals(fpcAztecAddr))) {
      await pxe.registerContract({
        instance: fpcInstance,
        artifact: SponsoredFPCContractArtifact,
      });
      logger.info("[init] registered SponsoredFPC at", fpcAztecAddr.toString());
    }

    const nodeInfo = await aztecNode.getNodeInfo();
    logger.info("PXE connected to node", nodeInfo);
    const wallet = new EmbeddedBondWallet(pxe, aztecNode);
    wallet.fpcAddress = fpcAztecAddr;
    return wallet;
  }

  private getSponsoredPaymentMethod(): SponsoredFeePaymentMethod | null {
    if (!this.fpcAddress) return null;
    return new SponsoredFeePaymentMethod(this.fpcAddress);
  }

  protected override async completeFeeOptions(
    from: AztecAddress,
    feePayer?: AztecAddress,
    gasSettings?: Partial<FieldsOf<GasSettings>>,
  ): Promise<FeeOptions> {
    const base = await super.completeFeeOptions(from, feePayer, gasSettings);
    if (!base.walletFeePaymentMethod && !feePayer) {
      const sponsored = this.getSponsoredPaymentMethod();
      if (sponsored) {
        base.walletFeePaymentMethod = sponsored;
        base.accountFeePaymentMethodOptions = 0;
      }
    }
    return base;
  }

  getConnectedAccount() {
    return this.connectedAccount;
  }

  getNode() {
    return this.aztecNode;
  }

  private async registerAccount(accountManager: AccountManager) {
    const instance = await accountManager.getInstance();
    const artifact = await accountManager
      .getAccountContract()
      .getContractArtifact();
    await this.registerContract(
      instance,
      artifact,
      accountManager.getSecretKey()
    );
  }

  async createAccountAndConnect() {
    if (!this.pxe) {
      throw new Error("PXE not initialized");
    }

    const salt = Fr.random();
    const secretKey = Fr.random();
    const signingKey = GrumpkinScalar.random();

    const contract = new SchnorrAccountContract(signingKey);
    const accountManager = await AccountManager.create(
      this,
      secretKey,
      contract,
      salt
    );

    await this.registerAccount(accountManager);
    this.accounts.set(
      accountManager.address.toString(),
      await accountManager.getAccount()
    );

    const deployMethod = await accountManager.getDeployMethod();
    const paymentMethod = this.getSponsoredPaymentMethod();
    const deployOpts: DeployAccountOptions = {
      from: NO_FROM,
      ...(paymentMethod ? { fee: { paymentMethod } } : {}),
      skipClassPublication: true,
      skipInstancePublication: true,
    };

    const receipt = await deployMethod.send(deployOpts);
    logger.info("Account deployed", receipt);

    const newEntry: StoredAccount = {
      address: accountManager.address.toString(),
      signingKey: signingKey.toString(),
      secretKey: secretKey.toString(),
      salt: salt.toString(),
    };
    const existing = loadStoredAccounts();
    existing.push(newEntry);
    saveStoredAccounts(existing);
    setStoredActiveAddress(newEntry.address);

    this.connectedAccount = accountManager.address;
    return this.connectedAccount;
  }

  async connectAllAccounts(): Promise<{ active: AztecAddress | null; all: AztecAddress[] }> {
    const stored = loadStoredAccounts();
    if (stored.length === 0) return { active: null, all: [] };

    const registered = await this.pxe.getContracts();
    const registeredSet = new Set(registered.map(a => a.toString()));

    const validAddresses: AztecAddress[] = [];
    const validEntries: StoredAccount[] = [];

    for (const entry of stored) {
      try {
        const contract = new SchnorrAccountContract(
          GrumpkinScalar.fromString(entry.signingKey)
        );
        const accountManager = await AccountManager.create(
          this,
          Fr.fromString(entry.secretKey),
          contract,
          Fr.fromString(entry.salt)
        );

        if (!registeredSet.has(accountManager.address.toString())) {
          await this.enqueue(() => this.registerAccount(accountManager));
          logger.info(`[accounts] registered ${entry.address}`);
        }
        this.accounts.set(
          accountManager.address.toString(),
          await accountManager.getAccount()
        );

        // Check if the account actually exists on-chain (sandbox may have restarted)
        const metadata = await this.getContractMetadata(accountManager.address);
        if (!metadata.isContractInitialized) {
          logger.warn("Account not found on-chain, removing stale entry", entry.address);
          this.accounts.delete(accountManager.address.toString());
          continue;
        }

        validAddresses.push(accountManager.address);
        validEntries.push(entry);
      } catch (err) {
        logger.warn(`Failed to restore account ${entry.address}, skipping: ${err}`);
      }
    }

    saveStoredAccounts(validEntries);

    const storedActive = getStoredActiveAddress();
    const activeAddr = validAddresses.find(a => a.toString() === storedActive) ?? validAddresses[0] ?? null;

    if (activeAddr) {
      this.connectedAccount = activeAddr;
      setStoredActiveAddress(activeAddr.toString());
    }

    return { active: activeAddr, all: validAddresses };
  }

  async registerBondContract(contractAddress: AztecAddress): Promise<void> {
    const { PrivateBondsContractArtifact } = await import(
      "@iptf/contracts/artifacts"
    );
    const instance = await this.aztecNode.getContract(contractAddress);
    if (!instance) {
      throw new Error(`Bond contract not found on-chain: ${contractAddress}`);
    }
    await this.enqueue(async () => {
      await this.registerContract(instance, PrivateBondsContractArtifact);
      logger.info(`[register] registered bond contract at ${contractAddress}`);
    });
  }

  getAccountAddresses(): AztecAddress[] {
    return Array.from(this.accounts.keys()).map(a => AztecAddress.fromString(a));
  }

  switchAccount(address: AztecAddress) {
    const key = address.toString();
    if (!this.accounts.has(key)) {
      throw new Error(`Account not found: ${key}`);
    }
    this.connectedAccount = address;
    setStoredActiveAddress(key);
  }

  disconnect() {
    this.connectedAccount = null;
  }

  removeAccount(address: AztecAddress) {
    const key = address.toString();
    this.accounts.delete(key);

    const stored = loadStoredAccounts().filter(e => e.address !== key);
    saveStoredAccounts(stored);

    if (this.connectedAccount?.toString() === key) {
      const next = stored.length > 0 ? AztecAddress.fromString(stored[0].address) : null;
      this.connectedAccount = next;
      if (next) {
        setStoredActiveAddress(next.toString());
      } else {
        removeStoredActiveAddress();
      }
    }
  }

  static clearAllSavedAccounts() {
    clearAllStoredAccounts();
  }
}
