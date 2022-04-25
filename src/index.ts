import { SolanaCurrency } from "./currencies/SolanaCurrency";
import { RaydiumToken } from "./tokens/RaydiumToken";
import { createRealPayer } from "./utils/createRealPayer";
import { createWeb3Connection } from "./utils/createWeb3Connection";
import { WalletUtil } from "./utils/WalletUtil";
import { SwapUtil } from "./utils/SwapUil";

require("dotenv").config();

(async () => {
  const connection = createWeb3Connection();
  const payer = createRealPayer(process.env.WALLET_SECRET_KEY!);

  const balance = await WalletUtil.receiveBalance(
    connection,
    payer.publicKey,
    SolanaCurrency
  );

  const amountIn = SwapUtil.askForSwapAmount(SolanaCurrency, balance);

  const [amountOut, route] = await SwapUtil.getBestAmountOut(
    connection,
    RaydiumToken,
    amountIn
  );

  const transactionResponse = await SwapUtil.confirmSwapTransaction(
    connection,
    amountIn,
    amountOut,
    payer,
    route.keys
  );

  console.log("Transaction Response: ", transactionResponse);
})();
