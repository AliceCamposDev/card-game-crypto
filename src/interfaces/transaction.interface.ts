
export interface ITransaction {
  sender: string;
  recipient: string;
  amount: bigint;
  timestamp: number;
  signature: string;
}