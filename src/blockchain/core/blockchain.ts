import { IBlock } from "../interfaces/block.interface";
import { ITransaction } from "../interfaces/transaction.interface";
import { IBlockchain } from "../interfaces/blockchain.interface";
import { hashBlock } from "../utils/utils";
import crypto, { sign } from "crypto";
import elliptic from "elliptic";
import { IWallet } from "../interfaces/wallet.interface";

const EC = new elliptic.ec("secp256k1");

export class Blockchain implements IBlockchain {
  public chain: IBlock[];
  public pendingTransactions: ITransaction[];
  public stakes: Map<string, bigint>;
  public stakingRequirement: bigint;
  public validatorReward: bigint;

  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.pendingTransactions = [];
    this.stakes = new Map<string, bigint>();
    this.stakingRequirement = 1000n;
    this.validatorReward = 10n;
  }

  private createGenesisBlock(): IBlock {
    const genesisTimestamp = new Date(2025, 0, 1).getTime();
    return {
      index: 0,
      timestamp: genesisTimestamp,
      transactions: [],
      previousHash: "0",
      forger: "0",
      signature: "0",
      hash: "0",
    };
  }

  stakeTokens(amount: bigint, address: string): boolean {
    if (this.getAvailableBalance(address) < amount) {
      console.log("Insufficient funds to stake");
      return false;
    }
    const currentStake: bigint = this.stakes.get(address) || 0n;
    this.stakes.set(address, currentStake + amount);
    return true;
  }

  async forgeBlock(wallet: IWallet): Promise<boolean> {
    if (this.pendingTransactions.length === 0) {
      console.log("No pending transactions to forge a block");
      return false;
    }

    const address: string = wallet.address;

    if (!this.isEligibleValidator(address)) {
      console.log("Endereço não é um validador elegível");
      return false;
    }
    
    const rewardTx: ITransaction = {
      id: crypto.randomUUID(),
      sender: "System",
      recipient: address,
      amount: this.validatorReward,
      fee: 0n,
      timestamp: Date.now(),
      signature: "",
      publicKey: "",

      isValid: () => true,
    };

    const transactions = [...this.pendingTransactions, rewardTx];
    const previousHash = this.getLatestBlock().hash;

    const newBlock: IBlock = {
      index: this.chain.length,
      timestamp: Date.now(),
      transactions,
      previousHash,
      forger: address,
      hash: "",
      signature: "",
    };

    this.pendingTransactions = [];
    newBlock.hash = hashBlock(newBlock);
    wallet.signBlock(newBlock);

    return this.addBlock(newBlock);
  }

  private isEligibleValidator(address: string): boolean {
    const stake: bigint = this.stakes.get(address) || 0n;
    return stake >= this.stakingRequirement;
  }

  public isTransactionSignatureValid(transaction: ITransaction): boolean {
    if (transaction.sender === "System") {
      return true;
    }

    if (!transaction.publicKey || !transaction.signature) {
      console.log("Missing public key or signature");
      return false;
    }

    const payload = [
      transaction.sender,
      transaction.recipient,
      transaction.amount.toString(),
      transaction.timestamp.toString(),
      transaction.publicKey,
    ].join("|");
    const txHash = crypto.createHash("sha256").update(payload).digest("hex");

    try {
      const keyPair = EC.keyFromPublic(transaction.publicKey, "hex");

      return keyPair.verify(txHash, transaction.signature);
    } catch (error) {
      console.log("Signature verification failed");
      return false;
    }
  }

  public getLatestBlock(): IBlock {
    return this.chain[this.chain.length - 1];
  }

  public addTransaction(transaction: ITransaction): boolean {
    try {
      if (!transaction.isValid(this.getAvailableBalance.bind(this))) {
        console.log("Cannot add invalid transaction to chain");
        return false;
      }

      if (!this.isTransactionSignatureValid(transaction)) {
        console.log("Cannot add transaction, invalid Transaction signature");
        return false;
      }

      this.pendingTransactions.push(transaction);
      return true;
    } catch (error) {
      console.log("Error adding transaction", error);
      return false;
    }
  }

  public getBalanceOfAddress(address: string): bigint {
    let balance = BigInt(0);

    for (const block of this.chain) {
      for (const trans of block.transactions) {
        if (trans.sender === address) {
          balance -= trans.amount;
        }

        if (trans.recipient === address) {
          balance += trans.amount;
        }
      }
    }

    const currentStake: bigint = this.stakes.get(address) || 0n;

    balance -= currentStake;

    return balance;
  }

  getAvailableBalance(address: string): bigint {
    let balance = this.getBalanceOfAddress(address);
    for (const trans of this.pendingTransactions) {
      if (trans.sender === address) {
        balance -= trans.amount;
      }
    }
    return balance;
  }

  public isChainValid(): boolean {
    if (this.chain.length === 0) {
      console.log("Blockchain is empty");
      return false;
    }

    try {
      const genesis = this.chain[0];
      if (
        genesis.index !== 0 ||
        genesis.previousHash !== "0" ||
        genesis.transactions.length !== 0
      ) {
        console.log("Genesis block is invalid");
        return false;
      }

      for (let i = 1; i < this.chain.length; i++) {
        const currentBlock = this.chain[i];
        const previousBlock = this.chain[i - 1];

        //TODO: better validation of transactions
        for (const trans of currentBlock.transactions) {
          if (!this.isTransactionSignatureValid(trans)) {
            console.log(`Invalid transaction in block ${currentBlock.index}`);
            return false;
          }
        }

        if (hashBlock(currentBlock) !== currentBlock.hash) {
          console.log(`Block ${i} hash is invalid`);
          return false;
        }

        if (currentBlock.previousHash !== previousBlock.hash) {
          console.log(`Block ${i} previous hash is invalid`);
          return false;
        }

        if (currentBlock.index !== previousBlock.index + 1) {
          console.log(`Block ${i} index is invalid`);
          return false;
        }

      }

      return true;
    } catch (error) {
      console.log("Error validating chain:", error);
      return false;
    }
  }

  public addBlock(newBlock: IBlock): boolean {
    try {
      if (newBlock.previousHash !== this.getLatestBlock().hash) {
        console.log("Invalid previous hash");
        return false;
      }

      if (hashBlock(newBlock) !== newBlock.hash) {
        console.log("Invalid hash");
        return false;
      }

      if (newBlock.index !== this.getLatestBlock().index + 1) {
        console.log("Invalid block index");
        return false;
      }
      
      for (const trans of newBlock.transactions) {
        if (!trans.isValid(this.getAvailableBalance.bind(this))) {
          console.log("Invalid transaction in block");
          return false;
        }
        if (!this.isTransactionSignatureValid(trans)) {
          console.log("Invalid transaction signature in block");
          return false;
        }
      }

      this.chain.push(newBlock);
      return true;
    } catch (error) {
      console.log("Error adding block:", error);
      return false;
    }
  }
}
