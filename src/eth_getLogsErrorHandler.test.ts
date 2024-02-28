import { expect, test } from "bun:test";
import {
  http,
  type EIP1193RequestFn,
  HttpRequestError,
  InvalidParamsRpcError,
  LimitExceededRpcError,
  type PublicRpcSchema,
  RpcError,
  RpcRequestError,
  hexToBigInt,
} from "viem";
import { base, mainnet } from "viem/chains";
import {
  type EthGetLogsHandlerParameters,
  eth_getLogsErrorHandler,
} from "./eth_getLogsErrorHandler";

type Params = EthGetLogsHandlerParameters["params"];

const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const HAYDEN = "0xA5A2BAeE442ac53534075f6240e4Df0387c8127b";

const fromBlock = hexToBigInt("0x800000");

test("cloudflare-eth block range", async () => {
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

  expect(error).toBeInstanceOf(RpcRequestError);

  const retry = eth_getLogsErrorHandler({
    params: [
      {
        fromBlock: "0x800000",
        toBlock: "0x800320",
      },
    ],
    error: error as RpcError,
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

test("ankr block range", async () => {
  const request = http(" https://rpc.ankr.com/eth")({
    chain: mainnet,
  }).request as EIP1193RequestFn<PublicRpcSchema>;

  const error = await request({
    method: "eth_getLogs",
    params: [
      {
        fromBlock: "0x800000",
        toBlock: "0x800c00",
      },
    ],
  }).catch((error) => error);

  // block range is too wide, 0xb00 chunks

  expect(error).toBeInstanceOf(RpcError);

  const retry = eth_getLogsErrorHandler({
    params: [
      {
        fromBlock: "0x800000",
        toBlock: "0x800c00",
      },
    ],
    error: error as RpcError,
  });
});

test("alchemy response size", async () => {
  const request = http(process.env.RPC_URL_ALCHEMY_1)({
    chain: mainnet,
  }).request as EIP1193RequestFn<PublicRpcSchema>;

  const error = await request({
    method: "eth_getLogs",
    params: [
      {
        fromBlock: "0x800000",
        toBlock: "0x8007d1",
      },
    ],
  }).catch((error) => error);

  expect(error).toBeInstanceOf(RpcError);

  const retry = eth_getLogsErrorHandler({
    params: [
      {
        fromBlock: "0x800000",
        toBlock: "0x8007d1",
      },
    ],
    error: error as RpcError,
  });
});

test("quicknode block range", async () => {
  const request = http(process.env.RPC_URL_QUICKNODE_1)({
    chain: mainnet,
  }).request as EIP1193RequestFn<PublicRpcSchema>;

  const error = await request({
    method: "eth_getLogs",
    params: [
      {
        fromBlock: "0x800000",
        toBlock: "0x802711",
      },
    ],
  }).catch((error) => error);

  expect(error).toBeInstanceOf(HttpRequestError);

  const retry = eth_getLogsErrorHandler({
    params: [
      {
        fromBlock: "0x800000",
        toBlock: "0x802711",
      },
    ],
    error: error as RpcError,
  });
});

test("infura response size", async () => {
  const request = http(process.env.RPC_URL_INFURA_1)({
    chain: mainnet,
  }).request as EIP1193RequestFn<PublicRpcSchema>;

  const error = await request({
    method: "eth_getLogs",
    params: [
      {
        fromBlock: "0x800000",
        toBlock: "0x802711",
      },
    ],
  }).catch((error) => error);

  expect(error).toBeInstanceOf(LimitExceededRpcError);

  const retry = eth_getLogsErrorHandler({
    params: [
      {
        fromBlock: "0x800000",
        toBlock: "0x802711",
      },
    ],
    error: error as RpcError,
  });
});

test("thirdweb response size", async () => {
  const request = http("https://1.rpc.thirdweb.com")({
    chain: mainnet,
  }).request as EIP1193RequestFn<PublicRpcSchema>;

  const error = await request({
    method: "eth_getLogs",
    params: [
      {
        fromBlock: "0x800000",
        toBlock: "0x8007d0",
      },
    ],
  }).catch((error) => error);

  expect(error).toBeInstanceOf(InvalidParamsRpcError);

  const retry = eth_getLogsErrorHandler({
    params: [
      {
        fromBlock: "0x800000",
        toBlock: "0x8007d0",
      },
    ],
    error: error as RpcError,
  });
});

test("thirdweb block range", async () => {
  const request = http("https://1.rpc.thirdweb.com")({
    chain: mainnet,
  }).request as EIP1193RequestFn<PublicRpcSchema>;

  const error = await request({
    method: "eth_getLogs",
    params: [
      {
        fromBlock: "0x800000",
        toBlock: "0x807d00",
      },
    ],
  }).catch((error) => error);

  expect(error).toBeInstanceOf(InvalidParamsRpcError);

  const retry = eth_getLogsErrorHandler({
    params: [
      {
        fromBlock: "0x800000",
        toBlock: "0x8007d0",
      },
    ],
    error: error as RpcError,
  });
});

// typed params
// test valid requests
