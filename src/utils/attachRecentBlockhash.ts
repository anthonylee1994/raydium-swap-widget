import { Connection, Transaction, PublicKey } from "@solana/web3.js";

export const attachRecentBlockhash = async (
  connection: Connection,
  transaction: Transaction,
  payer: PublicKey
) => {
  if (!transaction.recentBlockhash) {
    // recentBlockhash may already attached by sdk
    try {
      transaction.recentBlockhash =
        (await connection.getLatestBlockhash?.())?.blockhash ||
        (await connection.getRecentBlockhash()).blockhash;
    } catch {
      transaction.recentBlockhash = (
        await connection.getRecentBlockhash()
      ).blockhash;
    }
    transaction.feePayer = payer;
  }
};
