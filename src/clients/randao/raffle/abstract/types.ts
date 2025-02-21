import { BaseClientConfig } from "src/core/ao/abstract";

export interface RaffleClientConfig extends BaseClientConfig {
    processId: string;
}

export interface RafflePull {
    CallbackId: string;
    User: string;
    Winner?: string;
    Id: number;
}

export interface ViewPullsResponse {
    pulls: RafflePull[];
}
