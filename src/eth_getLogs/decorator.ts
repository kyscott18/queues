import type { AbiEvent } from "abitype";
import type {
  BlockNumber,
  BlockTag,
  Chain,
  Client,
  GetLogsParameters,
  GetLogsReturnType,
  Transport,
} from "viem";
import { getLogs } from "./getLogs";

export const ponderActions = <
  TChain extends Chain | undefined = Chain | undefined,
>(
  client: Client<Transport, TChain>,
) => ({
  getLogs: <
    const TAbiEvent extends AbiEvent | undefined = undefined,
    const TAbiEvents extends
      | readonly AbiEvent[]
      | readonly unknown[]
      | undefined = TAbiEvent extends AbiEvent ? [TAbiEvent] : undefined,
    TStrict extends boolean | undefined = undefined,
    TFromBlock extends BlockNumber | BlockTag | undefined = undefined,
    TToBlock extends BlockNumber | BlockTag | undefined = undefined,
  >(
    args: GetLogsParameters<
      TAbiEvent,
      TAbiEvents,
      TStrict,
      TFromBlock,
      TToBlock
    >,
  ): Promise<
    GetLogsReturnType<TAbiEvent, TAbiEvents, TStrict, TFromBlock, TToBlock>
  > =>
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    getLogs(client, args as any) as Promise<
      GetLogsReturnType<TAbiEvent, TAbiEvents, TStrict, TFromBlock, TToBlock>
    >,
});
