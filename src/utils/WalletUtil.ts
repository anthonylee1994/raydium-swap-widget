import { Connection, PublicKey } from "@solana/web3.js";
import { Currency, CurrencyAmount } from "@raydium-io/raydium-sdk";

const receiveBalance = async (
  connection: Connection,
  ownerPublicKey: PublicKey,
  currency: Currency
): Promise<number> => {
  const balance = Number(
    new CurrencyAmount(
      currency,
      await connection.getBalance(ownerPublicKey)
    ).toFixed(currency.decimals)
  );

  console.log(`Your ${currency.symbol} balance is: `, balance);
  return balance;
};

export const WalletUtil = Object.freeze({
  receiveBalance,
});
