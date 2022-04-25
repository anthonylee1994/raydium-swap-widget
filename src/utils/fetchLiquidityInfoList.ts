import axios, { AxiosResponse } from "axios";
import {
  LiquidityPoolJsonInfo,
  LiquidityPoolsJsonFile,
} from "@raydium-io/raydium-sdk";

export const fetchLiquidityInfoList = async (): Promise<
  LiquidityPoolJsonInfo[]
> => {
  const response = await axios.get<
    undefined,
    AxiosResponse<LiquidityPoolsJsonFile>
  >("https://api.raydium.io/v2/sdk/liquidity/mainnet.json");

  const { official } = response.data;

  return official;
};
