import { DryRunResult } from "@permaweb/aoconnect/dist/lib/dryrun";
import { PITokenClient } from "../../PIToken/PITokenClient";
import { TokenClient } from "../../../ao";

/**
 * Represents a PI token from the Oracle in the updated format
 */
export interface PIToken {
    // New format fields
    id: string;
    ticker: string;
    process: string;
    status: string;
    treasury?: string;
    name?: string;
    
    // Legacy fields for backward compatibility
    flp_id?: string;
    flp_name?: string;
    flp_token_name?: string;
    flp_token_ticker?: string;
    flp_token_process?: string;
    flp_token_denomination?: string;
    flp_token_logo?: string;
    flp_token_disclaimer?: string;
    flp_short_description?: string;
    flp_long_description?: string;
    deployer?: string;
    created_at_ts?: number;
    starts_at_ts?: number;
    ends_at_ts?: number;
    last_updated_at_ts?: number;
    stats_updated_at?: number;
    last_day_distribution?: string;
    total_token_supply?: string;
    token_supply_to_use?: string;
    decay_factor?: number | string;
    token_unlock_at_ts?: number;
    latest_yield_cycle?: string;
    total_yield_ticks?: string;
    distributed_qty?: string;
    accumulated_qty?: string;
    withdrawn_qty?: string;
    accumulated_pi_qty?: string;
    withdrawn_pi_qty?: string;
    exchanged_for_pi_qty?: string;
    website_url?: string;
    twitter_handle?: string;
    telegram_handle?: string;
}

/**
 * Interface for interacting with the PI Oracle process.
 * The Oracle provides information about all available PI tokens.
 */
export interface IPIOracleClient {
    /**
     * Gets information about the PI Oracle process.
     * @returns Promise resolving to a DryRunResult with oracle information
     */
    getInfo(): Promise<DryRunResult>;
    
    /**
     * Gets all available PI tokens from the delegation oracle.
     * @returns Promise resolving to a list of PI tokens as a string
     */
    getPITokens(): Promise<string>;
    
    /**
     * Parse the raw PI tokens string into a structured array
     * @param piTokensData Raw PI tokens data string
     * @returns Parsed PI tokens
     */
    parsePITokens(piTokensData: string): PIToken[];
    
    /**
     * Gets a map of all PI tokens with their token process IDs and other details
     * @returns A map of token ticker to token details
     */
    getTokensMap(): Promise<Map<string, PIToken>>;

    /**
     * Create a PITokenClient for a specific token process ID
     * @param processId The process ID of the token to create a client for
     * @returns A configured PITokenClient
     */
    createTokenClient(processId: string): PITokenClient;

    /**
     * Creates token clients for all available PI tokens
     * @returns A map of token ticker to PITokenClient instances
     * @deprecated Use createTokenClientPairs instead
     */
    createTokenClients(): Promise<Map<string, PITokenClient>>;

    /**
     * Creates an array of PITokenClient instances for all available PI tokens
     * @returns An array of PITokenClient instances
     * @deprecated Use createTokenClientPairsArray instead
     */
    createTokenClientsArray(): Promise<PITokenClient[]>;
    
    /**
     * Creates token client pairs for all available PI tokens
     * The first item is a PITokenClient created with the id field
     * The second item is a BaseToken client created with the process field
     * @returns A map of token ticker to [PITokenClient, TokenClient] tuples
     */
    createTokenClientPairs(): Promise<Map<string, [PITokenClient, TokenClient]>>;

    /**
     * Creates an array of token client pairs for all available PI tokens
     * Each pair contains a PITokenClient created with the id field and a BaseToken client created with the process field
     * @returns An array of [PITokenClient, TokenClient] tuples
     */
    createTokenClientPairsArray(): Promise<[PITokenClient, TokenClient][]>;
}
