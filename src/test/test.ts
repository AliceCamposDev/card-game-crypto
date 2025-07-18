import { Transaction } from "../blockchain/core/transactions";
import { Blockchain } from "../blockchain/core/blockchain";
import { Wallet } from "../blockchain/core/wallet";
import { ITransaction } from "../blockchain/interfaces/transaction.interface";
import crypto from "crypto";

describe("Blockchain", () => {
  let blockchain: Blockchain;
  let wallet1: Wallet;
  let wallet2: Wallet;

  beforeEach(() => {
    blockchain = new Blockchain();
    wallet1 = new Wallet();
    wallet2 = new Wallet();
  });

  describe("Genesis Block", () => {
    it("should create genesis block with correct properties", () => {
      const genesisBlock = blockchain.chain[0];
      expect(genesisBlock.index).toBe(0);
      expect(genesisBlock.previousHash).toBe("0");
      expect(genesisBlock.transactions.length).toBe(0);
      expect(genesisBlock.forger).toBe("0");
    });
  });

  describe("Transaction Management", () => {
    it("it should not valid System transactions (by now)", () => {
      const tx: ITransaction = {
        id: crypto.randomUUID(),
        sender: "System",
        recipient: wallet2.address,
        amount: 100n,
        fee: 0n,
        timestamp: Date.now(),
        publicKey: wallet1.publicKey,
        signature: "",
        isValid: () => true,
      };

      const signedTx = wallet1.signTransaction(tx);

      expect(blockchain.addTransaction(signedTx)).toBeTruthy();
      expect(blockchain.pendingTransactions.length).toBe(1);
    });

    it("should reject transaction with invalid balance", () => {
      const tx: Transaction = new Transaction(
        wallet1.address,
        wallet2.address,
        100n,
        wallet1.publicKey
      );

      const signedTx = wallet1.signTransaction(tx);

      expect(blockchain.addTransaction(signedTx)).toBeFalsy();
      expect(blockchain.pendingTransactions.length).toBe(0);
    });

    it("should reject invalid transaction signature", () => {
      const tx: Transaction = new Transaction(
        wallet1.address,
        wallet2.address,
        100n,
        wallet1.publicKey
        );
        tx.signature = "invalid_signature";

      expect(blockchain.addTransaction(tx)).toBeFalsy();
      expect(blockchain.pendingTransactions.length).toBe(0);
    });
  });

  describe("Staking", () => {
    it("should allow staking with sufficient balance", () => {
      // Add some balance to wallet1
      const initialBalance = 2000n;
      const mockTx: ITransaction = {
        id: crypto.randomUUID(),
        sender: "System",
        recipient: wallet1.address,
        amount: initialBalance,
        fee: 0n,
        timestamp: Date.now(),
        publicKey: "",
        signature: "",
        isValid: () => true,
      };
      blockchain.chain[0].transactions.push(mockTx);

      const stakeAmount = 1000n;
      expect(blockchain.stakeTokens(stakeAmount, wallet1.address)).toBeTruthy();
      expect(blockchain.stakes.get(wallet1.address)).toBe(stakeAmount);
    });

    it("should reject staking with insufficient balance", () => {
      const stakeAmount = 1000n;
      expect(blockchain.stakeTokens(stakeAmount, wallet1.address)).toBeFalsy();
    });
  });

  describe("Block Forging", () => {
    beforeEach(() => {
      // Set up wallet1 as a validator by staking
      const mockTx: ITransaction = {
        id: crypto.randomUUID(),
        sender: "System",
        recipient: wallet1.address,
        amount: 2000n,
        fee: 0n,
        timestamp: Date.now(),
        publicKey: "",
        signature: "",
        isValid: () => true,
      };
      blockchain.chain[0].transactions.push(mockTx);
      blockchain.stakeTokens(1000n, wallet1.address);

      // Add a transaction to be mined
      const tx: ITransaction = {
        id: crypto.randomUUID(),
        sender: wallet1.address,
        recipient: wallet2.address,
        amount: 100n,
        fee: 0n,
        timestamp: Date.now(),
        publicKey: wallet1.publicKey,
        signature: "",
        isValid: () => true,
      };
      const signedTx = wallet1.signTransaction(tx);
      blockchain.addTransaction(signedTx);
    });

    it("should allow eligible validator to forge block", async () => {
      const result = await blockchain.forgeBlock(wallet1);
      expect(result).toBeTruthy();
      expect(blockchain.chain.length).toBe(2);
      expect(blockchain.pendingTransactions.length).toBe(0);
    });

    it("should reject forging from non-validator", async () => {
      const result = await blockchain.forgeBlock(wallet2); // wallet2 hasn't staked
      expect(result).toBeFalsy();
      expect(blockchain.chain.length).toBe(1);
    });

    it("should include validator reward in forged block", async () => {
      const result = await blockchain.forgeBlock(wallet1);
      expect(result).toBeTruthy();

      const newBlock = blockchain.chain[1];
      const rewardTx = newBlock.transactions.find(
        (tx) => tx.sender === "System"
      );
      expect(rewardTx).toBeDefined();
      expect(rewardTx?.recipient).toBe(wallet1.address);
      expect(rewardTx?.amount).toBe(blockchain.validatorReward);
    });

    // NEW TEST: No block should be mined without transactions
    it("should not forge block when no pending transactions", async () => {
      // Clear pending transactions
      blockchain.pendingTransactions = [];

      const result = await blockchain.forgeBlock(wallet1);
      expect(result).toBeFalsy();
      expect(blockchain.chain.length).toBe(1);
    });
  });

  describe("Chain Validation", () => {
    it("should validate a correct chain", () => {
      expect(blockchain.isChainValid()).toBeTruthy();
    });

    it("should detect tampered transactions", () => {
      // Add a valid block first
      const mockTx: ITransaction = {
        id: crypto.randomUUID(),
        sender: "System",
        recipient: wallet1.address,
        amount: 2000n,
        fee: 0n,
        timestamp: Date.now(),
        publicKey: "",
        signature: "",
        isValid: () => true,
      };
      blockchain.chain[0].transactions.push(mockTx);
      blockchain.stakeTokens(1000n, wallet1.address);

      // Add transaction to be mined
      const tx: ITransaction = {
        id: crypto.randomUUID(),
        sender: wallet1.address,
        recipient: wallet2.address,
        amount: 100n,
        fee: 0n,
        timestamp: Date.now(),
        publicKey: wallet1.publicKey,
        signature: "",
        isValid: () => true,
      };
      const signedTx = wallet1.signTransaction(tx);
      blockchain.addTransaction(signedTx);

      // Forge a block
      blockchain.forgeBlock(wallet1);

      // Tamper with a transaction
      blockchain.chain[1].transactions[0].amount = 9999n;

      expect(blockchain.isChainValid()).toBeFalsy();
    });

    it("should detect broken chain links", () => {
      // Add a valid block first
      const mockTx: ITransaction = {
        id: crypto.randomUUID(),
        sender: "System",
        recipient: wallet1.address,
        amount: 2000n,
        fee: 0n,
        timestamp: Date.now(),
        publicKey: "",
        signature: "",
        isValid: () => true,
      };
      blockchain.chain[0].transactions.push(mockTx);
      blockchain.stakeTokens(1000n, wallet1.address);

      // Add transaction to be mined
      const tx: ITransaction = {
        id: crypto.randomUUID(),
        sender: wallet1.address,
        recipient: wallet2.address,
        amount: 100n,
        fee: 0n,
        timestamp: Date.now(),
        publicKey: wallet1.publicKey,
        signature: "",
        isValid: () => true,
      };
      const signedTx = wallet1.signTransaction(tx);
      blockchain.addTransaction(signedTx);

      // Forge a block
      blockchain.forgeBlock(wallet1);

      // Break the chain link
      blockchain.chain[1].previousHash = "tampered_hash";

      expect(blockchain.isChainValid()).toBeFalsy();
    });
  });

  describe("Balance Calculation", () => {
    it("should correctly calculate balances", () => {
      // Initial system transaction to wallet1
      const tx1: ITransaction = {
        id: crypto.randomUUID(),
        sender: "System",
        recipient: wallet1.address,
        amount: 1000n,
        fee: 0n,
        timestamp: Date.now(),
        publicKey: "",
        signature: "",
        isValid: () => true,
      };
      blockchain.chain[0].transactions.push(tx1);

      // Wallet1 sends to wallet2
      const tx2: ITransaction = {
        id: crypto.randomUUID(),
        sender: wallet1.address,
        recipient: wallet2.address,
        amount: 200n,
        fee: 0n,
        timestamp: Date.now(),
        publicKey: wallet1.publicKey,
        signature: "",
        isValid: () => true,
      };
      const signedTx2 = wallet1.signTransaction(tx2);
      blockchain.chain[0].transactions.push(signedTx2);

      // Wallet1 stakes some tokens
      blockchain.stakeTokens(300n, wallet1.address);

      // Count transactions in genesis block
      expect(blockchain.chain[0].transactions.length).toBe(2);

      expect(blockchain.getBalanceOfAddress(wallet1.address)).toBe(500n); // 1000 - 200 - 1 - 300
      expect(blockchain.getBalanceOfAddress(wallet2.address)).toBe(200n);
    });
  });
});
