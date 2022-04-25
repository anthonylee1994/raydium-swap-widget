import { Keypair } from "@solana/web3.js";

export const createFakePayer = (): Keypair => Keypair.generate();
