import { Blockchain } from "./blockchain/core/blockchain";
import { Wallet } from "./blockchain/core/wallet";
import { Transaction } from "./blockchain/core/transactions";
import { IBlock } from "./blockchain/interfaces/block.interface";

const blockchain = new Blockchain();

// Create wallets
const minerWallet = new Wallet();
const walletA = new Wallet();
const walletB = new Wallet();
const walletC = new Wallet();
const walletD = new Wallet();

console.log("=== Enhanced Blockchain Test Suite ===");
console.log("Key Features:");
console.log("- System-generated initial funds");
console.log("- No mining without valid transactions");
console.log("- Comprehensive transaction flow");
console.log("- Realistic balance tracking\n");

console.log("Participants:");
console.log(`- Miner: ${minerWallet.address}`);
console.log(`- Wallet A: ${walletA.address}`);
console.log(`- Wallet B: ${walletB.address}`);
console.log(`- Wallet C: ${walletC.address}`);
console.log(`- Wallet D: ${walletD.address}\n`);

// Utility functions
const printBalances = () => {
  console.log("Current Balances:");
  console.log(`- Miner: ${blockchain.getBalanceOfAddress(minerWallet.address)}`);
  console.log(`- Wallet A: ${blockchain.getBalanceOfAddress(walletA.address)}`);
  console.log(`- Wallet B: ${blockchain.getBalanceOfAddress(walletB.address)}`);
  console.log(`- Wallet C: ${blockchain.getBalanceOfAddress(walletC.address)}`);
  console.log(`- Wallet D: ${blockchain.getBalanceOfAddress(walletD.address)}\n`);
};

const printChainSummary = () => {
  console.log("Chain Summary:");
  console.log(`- Blocks: ${blockchain.chain.length}`);
  console.log(`- Transactions: ${blockchain.chain.reduce((acc, block) => acc + block.transactions.length, 0)}`);
  console.log(`- Pending Transactions: ${blockchain.pendingTransactions.length}\n`);
};

// Test 1: Verify genesis block
console.log("Test 1: Genesis Block Verification");
console.log("Chain length:", blockchain.chain.length);
console.log("Genesis hash:", blockchain.chain[0].hash.substring(0, 16) + "...");
console.log("Is chain valid?", blockchain.isChainValid());
console.log("Expected: true (valid genesis block)\n");

// Test 2: System creates initial funds
console.log("Test 2: System Initialization");
const initialFundsTx = new Transaction(
    "System",
    minerWallet.address,
    1000n,
    Date.now(),
    "",
    "SystemPublicKey"
  );
blockchain.addTransaction(initialFundsTx);
console.log("System transaction added with 1000 coins to miner");
printBalances();
console.log("Expected: Transaction added but balances unchanged until mined\n");

// Test 3: Mine initial block
console.log("Test 3: Mining Initial Block");
const miningResult = blockchain.minePendingTransactions(minerWallet.address);
console.log("Mining result:", miningResult);
console.log("Block contains:", blockchain.chain[1].transactions.length, "transactions");
printBalances();
console.log("Expected: true, miner has 1000 + mining reward\n");

// Test 4: Initial distribution
console.log("Test 4: Initial Distribution Transactions");
const distributionTxs = [
  new Transaction(
    minerWallet.address,
    walletA.address,
    200n,
    Date.now(),
    "",
    minerWallet.publicKey
  ),
  new Transaction(
    minerWallet.address,
    walletB.address,
    200n,
    Date.now(),
    "",
    minerWallet.publicKey
  ),
  new Transaction(
    minerWallet.address,
    walletC.address,
    200n,
    Date.now(),
    "",
    minerWallet.publicKey
  ),
  new Transaction(
    minerWallet.address,
    walletD.address,
    200n,
    Date.now(),
    "",
    minerWallet.publicKey
  )
];

distributionTxs.forEach(tx => {
  minerWallet.signTransaction(tx);
  blockchain.addTransaction(tx);
});
console.log("Added 4 distribution transactions");
printChainSummary();
console.log("Expected: 4 pending transactions\n");

// Test 5: Mine distribution block
console.log("Test 5: Mining Distribution Block");
const distMiningResult = blockchain.minePendingTransactions(minerWallet.address);
console.log("Mining result:", distMiningResult);
printBalances();
printChainSummary();
console.log("Expected: Miner gets reward, balances distributed\n");

// Test 6: Circular transactions
console.log("Test 6: Circular Transactions Between Wallets");
const circularTxs = [
  new Transaction(walletA.address, walletB.address, 50n, Date.now(), "", walletA.publicKey),
  new Transaction(walletB.address, walletC.address, 50n, Date.now(), "", walletB.publicKey),
  new Transaction(walletC.address, walletD.address, 50n, Date.now(), "", walletC.publicKey),
  new Transaction(walletD.address, walletA.address, 50n, Date.now(), "", walletD.publicKey)
];

circularTxs.forEach((tx, i) => {
  const sender = [walletA, walletB, walletC, walletD][i];
  sender.signTransaction(tx);
  blockchain.addTransaction(tx);
  console.log(`Added TX ${i+1} between wallets`);
});
printChainSummary();
console.log("Expected: 4 new pending transactions\n");

// Test 7: Mine circular transactions
console.log("Test 7: Mining Circular Transactions");
console.log("Mining result:", blockchain.minePendingTransactions(minerWallet.address));
printBalances();
printChainSummary();

// Test 8: Final validation
console.log("Test 8: Final Validation");
console.log("Is chain valid?", blockchain.isChainValid());
console.log("Final State:");
const formatBigIntReplacer = (key: string, value: any) => {
  if (typeof value === 'bigint') {
    return value.toString(); // or return Number(value) if you prefer numbers
  }
  return value;
};

const blockchainSummary = {
  chainLength: blockchain.chain.length,
  totalTransactions: blockchain.chain.reduce((sum, block) => sum + block.transactions.length, 0),
  difficulty: blockchain.difficulty,
  pendingTransactions: blockchain.pendingTransactions.length,
  balances: {
    miner: blockchain.getBalanceOfAddress(minerWallet.address),
    A: blockchain.getBalanceOfAddress(walletA.address),
    B: blockchain.getBalanceOfAddress(walletB.address),
    C: blockchain.getBalanceOfAddress(walletC.address),
    D: blockchain.getBalanceOfAddress(walletD.address)
  },
  // Include any other BigInt properties here
};

console.log("Final Blockchain Summary:");
console.log(JSON.stringify(blockchainSummary, formatBigIntReplacer, 2));
console.log("\n=== Test Suite Completed ===");