import { expect, test } from "bun:test";
import {
  http,
  type EIP1193RequestFn,
  type PublicRpcSchema,
  RpcRequestError,
} from "viem";
import { mainnet } from "viem/chains";
import { eth_getLogsErrorHandler } from "./eth_getLogsErrorHandler";

test("cloudflare-eth too large range", async () => {
  const request = http("https://cloudflare-eth.com")({
    chain: mainnet,
  }).request as EIP1193RequestFn<PublicRpcSchema>;

  const error = await request({
    method: "eth_getLogs",
    params: [
      {
        fromBlock: "0x800000",
        toBlock: "0x800320",
      },
    ],
  }).catch((error) => error);

  expect(error instanceof RpcRequestError).toBe(true);

  const retry = eth_getLogsErrorHandler({
    params: [
      {
        fromBlock: "0x800000",
        toBlock: "0x800320",
      },
    ],
    error: error as RpcRequestError,
  });

  expect(retry).toStrictEqual({
    shouldRetry: true,
    ranges: [
      {
        fromBlock: "0x800000",
        toBlock: "0x80031f",
      },
      {
        fromBlock: "0x800320",
        toBlock: "0x800320",
      },
    ],
  });
});
