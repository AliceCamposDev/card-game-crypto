import { ITransaction } from "./transaction.interface";

export interface IBlock {
  index: number;
  previousHash: string;
  timestamp: number;
  transactions: ITransaction[];
  hash: string;
  forger: string;
  signature: string;
}
