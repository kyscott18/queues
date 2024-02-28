import {
  type Address,
  type Hex,
  type LogTopic,
  RpcRequestError,
  hexToBigInt,
  numberToHex,
} from "viem";

type EthGetLogsHandlerParameters = {
  error: RpcRequestError;
  params: [
    {
      address?: Address | Address[];
      topics?: LogTopic[];
      fromBlock: Hex;
      toBlock: Hex;
    },
  ];
};

type EthGetLogsErrorHandlerReturnType =
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

  return {
    shouldRetry: false,
  };
};
