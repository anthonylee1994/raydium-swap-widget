import {
  Currency,
  CurrencyAmount,
  jsonInfo2PoolKeys,
  Liquidity,
  LiquidityPoolKeysV4,
  Token,
  TokenAmount,
  Trade,
} from "@raydium-io/raydium-sdk";
import BN from "bn.js";
import readlineSync from "readline-sync";
import { fetchLiquidityInfoList } from "./fetchLiquidityInfoList";
import { sdkParseJsonLiquidityInfo } from "./sdkParseJsonLiquidityInfo";
import { Connection, Keypair } from "@solana/web3.js";
import { toPercent } from "./toPercent";
import { attachRecentBlockhash } from "./attachRecentBlockhash";

const askForSwapAmount = (
  currency: Currency,
  balance: number
): CurrencyAmount => {
  const swapAmountSOL = Number(
    readlineSync.question("How much SOL do you want to swap? ")
  );

  if (isNaN(swapAmountSOL)) {
    throw new Error("Invalid input!");
  } else if (swapAmountSOL > balance) {
    throw new Error("Not enough SOL!");
  }

  return new CurrencyAmount(
    currency,
    new BN(swapAmountSOL * Number(`1e${currency.decimals}`))
  );
};

const getBestAmountOut = async (
  connection: Connection,
  currencyOut: Token,
  amountIn: CurrencyAmount | TokenAmount,
  slippage = "0.001"
) => {
  const jsonInfos = await fetchLiquidityInfoList();

  if (!jsonInfos) {
    throw new Error("No Liquidity Info found!");
  }

  const sdkParsedInfos = await sdkParseJsonLiquidityInfo(jsonInfos, connection);

  const pools = jsonInfos.map((jsonInfo, idx) => ({
    poolKeys: jsonInfo2PoolKeys(jsonInfo),
    poolInfo: sdkParsedInfos[idx],
  }));

  const { amountOut } = Trade.getBestAmountOut({
    pools,
    amountIn,
    currencyOut,
    slippage: toPercent(slippage),
  });

  console.log(
    `Swap ${amountIn.toFixed(amountIn.currency.decimals)} ${
      amountIn.currency.symbol
    } will get ${amountOut.toFixed(currencyOut.decimals)} ${
      amountOut.currency.symbol
    }.`
  );

  return amountOut;
};

const confirmSwapTransaction = async (
  connection: Connection,
  amountIn: CurrencyAmount,
  amountOut: CurrencyAmount,
  payer: Keypair,
  poolKeys: LiquidityPoolKeysV4
) => {
  const answer = readlineSync.question("Are you sure you want to swap? (y/n) ");

  if (answer !== "y") {
    throw new Error("Swap cancelled!");
  }

  const { transaction, signers } = await Liquidity.makeSwapTransaction({
    connection,
    amountIn,
    amountOut,
    fixedSide: "in",
    poolKeys,
    userKeys: { tokenAccounts: [], owner: payer.publicKey },
  });

  await attachRecentBlockhash(connection, transaction, payer.publicKey);
  transaction.partialSign(...signers);

  console.log("Transaction:\n", transaction);

  const response = await connection.sendTransaction(transaction, [
    ...signers,
    payer,
  ]);

  return response;
};

export const SwapUtil = Object.freeze({
  askForSwapAmount,
  getBestAmountOut,
  confirmSwapTransaction,
});
