import { IWallet } from "../interfaces/wallet.interface";
import { ITransaction } from "../interfaces/transaction.interface";
import crypto from "crypto";
import elliptic from "elliptic";

export class Wallet implements IWallet {
  public address: string;
  private privateKey: string;
  public publicKey: string;

  constructor() {
    const ec = new elliptic.ec("secp256k1");
    const keyPair = ec.genKeyPair();
    this.privateKey = keyPair.getPrivate("hex");
    this.publicKey = keyPair.getPublic(false, "hex");
    const publicKeyHex = keyPair.getPublic("hex");
    this.address =
      "0x" + crypto.createHash("sha256").update(publicKeyHex).digest("hex");
  }

  signTransaction(transaction: ITransaction): ITransaction {
    //TODO: check if the transaction is valid

    const ec = new elliptic.ec("secp256k1");
    const keyPair = ec.keyFromPrivate(this.privateKey);

    const payload = [
      transaction.sender,
      transaction.recipient,
      transaction.amount.toString(),
      transaction.timestamp.toString(),
      transaction.publicKey,
    ].join("|");

    const txHash = crypto.createHash("sha256").update(payload).digest("hex");
    const signature = keyPair.sign(txHash, {
      canonical: true,
    });

    transaction.signature = signature.toDER("hex");
    return transaction;
  }
}
