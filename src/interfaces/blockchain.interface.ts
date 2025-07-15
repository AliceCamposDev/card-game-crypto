import { IBlock } from "./block.interface";
import { ITransaction } from "./transaction.interface";

export interface IBlockchain {
  chain: IBlock[];
  pendingTransactions: ITransaction[];
  difficulty: number;
  miningReward: string;
}
