import { Keypair } from "@solana/web3.js";
import { base58_to_binary } from "base58-js";

export const createRealPayer = (secret: string): Keypair =>
  Keypair.fromSecretKey(base58_to_binary(secret));
