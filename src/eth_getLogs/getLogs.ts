import type { AbiEvent } from "abitype";
import {
  type BlockNumber,
  type BlockTag,
  type Chain,
  type Client,
  type EncodeEventTopicsParameters,
  type GetLogsParameters,
  type GetLogsReturnType,
  type LogTopic,
  RpcError,
  type RpcLog,
  type Transport,
  encodeEventTopics,
  formatLog,
  isHex,
  numberToHex,
  parseEventLogs,
} from "viem";
import type { Params } from "./_test/utils";
import { eth_getLogsErrorHandler } from "./eth_getLogsErrorHandler";

/**
 * Returns a list of event logs matching the provided parameters.
 *
 * - Docs: https://viem.sh/docs/actions/public/getLogs
 * - Examples: https://stackblitz.com/github/wevm/viem/tree/main/examples/filters-and-logs/event-logs
 * - JSON-RPC Methods: [`eth_getLogs`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getlogs)
 *
 * @param client - Client to use
 * @param parameters - {@link GetLogsParameters}
 * @returns A list of event logs. {@link GetLogsReturnType}
 *
 * @example
 * import { createPublicClient, http, parseAbiItem } from 'viem'
 * import { mainnet } from 'viem/chains'
 * import { getLogs } from 'viem/public'
 *
 * const client = createPublicClient({
 *   chain: mainnet,
 *   transport: http(),
 * })
 * const logs = await getLogs(client)
 */
export async function getLogs<
  TChain extends Chain | undefined,
  const TAbiEvent extends AbiEvent | undefined = undefined,
  const TAbiEvents extends
    | readonly AbiEvent[]
    | readonly unknown[]
    | undefined = TAbiEvent extends AbiEvent ? [TAbiEvent] : undefined,
  TStrict extends boolean | undefined = undefined,
  TFromBlock extends BlockNumber | BlockTag | undefined = undefined,
  TToBlock extends BlockNumber | BlockTag | undefined = undefined,
>(
  client: Client<Transport, TChain>,
  {
    address,
    blockHash,
    fromBlock,
    toBlock,
    event,
    events: events_,
    args,
    strict: strict_,
  }: GetLogsParameters<
    TAbiEvent,
    TAbiEvents,
    TStrict,
    TFromBlock,
    TToBlock
  > = {},
): Promise<GetLogsReturnType<TAbiEvent, TAbiEvents, TStrict>> {
  const strict = strict_ ?? false;
  const events = events_ ?? (event ? [event] : undefined);

  let topics: LogTopic[] = [];
  if (events) {
    topics = [
      (events as AbiEvent[]).flatMap((event) =>
        encodeEventTopics({
          abi: [event],
          eventName: (event as AbiEvent).name,
          args,
        } as EncodeEventTopicsParameters),
      ),
    ];
    if (event) topics = topics[0] as LogTopic[];
  }

  let logs: RpcLog[];
  if (blockHash) {
    logs = await client.request({
      method: "eth_getLogs",
      params: [{ address, topics, blockHash }],
    });
  } else if (
    typeof fromBlock !== "bigint" &&
    !isHex(fromBlock) &&
    typeof toBlock !== "bigint" &&
    !isHex(toBlock)
  ) {
    logs = await client.request({
      method: "eth_getLogs",
      params: [
        {
          address,
          topics,
          fromBlock: fromBlock as BlockTag | undefined,
          toBlock: toBlock as BlockTag | undefined,
        },
      ],
    });
  } else {
    logs = [];

    const params: Params = [
      {
        address,
        topics,
        fromBlock:
          typeof fromBlock === "bigint" ? numberToHex(fromBlock) : fromBlock,
        toBlock: typeof toBlock === "bigint" ? numberToHex(toBlock) : toBlock,
      },
    ] as Params;

    try {
      const _logs = await client.request({
        method: "eth_getLogs",
        params,
      });

      logs.push(..._logs);
    } catch (error) {
      const retry = eth_getLogsErrorHandler({
        params,
        error: error as RpcError,
      });

      if (!retry.shouldRetry) throw error;

      for (const { fromBlock, toBlock } of retry.ranges) {
        const _params: Params = [
          {
            address,
            topics,
            fromBlock,
            toBlock,
          },
        ] as Params;

        const _logs = await client.request({
          method: "eth_getLogs",
          params: _params,
        });

        logs.push(..._logs);
      }
    }
  }

  const formattedLogs = logs.map((log) => formatLog(log));
  if (!events)
    return formattedLogs as GetLogsReturnType<TAbiEvent, TAbiEvents, TStrict>;
  return parseEventLogs({
    abi: events,
    logs: formattedLogs,
    strict,
  }) as unknown as GetLogsReturnType<TAbiEvent, TAbiEvents, TStrict>;
}
