import { Connection, PublicKey } from "@solana/web3.js";
import {
  jsonInfo2PoolKeys,
  Liquidity,
  LiquidityPoolJsonInfo,
  ReplaceType,
} from "@raydium-io/raydium-sdk";
import BN from "bn.js";

export type SDKParsedLiquidityInfo = ReplaceType<
  LiquidityPoolJsonInfo,
  string,
  PublicKey
> & {
  jsonInfo: LiquidityPoolJsonInfo;
  status: BN; // do not know what is this
  baseDecimals: number;
  quoteDecimals: number;
  lpDecimals: number;
  baseReserve: BN;
  quoteReserve: BN;
  lpSupply: BN;
  startTime: BN;
};

export const sdkParseJsonLiquidityInfo = async (
  liquidityJsonInfos: LiquidityPoolJsonInfo[],
  connection: Connection
): Promise<SDKParsedLiquidityInfo[]> => {
  if (!connection) return [];
  if (!liquidityJsonInfos.length) return []; // no jsonInfo
  try {
    const info = await Liquidity.fetchMultipleInfo({
      connection,
      pools: liquidityJsonInfos.map(jsonInfo2PoolKeys),
    });
    const result = info.map((sdkParsed, idx) => ({
      jsonInfo: liquidityJsonInfos[idx],
      ...jsonInfo2PoolKeys(liquidityJsonInfos[idx]),
      ...sdkParsed,
    }));
    return result;
  } catch (err) {
    console.error(err);
    return [];
  }
};
