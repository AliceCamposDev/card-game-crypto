import { IBlock } from "../interfaces/block.interface";
import { ITransaction } from "../interfaces/transaction.interface";
import { IBlockchain } from "../interfaces/blockchain.interface";

import crypto from "crypto";
import elliptic from "elliptic";
const EC = new elliptic.ec("secp256k1");

export class Blockchain implements IBlockchain {
  public chain: IBlock[];
  public pendingTransactions: ITransaction[];
  public difficulty: number;
  public miningReward: string;

  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.pendingTransactions = [];
    this.difficulty = 2;
    this.miningReward = "100";
  }

  private createGenesisBlock(): IBlock {
    const genesisTimestamp = new Date(2025, 0, 1).getTime();
    return {
      index: 0,
      timestamp: genesisTimestamp,
      transactions: [],
      previousHash: "0",
      hash: this.calculateBlockHash({
        index: 0,
        timestamp: genesisTimestamp,
        transactions: [],
        previousHash: "0",
        nonce: 0,
      }),
      nonce: 0,
    };
  }

  public isTransactionSignatureValid(transaction: ITransaction): boolean {
    if (transaction.sender === "System") {
      return true;
    }

    if (!transaction.publicKey || !transaction.signature) {
      console.error("Missing public key or signature");
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
      console.error("Signature verification failed:", error);
      return false;
    }
  }

  public getLatestBlock(): IBlock {
    return this.chain[this.chain.length - 1];
  }

  public addTransaction(transaction: ITransaction): boolean {
    try {
      if (!transaction.isValid(this.getAvailableBalance.bind(this))) {
        console.error("Cannot add invalid transaction to chain");
        return false;
      }

      if (!this.isTransactionSignatureValid(transaction)) {
        console.error("Cannot add transaction, invalid Transaction signature");
        return false;
      }

      this.pendingTransactions.push(transaction);
      return true;
    } catch (error) {
      console.error("Error adding transaction:", error);
      return false;
    }
  }

  public minePendingTransactions(miningRewardAddress: string): boolean {
    
    if (!this.isChainValid()) {
      console.error("Cannot mine, blockchain is invalid");
        return false;
    }

    if (this.pendingTransactions.length === 0) {
      console.log("No transactions to mine");
      return false;
    }
    try {
      const rewardTx: ITransaction = {
        sender: "System",
        publicKey: "SystemPublicKey",
        recipient: miningRewardAddress,
        amount: BigInt(this.miningReward),
        timestamp: Date.now(),
        signature: "",
        isValid: () => true,
      };

      this.pendingTransactions.push(rewardTx);

      const prevBlock: IBlock = this.getLatestBlock();

      const tempBlock: IBlock = {
        index: prevBlock.index + 1,
        timestamp: Date.now(),
        transactions: [...this.pendingTransactions],
        previousHash: prevBlock.hash,
        hash: "",
        nonce: 0,
      };

      tempBlock.hash = this.proofOfWork(tempBlock);

      const success = this.addBlock(tempBlock);
      if (success) {
        console.log("Block successfully mined!");
        this.pendingTransactions = [];
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error mining block:", error);
      return false;
    }
  }

  private proofOfWork(block: Omit<IBlock, "hash">): string {
    let hash: string;
    do {
      block.nonce++;
      hash = this.calculateBlockHash(block);
    } while (!hash.startsWith("0".repeat(this.difficulty)));

    return hash;
  }

  private calculateBlockHash(block: Omit<IBlock, "hash">): string {
    const data = [
      block.previousHash,
      block.timestamp.toString(),
      JSON.stringify(block.transactions, (key, value) =>
        key === "amount" && typeof value === "bigint" ? value.toString() : value
      ),
      block.nonce.toString(),
    ].join("");

    return crypto.createHash("sha256").update(data).digest("hex");
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
      console.error("Blockchain is empty");
      return false;
    }

    try {
      const genesis = this.chain[0];
      if (
        genesis.index !== 0 ||
        genesis.previousHash !== "0" ||
        genesis.transactions.length !== 0
      ) {
        console.error("Genesis block is invalid");
        return false;
      }

      for (let i = 1; i < this.chain.length; i++) {
        const currentBlock = this.chain[i];
        const previousBlock = this.chain[i - 1];

        //TODO: better validation of transactions
        for (const trans of currentBlock.transactions) {
          if (!this.isTransactionSignatureValid(trans)) {
            console.error(`Invalid transaction in block ${currentBlock.index}`);
            return false;
          }
        }

        const { hash, ...blockWithoutHash } = currentBlock;

        if (this.calculateBlockHash(blockWithoutHash) !== currentBlock.hash) {
          console.error(`Block ${i} hash is invalid`);
          return false;
        }

        if (currentBlock.previousHash !== previousBlock.hash) {
          console.error(`Block ${i} previous hash is invalid`);
          return false;
        }

        if (currentBlock.index !== previousBlock.index + 1) {
          console.error(`Block ${i} index is invalid`);
          return false;
        }

        if (!currentBlock.hash.startsWith("0".repeat(this.difficulty))) {
          console.error(`Block ${i} doesn't meet difficulty requirement`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Error validating chain:", error);
      return false;
    }
  }

  public addBlock(newBlock: IBlock): boolean {
    try {
      if (newBlock.previousHash !== this.getLatestBlock().hash) {
        console.error("Invalid previous hash");
        return false;
      }

      const { hash, ...blockWithoutHash } = newBlock;
      if (this.calculateBlockHash(blockWithoutHash) !== newBlock.hash) {
        console.error("Invalid hash");
        return false;
      }
      if (newBlock.index !== this.getLatestBlock().index + 1) {
        console.error("Invalid block index");
        return false;
      }
      if (!newBlock.hash.startsWith("0".repeat(this.difficulty))) {
        console.error("Block does not meet difficulty requirement");
        return false;
      }
      for (const trans of newBlock.transactions) {
        if (!trans.isValid(this.getAvailableBalance.bind(this))) {
          console.error("Invalid transaction in block");
          return false;
        }
        if (!this.isTransactionSignatureValid(trans)) {
          console.error("Invalid transaction signature in block");
          return false;
        }
      }

      this.chain.push(newBlock);
      return true;
    } catch (error) {
      console.error("Error adding block:", error);
      return false;
    }
  }
}
