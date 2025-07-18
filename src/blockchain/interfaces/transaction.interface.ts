export interface ITransaction {
  id: string;
  sender: string;
  recipient: string;
  amount: bigint;
  fee?: bigint;
  timestamp: number;
  signature?: string;
  publicKey: string;

  isValid(getBalanceFn: (address: string) => bigint): boolean;
}
