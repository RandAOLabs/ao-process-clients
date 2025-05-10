import { TokenClient } from "../../clients/ao";
import { PITokenClient } from "../../clients/pi/PIToken/PITokenClient";
import { TickHistoryEntry } from "../../clients/pi/PIToken/abstract/IPITokenClient";
import { DelegationInfo, DelegationPreference } from "../../clients/pi/delegate/abstract/IPIDelegateClient";
import { DelegationRecord, ProjectDelegationTotal } from "../../clients/pi/historian/IDelegationHistorianClient";
import { PIToken } from "../../clients/pi/oracle/abstract/IPIOracleClient";
import { IAutoconfiguration, staticImplements } from "../../utils";
import { PITokenExtended } from "./abstract/IPIService";

/**
 * Service for aggregating PI data from different sources
 * @category PI
 */
@staticImplements<IAutoconfiguration>()
export class PIDataAggregator {
    private tokens: Map<string, PITokenExtended> = new Map();
    private delegationInfo?: DelegationInfo;
    private delegationRecords: DelegationRecord[] = [];
    private projectDelegations: ProjectDelegationTotal[] = [];

    /** 
     * {@inheritdoc IAutoconfiguration.autoConfiguration}
     * @see {@link IAutoconfiguration.autoConfiguration} 
     */
    public static async autoConfiguration(): Promise<PIDataAggregator> {
        return new PIDataAggregator();
    }

    /**
     * Updates token data with information from Oracle
     * @param token PI token information from Oracle
     */
    async updateTokenData(token: PIToken): Promise<void> {
        if (!token.id && !token.ticker && !token.process) {
            console.warn('Invalid token data received:', token);
            return;
        }

        const key = token.id || token.ticker || token.process;
        if (!key) return;

        // Get or create token entry
        const extendedToken = this.tokens.get(key) || {
            id: token.id || '',
            ticker: token.ticker || '',
            process: token.process || '',
            status: token.status || 'unknown',
            tickHistory: [], // Initialize with empty array
            piTokenClient: undefined,
            baseTokenClient: undefined
        };
        
        // Save existing values we want to preserve
        const existingValues = {
            piTokenClient: extendedToken.piTokenClient,
            baseTokenClient: extendedToken.baseTokenClient,
            tickHistory: extendedToken.tickHistory
        };

        // Update with token data
        Object.assign(extendedToken, token, {
            // Preserve these specific properties
            piTokenClient: existingValues.piTokenClient,
            baseTokenClient: existingValues.baseTokenClient,
            tickHistory: existingValues.tickHistory
        });

        this.tokens.set(key, extendedToken);
    }

    /**
     * Updates token with client pair
     * @param tokenId Token ID
     * @param piTokenClient PITokenClient instance
     * @param baseTokenClient TokenClient instance
     */
    async updateTokenClients(
        tokenId: string,
        piTokenClient: PITokenClient,
        baseTokenClient: TokenClient
    ): Promise<void> {
        // Get or create token entry
        const extendedToken = this.tokens.get(tokenId) || {
            id: tokenId,
            ticker: '',
            process: tokenId, // Set the process to tokenId as well
            status: 'unknown',
            piTokenClient: undefined,   // Initialize as undefined to match interface
            baseTokenClient: undefined, // Initialize as undefined to match interface
            tickHistory: []        // Initialize with empty array
        };

        // Update with client instances
        extendedToken.piTokenClient = piTokenClient;
        extendedToken.baseTokenClient = baseTokenClient;

        this.tokens.set(tokenId, extendedToken);
    }

    /**
     * Updates token with tick history
     * @param tokenId Token ID
     * @param tickHistory Tick history data
     */
    async updateTickHistory(tokenId: string, tickHistory: TickHistoryEntry[]): Promise<void> {
        // Get or create token entry if it doesn't exist
        let extendedToken = this.tokens.get(tokenId);
        if (!extendedToken) {
            extendedToken = {
                id: tokenId,
                ticker: '',
                process: tokenId,
                status: 'unknown',
                piTokenClient: undefined,
                baseTokenClient: undefined,
                tickHistory: [] // Initialize with empty array
            };
        }
        
        // Update with new tick history
        extendedToken.tickHistory = tickHistory;
        this.tokens.set(tokenId, extendedToken);
    }

    /**
     * Updates user delegations
     * @param delegationInfo Delegation information
     */
    async updateDelegations(delegationInfo: DelegationInfo): Promise<void> {
        this.delegationInfo = delegationInfo;

        // Match delegations to tokens where possible
        if (delegationInfo && delegationInfo.delegationPrefs.length > 0) {
            this.tokens.forEach((token, key) => {
                // The process ID or treasury might be delegated to
                const targetAddresses = [
                    token.process,
                    token.flp_token_process,
                    token.treasury
                ].filter(Boolean) as string[];

                if (targetAddresses.length) {
                    // Find delegations that match any of the target addresses
                    token.delegations = delegationInfo.delegationPrefs
                        .filter(pref => targetAddresses.includes(pref.walletTo))
                        .map(pref => ({
                            walletTo: pref.walletTo,
                            factor: pref.factor
                        }));

                    this.tokens.set(key, token);
                }
            });
        }
    }

    /**
     * Updates delegation history
     * @param records Delegation history records
     */
    async updateDelegationHistory(records: DelegationRecord[]): Promise<void> {
        this.delegationRecords = records;

        // Match historical delegations to tokens
        this.tokens.forEach((token, key) => {
            const processId = token.process || token.flp_token_process;
            if (processId) {
                const history = records
                    .filter(record => record.delegations && record.delegations[processId])
                    .map(record => ({
                        timestamp: record.timestamp,
                        amount: record.delegations[processId]
                    }));
                
                if (history.length > 0) {
                    token.delegationHistory = history;
                    this.tokens.set(key, token);
                }
            }
        });
    }

    /**
     * Updates project delegations
     * @param projects Project delegation totals
     */
    async updateProjectDelegations(projects: ProjectDelegationTotal[]): Promise<void> {
        this.projectDelegations = projects;

        // Match project delegations to tokens
        this.tokens.forEach((token, key) => {
            const processId = token.process || token.flp_token_process;
            if (processId) {
                const project = projects.find(p => p.projectId === processId);
                if (project) {
                    token.totalDelegated = project.amount;
                    this.tokens.set(key, token);
                }
            }
        });
    }

    /**
     * Gets all aggregated token data
     * @returns Array of extended tokens
     */
    getAggregatedTokens(): PITokenExtended[] {
        return Array.from(this.tokens.values());
    }

    /**
     * Gets delegation information
     * @returns Delegation information or undefined if not available
     */
    getDelegationInfo(): DelegationInfo | undefined {
        return this.delegationInfo;
    }

    /**
     * Gets delegation history records
     * @returns Array of delegation records
     */
    getDelegationHistory(): DelegationRecord[] {
        return this.delegationRecords;
    }

    /**
     * Gets project delegation totals
     * @returns Array of project delegation totals
     */
    getProjectDelegations(): ProjectDelegationTotal[] {
        return this.projectDelegations;
    }
}
