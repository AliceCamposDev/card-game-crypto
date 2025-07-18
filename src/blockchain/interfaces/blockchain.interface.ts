import { IBlock } from "./block.interface";
import { ITransaction } from "./transaction.interface";

export interface IBlockchain {
  chain: IBlock[];
  pendingTransactions: ITransaction[];
  stakes: Map<string, bigint>
  stakingRequirement: bigint;
  validatorReward: bigint;
}
