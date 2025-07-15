import { ITransaction } from "../interfaces/transaction.interface";
import { IBlock } from "../interfaces/block.interface";
import crypto from "crypto";

class Block implements IBlock {
  constructor(
    public index: number,
    public previousHash: string,
    public timestamp: number,
    public transactions: ITransaction[],
    public hash: string = "",
    public nonce: number = 0
  ) {}

  calculateHash(): string {
    const blockData =
      this.index +
      this.previousHash +
      this.timestamp +
      JSON.stringify(this.transactions, (key, value) =>
        key === "amount" && typeof value === "bigint" ? value.toString() : value
      ) +
      this.nonce;
    return crypto.createHash("sha256").update(blockData).digest("hex");
  }
}
