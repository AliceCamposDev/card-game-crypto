
import crypto from 'crypto';
import elliptic from 'elliptic';
const EC = new elliptic.ec('secp256k1');
import { ITransaction } from '../interfaces/transaction.interface';

class Transaction implements ITransaction {
  constructor(
    public sender: string,
    public recipient: string,
    public amount: bigint,
    public timestamp: number = Date.now(),
    public signature: string = ''
  ) {}

  calculateHash(): string {
    return crypto
      .createHash('sha256')
      .update(this.sender + this.recipient + this.amount + this.timestamp)
      .digest('hex');
  }

  signTransaction(signingKey: elliptic.ec.KeyPair): void {
    if (signingKey.getPublic('hex') !== this.sender) {
      throw new Error('You cannot sign transactions for other wallets!');
    }

    const hashTx = this.calculateHash();
    const sig = signingKey.sign(hashTx, 'base64');
    this.signature = sig.toDER('hex');
  }

  isValid(): boolean {
    if (this.sender === 'system') return true;

    if (!this.signature || this.signature.length === 0) {
      throw new Error('No signature in this transaction');
    }

    const publicKey = EC.keyFromPublic(this.sender, 'hex');
    return publicKey.verify(this.calculateHash(), this.signature);
  }
}