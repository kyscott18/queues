import { expect, test } from "bun:test";
import { RpcRequestError, numberToHex } from "viem";
import { eth_getLogsErrorHandler } from "../eth_getLogsErrorHandler";
import { type Params, UNI, fromBlock, getRequest } from "./utils";

const request = getRequest("https://cloudflare-eth.com");
const maxBlockRange = 799n;

test("cloudflare success", async () => {
  const logs = await request({
    method: "eth_getLogs",
    params: [
      {
        address: UNI,
        fromBlock: numberToHex(fromBlock),
        toBlock: numberToHex(fromBlock + maxBlockRange),
      },
    ],
  });

  expect(logs).toHaveLength(7);
});

test("cloudflare block range", async () => {
  const params: Params = [
    {
      fromBlock: numberToHex(fromBlock),
      toBlock: numberToHex(fromBlock + maxBlockRange + 1n),
    },
  ];

  const error = await request({
    method: "eth_getLogs",
    params,
  }).catch((error) => error);

  expect(error).toBeInstanceOf(RpcRequestError);

  const retry = eth_getLogsErrorHandler({
    params,
    error,
  });

  expect(retry).toStrictEqual({
    shouldRetry: true,
    ranges: [
      {
        fromBlock: numberToHex(fromBlock),
        toBlock: numberToHex(fromBlock + maxBlockRange),
      },
      {
        fromBlock: numberToHex(fromBlock + maxBlockRange + 1n),
        toBlock: numberToHex(fromBlock + maxBlockRange + 1n),
      },
    ],
  });
});
