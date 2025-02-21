import { RaffleClientConfig } from "src/clients/randao/raffle/abstract";
import { getBaseClientAutoConfiguration } from "src/core/ao/BaseClientAutoConfiguration";
import { RAFFLE_PROCESS_ID } from "src/processes_ids";

export const getRaffleClientAutoConfiguration = (): RaffleClientConfig => ({
    ...getBaseClientAutoConfiguration(),
    processId: RAFFLE_PROCESS_ID,
});
