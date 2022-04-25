import { Connection } from "@solana/web3.js";

export const createWeb3Connection = () =>
  new Connection("https://mainnet.rpcpool.com/", "confirmed");
