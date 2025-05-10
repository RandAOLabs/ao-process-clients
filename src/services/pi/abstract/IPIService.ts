import { PIToken } from "../../../clients/pi/oracle/abstract/IPIOracleClient";
import { TokenClient } from "../../../clients/ao";
import { PITokenClient } from "../../../clients/pi/PIToken/PITokenClient";
import { DelegationInfo, DelegationPreference } from "../../../clients/pi/delegate/abstract/IPIDelegateClient";
import { ProjectDelegationTotal, DelegationRecord } from "../../../clients/pi/historian/IDelegationHistorianClient";
import { TickHistoryEntry } from "../../../clients/pi/PIToken/abstract/IPITokenClient";

/**
 * Interface representing a PI token with extended information from 
 * oracle, delegate, and historian services
 */
export interface PITokenExtended {
    // Token identification
    id: string;
    ticker: string;
    process: string;
    status: string;
    
    // Clients for interacting with the token
    piTokenClient?: PITokenClient;
    baseTokenClient?: TokenClient;
    
    // Additional data that may be available
    balance?: string;
    claimableBalance?: string;
    tickHistory?: TickHistoryEntry[];
    delegations?: DelegationPreference[];
    
    // Fields from the oracle
    treasury?: string;
    flp_token_ticker?: string;
    flp_token_process?: string;
    flp_token_logo?: string;
    total_token_supply?: string;
    distributed_qty?: string;
    accumulated_qty?: string;
    
    // Any other fields from the original PIToken
    [key: string]: any;
}

/**
 * Re-export DelegationPreference from delegate client
 */
export { DelegationPreference }

/**
 * Interface for the PI Service 
 */
export interface IPIService {
    /**
     * Gets all available PI tokens with extended information
     * @returns Promise resolving to an array of PI tokens with extended information
     */
    getAllPITokens(): Promise<PITokenExtended[]>;
    
    /**
     * Gets a specific PI token by ticker
     * @param ticker The ticker symbol of the token
     * @returns Promise resolving to a PI token with extended information
     */
    getPITokenByTicker(ticker: string): Promise<PITokenExtended | undefined>;
    
    /**
     * Gets a specific PI token by process ID
     * @param processId The process ID of the token
     * @returns Promise resolving to a PI token with extended information
     */
    getPITokenByProcessId(processId: string): Promise<PITokenExtended | undefined>;
    
    /**
     * Gets delegation information for the current wallet
     * @param walletAddress Optional wallet address to get delegations for
     * @returns Promise resolving to delegation information
     */
    getUserDelegations(walletAddress?: string): Promise<DelegationInfo>;
    
    /**
     * Sets a delegation preference
     * @param walletFrom The wallet address from which the delegation is made
     * @param walletTo The wallet address to delegate to
     * @param factor The factor value representing delegation strength
     * @returns Promise resolving to a string with the result of the operation
     */
    setDelegation(walletFrom: string, walletTo: string, factor: number): Promise<string>;
    
    /**
     * Gets historical delegation records
     * @param count Number of records to fetch
     * @returns Promise resolving to an array of delegation records
     */
    getDelegationHistory(count: number): Promise<DelegationRecord[]>;
    
    /**
     * Gets the total delegated AO by project
     * @returns Promise resolving to an array of project delegation totals
     */
    getTotalDelegatedAOByProject(): Promise<ProjectDelegationTotal[]>;
    
    /**
     * Creates token client pairs for a specific token by ticker
     * @param ticker The ticker symbol of the token
     * @returns Promise resolving to a tuple containing PITokenClient and TokenClient
     */
    createClientPairByTicker(ticker: string): Promise<[PITokenClient, TokenClient] | undefined>;
}

/**
 * Exports for index.ts
 */
// No additional types export needed
