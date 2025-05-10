import { PIOracleClient } from "../../clients/pi/oracle/PIOracleClient";
import { PIDelegateClient } from "../../clients/pi/delegate/PIDelegateClient";
import { DelegationHistorianClient } from "../../clients/pi/historian/DelegationHistorianClient";
import { PITokenClient } from "../../clients/pi/PIToken/PITokenClient";
import { TokenClient } from "../../clients/ao";
import { IPIService, PITokenExtended, DelegationPreference } from "./abstract/IPIService";
import { DelegationInfo } from "../../clients/pi/delegate/abstract/IPIDelegateClient";
import { PIToken } from "../../clients/pi/oracle/abstract/IPIOracleClient";
import { DelegationRecord, ProjectDelegationTotal } from "../../clients/pi/historian/IDelegationHistorianClient";
import { IAutoconfiguration, staticImplements } from "../../utils";
import { AO_CONFIGURATIONS } from "../../core/ao/ao-client/configurations";

/**
 * Service for combining PI-related functionality
 * @category PI
 */
@staticImplements<IAutoconfiguration>()
export class PIService implements IPIService {
    constructor(
        private readonly oracleClient: PIOracleClient,
        private readonly delegateClient: PIDelegateClient,
        private readonly historianClient: DelegationHistorianClient
    ) {}

    /** 
     * {@inheritdoc IAutoconfiguration.autoConfiguration}
     * @see {@link IAutoconfiguration.autoConfiguration} 
     */
    public static async autoConfiguration(): Promise<IPIService> {
        return new PIService(
            await PIOracleClient.autoConfiguration(),
            await PIDelegateClient.autoConfiguration(),
            await DelegationHistorianClient.autoConfiguration()
        );
    }

    /**
     * Gets all available PI tokens with extended information
     * @returns Promise resolving to an array of PI tokens with extended information
     */
    async getAllPITokens(): Promise<PITokenExtended[]> {
        try {
            // Get base token data from oracle
            const tokensData = await this.oracleClient.getPITokens();
            const tokens = this.oracleClient.parsePITokens(tokensData);
            
            // Create client pairs for all tokens
            const clientPairs = await this.oracleClient.createTokenClientPairsArray();
            
            // Create a client pair map for easy lookup
            const clientPairMap = new Map<string, [PITokenClient, TokenClient]>();
            for (let i = 0; i < tokens.length && i < clientPairs.length; i++) {
                const token = tokens[i];
                const pair = clientPairs[i];
                if (token.id && pair) {
                    clientPairMap.set(token.id, pair);
                }
            }
            
            // Try to get delegation info
            let delegationInfo: DelegationInfo | undefined;
            try {
                const delegationData = await this.delegateClient.getDelegation();
                delegationInfo = this.delegateClient.parseDelegationInfo(delegationData);
            } catch (error) {
                console.warn('Failed to get delegation info:', error);
            }
            
            // Try to get historical data
            let lastRecord: DelegationRecord | undefined;
            try {
                lastRecord = await this.historianClient.getLastRecord();
            } catch (error) {
                console.warn('Failed to get delegation history:', error);
            }
            
            // Enhanced token array with extended information
            const extendedTokens = tokens.map(token => {
                // Get client pair for this token
                const clientPair = token.id ? clientPairMap.get(token.id) : undefined;
                
                // Create extended token object
                const extendedToken: PITokenExtended = {
                    ...token,
                    piTokenClient: clientPair?.[0],
                    baseTokenClient: clientPair?.[1],
                    delegations: this.findUserDelegationsForToken(delegationInfo, token)
                };
                
                // Add historical data if available
                if (lastRecord && lastRecord.delegations && token.process) {
                    const historicalAmount = lastRecord.delegations[token.process];
                    if (historicalAmount) {
                        extendedToken.historicalDelegation = historicalAmount;
                    }
                }
                
                return extendedToken;
            });
            
            return extendedTokens;
        } catch (error) {
            console.error('Error in getAllPITokens:', error);
            return [];
        }
    }
    
    /**
     * Gets a specific PI token by ticker
     * @param ticker The ticker symbol of the token
     * @returns Promise resolving to a PI token with extended information
     */
    async getPITokenByTicker(ticker: string): Promise<PITokenExtended | undefined> {
        try {
            const allTokens = await this.getAllPITokens();
            return allTokens.find(token => 
                token.ticker === ticker || 
                token.flp_token_ticker === ticker
            );
        } catch (error) {
            console.error(`Error in getPITokenByTicker for ${ticker}:`, error);
            return undefined;
        }
    }
    
    /**
     * Gets a specific PI token by process ID
     * @param processId The process ID of the token
     * @returns Promise resolving to a PI token with extended information
     */
    async getPITokenByProcessId(processId: string): Promise<PITokenExtended | undefined> {
        try {
            const allTokens = await this.getAllPITokens();
            return allTokens.find(token => 
                token.id === processId || 
                token.process === processId || 
                token.flp_token_process === processId
            );
        } catch (error) {
            console.error(`Error in getPITokenByProcessId for ${processId}:`, error);
            return undefined;
        }
    }
    
