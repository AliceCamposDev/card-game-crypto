import crypto from "crypto";
import elliptic from "elliptic";
import { ITransaction } from "../interfaces/transaction.interface";
const EC = new elliptic.ec("secp256k1");

export class Transaction implements ITransaction {
  public id: string;
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
    publicKey: string,
  ) {
    this.id = crypto.randomUUID();
    this.sender = sender;
    this.recipient = recipient;
    this.amount = amount;
    this.timestamp = Date.now();
    this.signature = "";
    //TODO: wallert public key should be set by the wallet
    this.publicKey = publicKey;
  }


  calculateHash(): string {
    return crypto
      .createHash("sha256")
      .update(this.id + this.sender + this.publicKey + this.recipient + this.amount + this.timestamp)
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
      console.log("Insufficient funds");
      return false;
    }
    return true
  }
}
