import {
  ChainType,
  EvmWallet,
  RouteRequest,
  SquidCallType,
  TransactionResponse,
} from "@0xsquid/sdk/dist/types";
import { Interface, JsonRpcProvider, Wallet } from "ethers";
import { Squid } from "@0xsquid/sdk";
import * as dotenv from "dotenv";

import { aaveL2PoolABI } from "../abis/aaveL2Pool";
import { erc20ABI } from "../abis/erc20";

dotenv.config();

const nativeAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const aaveL2PoolAddress = "0x794a61358D6845594F94dc1DB02A252b5b4814aD";
const arbWETHAddress = "0x82af49447d8a07e3bd95bd0d56f35241523fbab1";

const bscProvider = new JsonRpcProvider("https://binance.llamarpc.com");
const signer = new Wallet(process.env.PK as string, bscProvider);

const aavePoolInterface = new Interface(aaveL2PoolABI);
const erc20Interface = new Interface(erc20ABI);

const approvalData = erc20Interface.encodeFunctionData("approve", [
  aaveL2PoolAddress,
  0,
]);
const supplyData = aavePoolInterface.encodeFunctionData(
  "supply(address,uint256,address,uint16)",
  [arbWETHAddress, 0, signer.address, 0]
);

const main = async () => {
  try {
    const squidSdk = new Squid({
      baseUrl: "https://apiplus.squidrouter.com",
      integratorId: "unergy-sdk",
    });

    await squidSdk.init();

    const params = {
      fromChain: "56",
      fromToken: nativeAddress,
      fromAddress: signer.address,
      fromAmount: "2000000000000000",
      toChain: "42161",
      toToken: arbWETHAddress,
      toAddress: signer.address,
      postHook: {
        chainType: ChainType.EVM,
        provider: "AAVE",
        description: "Supply WETH Liquidity to AAVE protocol",
        logoURI: "",
        calls: [
          {
            chainType: ChainType.EVM,
            callType: SquidCallType.FULL_TOKEN_BALANCE,
            target: arbWETHAddress,
            value: "0",
            callData: approvalData,
            payload: {
              tokenAddress: arbWETHAddress,
              inputPos: 1,
            },
            estimatedGas: "30000",
          },
          {
            chainType: ChainType.EVM,
            callType: SquidCallType.FULL_TOKEN_BALANCE,
            target: aaveL2PoolAddress,
            value: "0",
            callData: supplyData,
            payload: {
              tokenAddress: arbWETHAddress,
              inputPos: 1,
            },
            estimatedGas: "300000",
          },
        ],
      },
    } as RouteRequest;

    const { route } = await squidSdk.getRoute(params);

    const tx = await squidSdk.executeRoute({
      route,
      signer: signer as unknown as EvmWallet,
    });

    console.log(tx);

    const txConfirmed = await (tx as TransactionResponse).wait();

    console.log(txConfirmed);
  } catch (error) {
    console.log(error);
  }
};

main();
