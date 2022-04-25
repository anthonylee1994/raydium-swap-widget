import {
  Liquidity,
  CurrencyAmount,
  jsonInfo2PoolKeys,
  Trade,
} from "@raydium-io/raydium-sdk";
import BN from "bn.js";
import { SolanaCurrency } from "./currencies/SolanaCurrency";
import { RaydiumToken } from "./tokens/RaydiumToken";
import { liquidityPoolKeysForRAYSOL } from "./configs/liquidityPoolKeysForRAYSOL";
import { createRealPayer } from "./utils/createRealPayer";
import { attachRecentBlockhash } from "./utils/attachRecentBlockhash";
import { sdkParseJsonLiquidityInfo } from "./utils/sdkParseJsonLiquidityInfo";
import { createWeb3Connection } from "./utils/createWeb3Connection";
import { fetchLiquidityInfoList } from "./utils/fetchLiquidityInfoList";
import { toPercent } from "./utils/toPercent";

require("dotenv").config();

(async () => {
  const connection = createWeb3Connection();
  const payer = createRealPayer(process.env.WALLET_SECRET_KEY!);

  const amountIn = new CurrencyAmount(SolanaCurrency, new BN(1230000));
  const jsonInfos = await fetchLiquidityInfoList();

  if (!jsonInfos) {
    throw new Error("No Farm Info found");
  }

  const sdkParsedInfos = await sdkParseJsonLiquidityInfo(jsonInfos, connection);

  const pools = jsonInfos.map((jsonInfo, idx) => ({
    poolKeys: jsonInfo2PoolKeys(jsonInfo),
    poolInfo: sdkParsedInfos[idx],
  }));

  const { amountOut } = Trade.getBestAmountOut({
    pools,
    amountIn,
    currencyOut: RaydiumToken,
    slippage: toPercent("0.001"),
  });

  const { transaction, signers } = await Liquidity.makeSwapTransaction({
    connection,
    amountIn,
    amountOut,
    fixedSide: "in",
    poolKeys: liquidityPoolKeysForRAYSOL,
    userKeys: { tokenAccounts: [], owner: payer.publicKey },
  });

  await attachRecentBlockhash(connection, transaction, payer.publicKey);
  transaction.partialSign(...signers);

  console.log("Transaction:\n", transaction);

  const response = await connection.sendTransaction(transaction, [
    ...signers,
    payer,
  ]);

  console.log("Transaction Response: ", response);
})();
