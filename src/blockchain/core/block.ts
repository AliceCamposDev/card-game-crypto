import { ITransaction } from "../interfaces/transaction.interface";
import { IBlock } from "../interfaces/block.interface";

class Block implements IBlock {
  constructor(
    public index: number,
    public previousHash: string,
    public timestamp: number,
    public transactions: ITransaction[],
    public hash: string = "",
    public forger: string,
    public signature: string
  ) {}

}
