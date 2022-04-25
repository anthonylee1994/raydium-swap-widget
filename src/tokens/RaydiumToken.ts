import { PublicKey } from "@solana/web3.js";
import { Token } from "@raydium-io/raydium-sdk";

export const RaydiumToken = new Token(
  new PublicKey("4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R"),
  6,
  "RAY",
  "Raydium"
);