    /**
     * Gets delegation information for the current wallet
     * @param walletAddress Optional wallet address to get delegations for
     * @returns Promise resolving to delegation information
     */
    async getUserDelegations(walletAddress?: string): Promise<DelegationInfo> {
        try {
            const delegationData = await this.delegateClient.getDelegation(walletAddress);
            return this.delegateClient.parseDelegationInfo(delegationData);
        } catch (error) {
            console.error('Error in getUserDelegations:', error);
            // Return empty delegation info in case of error
            return {
                totalFactor: "0",
                delegationPrefs: [],
                lastUpdate: 0,
                wallet: walletAddress || "unknown"
            };
        }
    }
    
    /**
     * Sets a delegation preference
     * @param walletFrom The wallet address from which the delegation is made
     * @param walletTo The wallet address to delegate to
     * @param factor The factor value representing delegation strength
     * @returns Promise resolving to a string with the result of the operation
     */
    async setDelegation(walletFrom: string, walletTo: string, factor: number): Promise<string> {
        try {
            return await this.delegateClient.setDelegation({
                walletFrom,
                walletTo,
                factor
            });
        } catch (error) {
            console.error('Error in setDelegation:', error);
            throw error;
        }
    }
    
    /**
     * Gets historical delegation records
     * @param count Number of records to fetch
     * @returns Promise resolving to an array of delegation records
     */
    async getDelegationHistory(count: number): Promise<DelegationRecord[]> {
        try {
            return await this.historianClient.getLastNRecords(count);
        } catch (error) {
            console.error('Error in getDelegationHistory:', error);
            return [];
        }
    }
    
    /**
     * Gets the total delegated AO by project
     * @returns Promise resolving to an array of project delegation totals
     */
    async getTotalDelegatedAOByProject(): Promise<ProjectDelegationTotal[]> {
        try {
            return await this.historianClient.getTotalDelegatedAOByProject();
        } catch (error) {
            console.error('Error in getTotalDelegatedAOByProject:', error);
            return [];
        }
    }
    
    /**
     * Creates token client pairs for a specific token by ticker
     * @param ticker The ticker symbol of the token
     * @returns Promise resolving to a tuple containing PITokenClient and TokenClient
     */
    async createClientPairByTicker(ticker: string): Promise<[PITokenClient, TokenClient] | undefined> {
        try {
            // Get all token client pairs
            const clientPairsMap = await this.oracleClient.createTokenClientPairs();
            
            // First check if we have a direct match
            if (clientPairsMap.has(ticker)) {
                return clientPairsMap.get(ticker);
            }
            
            // If no direct match, try to find a token with matching ticker
            const tokensData = await this.oracleClient.getPITokens();
            const tokens = this.oracleClient.parsePITokens(tokensData);
            
            // Find the token with the matching ticker
            const token = tokens.find(t => 
                t.ticker === ticker || 
                t.flp_token_ticker === ticker
            );
            
            if (!token) return undefined;
            
            // If the token exists, create clients for it
            if (token.id && token.process) {
                const piTokenClient = PITokenClient.builder()
                    .withProcessId(token.id)
                    .withAOConfig(AO_CONFIGURATIONS.RANDAO)
                    .build();
                
                const baseTokenClient = new TokenClient({
                    processId: token.process,
                    aoConfig: AO_CONFIGURATIONS.RANDAO,
                    wallet: undefined // Will use the default wallet configured in the AO connection
                });
                
                return [piTokenClient, baseTokenClient];
            }
            
            return undefined;
        } catch (error) {
            console.error(`Error in createClientPairByTicker for ${ticker}:`, error);
            return undefined;
        }
    }
    
    /**
     * Helper function to find user delegations for a specific token
     * @param delegationInfo User delegation information
     * @param token PI token information
     * @returns Array of delegation preferences for the token
     * @private
     */
    private findUserDelegationsForToken(
        delegationInfo: DelegationInfo | undefined, 
        token: PIToken
    ): DelegationPreference[] | undefined {
        if (!delegationInfo || !delegationInfo.delegationPrefs.length) {
            return undefined;
        }
        
        // The process ID or treasury might be delegated to
        const targetAddresses = [
            token.process,
            token.flp_token_process,
            token.treasury
        ].filter(Boolean) as string[];
        
        if (!targetAddresses.length) {
            return undefined;
        }
        
        // Find delegations that match any of the target addresses
        return delegationInfo.delegationPrefs
            .filter(pref => targetAddresses.includes(pref.walletTo))
            .map(pref => ({
                walletTo: pref.walletTo,
                factor: pref.factor
            }));
    }
}
