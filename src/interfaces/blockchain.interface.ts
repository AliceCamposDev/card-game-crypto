import { IBlock } from './blocks.interface';
import { ITransaction } from './transaction.interface';

export interface IBlockchain {
  chain: IBlock[];
  pendingTransactions: ITransaction[];
  difficulty: number;
  miningReward: string;

  createTransaction(transaction: Omit<ITransaction, 'id' | 'timestamp' | 'signature'>): ITransaction;
  minePendingTransactions(miningRewardAddress: string): void;
  getBalanceOfAddress(address: string): string;
  isChainValid(): boolean;
  getLatestBlock(): IBlock;
  addBlock(newBlock: IBlock): void;
  getTransactionById(id: string): ITransaction | null;
}