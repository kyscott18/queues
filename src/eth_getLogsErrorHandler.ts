import {
  type Address,
  type Hex,
  InvalidParamsRpcError,
  type LogTopic,
  RpcError,
  hexToBigInt,
  numberToHex,
} from "viem";

export type EthGetLogsHandlerParameters = {
  error: RpcError;
  params: [
    {
      address?: Address | Address[];
      topics?: LogTopic[];
      fromBlock: Hex;
      toBlock: Hex;
    },
  ];
};

export type EthGetLogsErrorHandlerReturnType =
  | {
      shouldRetry: true;
      /** Suggested values to use for (fromBlock, toBlock) in follow-up eth_getLogs requests. */
      ranges: { fromBlock: Hex; toBlock: Hex }[];
    }
  | {
      shouldRetry: false;
      /** Suggested values to use for (fromBlock, toBlock) in follow-up eth_getLogs requests. */
      ranges?: never;
    };

export const eth_getLogsErrorHandler = ({
  params,
  error,
}: EthGetLogsHandlerParameters): EthGetLogsErrorHandlerReturnType => {
  // cloudflare-eth
  if (
    error.code === -32047 &&
    error.details.includes("'fromBlock'-'toBlock' range too large") &&
    error.details.match(/Max range: (\d+)/) !== null
  ) {
    const match = error.details.match(/Max range: (\d+)/)!;
    const range = BigInt(match[1]!);

    const ranges: { fromBlock: Hex; toBlock: Hex }[] = [];

    const fromBlock = hexToBigInt(params[0].fromBlock);
    const toBlock = hexToBigInt(params[0].toBlock);

    for (let start = fromBlock; start <= toBlock; start += range) {
      const end = start + range - 1n > toBlock ? toBlock : start + range - 1n;

      ranges.push({
        fromBlock: numberToHex(start),
        toBlock: numberToHex(end),
      });
    }

    return {
      shouldRetry: true,
      ranges,
    } as const;
  }

  // Ankr

  /**
   * -32600 block range is too wide
   */

  // Alchemy
  if (
    error.code === InvalidParamsRpcError.code &&
    error.details.startsWith("Log response size exceeded.")
  ) {
    /**
     * "Log response size exceeded. You can make eth_getLogs requests with up to a 2K block
     * range and no limit on the response size, or you can request any block range with a
     * cap of 10K logs in the response. Based on your parameters and the response size limit,
     * this block range should work: [0x800000, 0x80001f]"
     */
  }

  // Quicknode
  if (
    error.code === -32614 &&
    error.name === "HttpRequestError" &&
    error.details!.includes(
      "eth_getLogs and eth_newFilter are limited to a 10,000 blocks range",
    )
  ) {
    /**
     * Details: {"code":-32614,"message":"eth_getLogs is limited to a 10,000 range"}
     */
  }

  // Infura
  /**
   * "code": -32005,
   *  "data": {
   *    "from": "0x800000",
   *    "limit": 10000,
   *    "to": "0x800054"
   *  },
   *  "message": "query returned more than 10000 results. Try with this block range [0x800000, 0x800054]."
   */

  // Thirdweb
  /**
   * "code": -32602,
   * "message": "invalid params",
   * "data": "range 20000 is bigger than range limit 2000"
   *
   * "code": -32602,
   * "message": "invalid params",
   * "data": "Query returned more than 10000 results. Try with this block range [0x800000, 0x800054]."
   */

  // TODO(kyle) should record no match found
  return {
    shouldRetry: false,
  };
};
