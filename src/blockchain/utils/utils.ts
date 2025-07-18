import { IBlock } from "../interfaces/block.interface";
import { ITransaction } from "../interfaces/transaction.interface";
import crypto from "crypto";

export const transactionsToString = (transactions: ITransaction[]): string => {
    return JSON.stringify(transactions, (key, value) => {
        if (typeof value === 'bigint') {
            return value.toString();
        }
        return value;
    });
};

export const hashBlock = (block: IBlock): string => {
    const payload=[
        block.index,
        block.previousHash,
        block.timestamp.toString(),
        transactionsToString(block.transactions),
        block.forger
    ].join("|")
    return crypto.createHash("sha256").update(payload).digest("hex");
}


