import {
  Currency,
  CurrencyAmount,
  jsonInfo2PoolKeys,
  Liquidity,
  LiquidityPoolKeysV4,
  RouteInfo,
  SPL_ACCOUNT_LAYOUT,
  Token,
  TokenAccount,
  TokenAmount,
  TOKEN_PROGRAM_ID,
  Trade,
} from "@raydium-io/raydium-sdk";
import BN from "bn.js";
import readlineSync from "readline-sync";
import { fetchLiquidityInfoList } from "./fetchLiquidityInfoList";
import { sdkParseJsonLiquidityInfo } from "./sdkParseJsonLiquidityInfo";
import {
  Connection,
  Keypair,
  sendAndConfirmTransaction,
  PublicKey,
} from "@solana/web3.js";
import { toPercent } from "./toPercent";
import { attachRecentBlockhash } from "./attachRecentBlockhash";

export interface ITokenAccount {
  publicKey?: PublicKey;
  mint?: PublicKey;
  isAssociated?: boolean;
  amount: BN;
  isNative: boolean;
}

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
  amountIn: CurrencyAmount,
  slippage = "0.001"
): Promise<[TokenAmount, RouteInfo]> => {
  const jsonInfos = await fetchLiquidityInfoList();

  if (!jsonInfos) {
    throw new Error("No Liquidity Info found!");
  }

  const sdkParsedInfos = await sdkParseJsonLiquidityInfo(jsonInfos, connection);

  const pools = jsonInfos.map((jsonInfo, idx) => ({
    poolKeys: jsonInfo2PoolKeys(jsonInfo),
    poolInfo: sdkParsedInfos[idx],
  }));

  const {
    minAmountOut,
    fee,
    currentPrice,
    priceImpact,
    routes,
    ...bestAmountOutParams
  } = Trade.getBestAmountOut({
    pools,
    amountIn,
    currencyOut,
    slippage: toPercent(slippage),
  });

  const amountOut = bestAmountOutParams.amountOut as TokenAmount;

  console.log(
    `1 ${amountIn.currency.symbol} ??? ${currentPrice?.toFixed(
      currencyOut.decimals
    )} ${currencyOut.symbol}`
  );

  console.log(
    `Swap ${amountIn.toFixed(amountIn.currency.decimals)} ${
      amountIn.currency.symbol
    } will get ${amountOut.toFixed(currencyOut.decimals)} ${
      currencyOut.symbol
    }.`
  );

  console.log(
    `Minimum Received:  ${minAmountOut.toFixed(
      minAmountOut.currency.decimals
    )} ${minAmountOut.currency.symbol}`
  );

  console.log(`Price Impact:  ${priceImpact.mul(100).toFixed(8)}%`);

  console.log(
    `Fees: ${fee
      .map((f) => `${f.toFixed(f.currency.decimals)} ${f.currency.symbol}`)
      .join(" ")}`
  );

  return [amountOut, routes[0]];
};

const fetchWalletAccounts = async (
  connection: Connection,
  payer: Keypair
): Promise<TokenAccount[]> => {
  const accountInfo = await connection.getTokenAccountsByOwner(
    payer.publicKey,
    { programId: TOKEN_PROGRAM_ID }
  );

  const accounts: TokenAccount[] = [];

  for (const { pubkey, account } of accountInfo.value) {
    const rawResult = SPL_ACCOUNT_LAYOUT.decode(account.data);
    accounts.push({ pubkey, accountInfo: rawResult });
  }

  return accounts;
};

const confirmSwapTransaction = async (
  connection: Connection,
  amountIn: CurrencyAmount,
  amountOut: TokenAmount,
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
    userKeys: {
      tokenAccounts: await fetchWalletAccounts(connection, payer),
      owner: payer.publicKey,
    },
  });

  await attachRecentBlockhash(connection, transaction, payer.publicKey);

  signers.push(payer);
  transaction.partialSign(...signers);

  console.log("Signature Verified: ", transaction.verifySignatures());
  console.log("Transaction:\n", transaction);

  const response = await sendAndConfirmTransaction(
    connection,
    transaction,
    signers,
    { skipPreflight: true }
  );

  return response;
};

export const SwapUtil = Object.freeze({
  askForSwapAmount,
  getBestAmountOut,
  confirmSwapTransaction,
});
