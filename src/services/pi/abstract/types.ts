import { PITokenClient } from "../../../clients/pi/PIToken/PITokenClient";
import { TokenClient } from "../../../clients/ao";
import { TickHistoryEntry } from "../../../clients/pi/PIToken/abstract/IPITokenClient";

/**
 * Interface for PI token aggregate data that combines information from
 * all PI-related services
 */
export interface PITokenAggregate {
    // Basic token identification
    id: string;
    ticker: string;
    processId: string;
    status: string;
    
    // Client instances
    piTokenClient?: PITokenClient;
    baseTokenClient?: TokenClient;
    
    // User-specific data
    userBalance?: string;
    userClaimableBalance?: string;
    
    // Token performance data
    tickHistory?: TickHistoryEntry[];
    
    // Delegation data
    delegatedAmount?: string;
    userDelegations?: Array<{
        targetWallet: string;
        factor: number;
    }>;
    
    // Historical delegation data
    delegationHistory?: Array<{
        timestamp: number;
        amount: string;
    }>;
    
    // Additional details from original sources
    oracleDetails?: Record<string, any>;
    historianDetails?: Record<string, any>;
}

/**
 * Interface for delegation update result
 */
export interface DelegationUpdateResult {
    success: boolean;
    message: string;
    walletFrom: string;
    walletTo: string;
    factor: number;
}

/**
 * Interface for token pair 
 */
export interface TokenPair {
    piTokenClient: PITokenClient;
    baseTokenClient: TokenClient;
}

/**
 * Export all types
 */
export * from "./IPIService";
