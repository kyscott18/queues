import { expect, test } from "bun:test";
import { LimitExceededRpcError, numberToHex } from "viem";
import { eth_getLogsErrorHandler } from "../eth_getLogsErrorHandler";
import { type Params, UNI, WETH, fromBlock, getRequest } from "./utils";

const request = getRequest(process.env.RPC_URL_INFURA_1!);

test.skip(
  "infura success",
  async () => {
    const logs = await request({
      method: "eth_getLogs",
      params: [
        {
          address: UNI,
          fromBlock: numberToHex(fromBlock),
          toBlock: numberToHex(fromBlock + 1_000n),
        },
      ],
    });

    expect(logs).toHaveLength(49);
  },
  { timeout: 15_000 },
);

test("infura", async () => {
  const params: Params = [
    {
      address: WETH,
      fromBlock: numberToHex(fromBlock),
      toBlock: numberToHex(fromBlock + 1_000n),
    },
  ];

  const error = await request({
    method: "eth_getLogs",
    params,
  }).catch((error) => error);

  expect(error).toBeInstanceOf(LimitExceededRpcError);

  const retry = eth_getLogsErrorHandler({
    params,
    error,
  });

  expect(retry.shouldRetry).toBe(true);
  expect(retry.ranges).toHaveLength(8);
  expect(retry.ranges![0]).toStrictEqual({
    fromBlock: "0x112a880",
    toBlock: "0x112a907",
  });
});
