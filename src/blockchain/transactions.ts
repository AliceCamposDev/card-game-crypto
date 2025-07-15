import crypto from "crypto";
import elliptic from "elliptic";
const EC = new elliptic.ec("secp256k1");
import { ITransaction } from "../interfaces/transaction.interface";

export class Transaction implements ITransaction {
  public sender: string;
  public recipient: string;
  public amount: bigint;
  public timestamp: number = Date.now();
  public signature: string = "";
  public publicKey: string;

  constructor(
    sender: string,
    recipient: string,
    amount: bigint,
    timestamp: number,
    signature: string,
    publicKey: string,
  ) {
    this.sender = sender;
    this.recipient = recipient;
    this.amount = amount;
    this.timestamp = timestamp;
    this.signature = signature;
    this.publicKey = publicKey;
  }

  createTransaction(
    sender: string,
    recipient: string,
    amount: bigint,
    publicKey: string
  ): ITransaction {
    return new Transaction(sender, recipient, amount, Date.now(), "", publicKey);
  }

  calculateHash(): string {
    return crypto
      .createHash("sha256")
      .update(this.sender + this.publicKey + this.recipient + this.amount + this.timestamp)
      .digest("hex");
  }

  isValid(getAvailableBalanceFn: (address: string) => bigint): boolean {
    if (!this.sender || !this.recipient) {
      console.log("Transaction must include sender and recipient addresses")
      return false;
    }

    if (this.amount <= 0n) {
      console.log("Transaction amount must be greater than zero");
      return false;
    }

    if (this.sender === "System") {
      return true;
    }

    const senderBalance = getAvailableBalanceFn(this.sender);
    if (senderBalance < this.amount) {
      console.log("Sender does not have enough balance");
      return false;
    }

    return true
  }
}
