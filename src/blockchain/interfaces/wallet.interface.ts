import { ITransaction } from "./transaction.interface";
import { IBlock } from "./block.interface";

export interface IWallet {
  address: string;
  publicKey: string;

  signTransaction(transaction: ITransaction): ITransaction;
  signBlock(block: IBlock): IBlock;
}
