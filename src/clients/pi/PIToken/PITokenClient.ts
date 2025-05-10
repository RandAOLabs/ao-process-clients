import { DryRunResult } from "@permaweb/aoconnect/dist/lib/dryrun";
import { BaseClient } from "../../../core/ao/BaseClient";
import { Tags } from "../../../core/common";
import { 
    ACTION_BALANCE,
    ACTION_GET_CLAIMABLE_BALANCE,
    ACTION_GET_YIELD_TICK_HISTORY,
    ACTION_TICK_HISTORY,
    ACTION_INFO,
    PI_TOKEN_PROCESS_ID
} from "../constants";
import { IPITokenClient, TickHistoryEntry } from "./abstract/IPITokenClient";
import { PITokenClientError } from "./PITokenClientError";
import { PITokenProcessError } from "./PITokenProcessError";
import { AO_CONFIGURATIONS } from "../../../core/ao/ao-client/configurations";
import { IAutoconfiguration, IDefaultBuilder, staticImplements } from "../../../utils";
import { ClientBuilder } from "../../common";
import { IClassBuilder } from "../../../utils/class-interfaces/IClientBuilder";

/**
 * Client for interacting with a specific PI token process.
 * @category Autonomous Finance
 */
@staticImplements<IAutoconfiguration>()
@staticImplements<IDefaultBuilder>()
@staticImplements<IClassBuilder>()
export class PITokenClient extends BaseClient implements IPITokenClient {
    /**
     * Gets information about the PI token process.
     * @returns Promise resolving to a DryRunResult with token information
     */
    public async getInfo(): Promise<DryRunResult> {
        try {
            return await this.dryrun('', [
                { name: "Action", value: ACTION_INFO }
            ]);
        } catch (error: any) {
            throw new PITokenClientError(this, this.getInfo, {}, error);
        }
    }
    
    /**
     * Gets the tick history from the PI token process.
     * @returns Promise resolving to the tick history data as a string
     */
    public async getTickHistory(): Promise<string> {
        console.log(`[PITokenClient] Requesting tick history for process ID: ${this.baseConfig.processId}`);
        try {
            // Log the request
            console.log(`[PITokenClient] Sending dryrun with Action: ${ACTION_GET_YIELD_TICK_HISTORY}`);
            
            const response = await this.dryrun('', [
                { name: "Action", value: ACTION_TICK_HISTORY }
            ]);
            
            // Log the complete response for debugging
            console.log(`[PITokenClient] Received raw tick history response:`, 
                        JSON.stringify(response, null, 2).substring(0, 300) + '...');
            
            // Robust response checking
            try {
                // Check if we have Messages array
                if (!response?.Messages || !Array.isArray(response.Messages) || response.Messages.length === 0) {
                    console.warn(`[PITokenClient] No Messages array in response or it's empty`);
                    console.log(`[PITokenClient] Response structure:`, Object.keys(response || {}));
                } else {
                    console.log(`[PITokenClient] Found Messages array with ${response.Messages.length} items`);
                }
                
                // First check if Data exists in the first message
                if (response?.Messages?.[0]?.Data) {
                    console.log(`[PITokenClient] Found tick history data in Messages[0].Data`);
                    // Try to parse the data to verify it's valid JSON
                    try {
                        const parsedData = JSON.parse(response.Messages[0].Data);
                        console.log(`[PITokenClient] Successfully parsed data, found ${Array.isArray(parsedData) ? parsedData.length : 0} tick entries`);
                        if (Array.isArray(parsedData) && parsedData.length > 0) {
                            console.log(`[PITokenClient] First tick entry sample:`, JSON.stringify(parsedData[0]).substring(0, 150));
                        }
                    } catch (jsonError) {
                        console.error(`[PITokenClient] Data exists but is not valid JSON:`, jsonError);
                        console.log(`[PITokenClient] Invalid JSON data (first 200 chars):`, 
                                   String(response.Messages[0].Data).substring(0, 200));
                    }
                    return response.Messages[0].Data;
                } else {
                    console.warn(`[PITokenClient] No Data field in the first message`);
                }
                
                // Log Tag information if available
                if (response?.Messages?.[0]?.Tags) {
                    console.log(`[PITokenClient] Message contains ${response.Messages[0].Tags.length} tags`);
                    // Log all tags for debugging
                    response.Messages[0].Tags.forEach((tag: { name: string, value: string }, index: number) => {
                        console.log(`[PITokenClient] Tag ${index}: ${tag.name} = ${tag.value.substring(0, 50)}${tag.value.length > 50 ? '...' : ''}`);
                    });
                } else {
                    console.warn(`[PITokenClient] No Tags found in the first message`);
                }
                
                // Look for tags with tick history data
                if (response?.Messages?.[0]?.Tags?.length > 0) {
                    const tickHistoryTag = response.Messages[0].Tags.find((tag: { name: string, value: string }) => 
                        tag.name === 'Tick-History' || tag.name === 'History');
                        
                    if (tickHistoryTag) {
                        console.log(`[PITokenClient] Found tick history data in tag: ${tickHistoryTag.name}`);
                        // Try to parse the data to verify it's valid JSON
                        try {
                            const parsedData = JSON.parse(tickHistoryTag.value);
                            console.log(`[PITokenClient] Successfully parsed tag data, found ${Array.isArray(parsedData) ? parsedData.length : 0} tick entries`);
                        } catch (jsonError) {
                            console.error(`[PITokenClient] Tag value exists but is not valid JSON:`, jsonError);
                        }
                        return tickHistoryTag.value;
                    }
                    
                    // Look for a specific Action response tag
                    const actionTag = response.Messages[0].Tags.find((tag: { name: string, value: string }) => 
                        tag.name === 'Action' && tag.value === 'Resp-Get-Yield-Tick-History');
                    
                    if (actionTag) {
                        console.log(`[PITokenClient] Found Resp-Get-Yield-Tick-History action tag, looking for PricePrecisionScaling tag`);
                        
                        // Look for precision scaling tag which could indicate a valid response
                        const precisionTag = response.Messages[0].Tags.find((tag: { name: string, value: string }) => 
                            tag.name === 'PricePrecisionScaling');
                            
                        if (precisionTag) {
                            console.log(`[PITokenClient] Found PricePrecisionScaling tag: ${precisionTag.value}, response should be valid`);
                        }
                        
                        // In this case, we have a valid response action but no data
                        // Check if Data is directly in response.Data instead of Message.Data
                        if ((response as any)?.Data) {
                            console.log(`[PITokenClient] Found potential tick history data in response.Data`);
                            return (response as any).Data;
                        }
                        
                        return '[]';
                    }
                }
            } catch (parseError) {
                console.error(`[PITokenClient] Error parsing tick history response:`, parseError);
                console.log(`[PITokenClient] Response type:`, typeof response);
                // Continue to fallback handling
            }
            
            // Check if it's a specific error response we can handle
            // Use optional chaining with any type for state object since it's not in the type definition
            if ((response as any)?.State?.error) {
                console.warn(`[PITokenClient] State error in response: ${(response as any).State.error}`);
                // Process might not support this action
                return '[]';
            }
            
            // Return empty array if no data found - will be parsed as empty array
            console.warn(`[PITokenClient] No tick history data found in response, returning empty array`);
            return '[]';
        } catch (error: any) {
            console.error(`[PITokenClient] Error in getTickHistory for ${this.baseConfig.processId}:`, error);
            // Instead of throwing, return an empty array
            return '[]';
        }
    }
    
    /**
     * Parse the raw tick history string into a structured array
     * @param tickHistoryData Raw tick history data string
     * @returns Parsed tick history entries
     */
    public parseTickHistory(tickHistoryData: string): TickHistoryEntry[] {
        try {
            return JSON.parse(tickHistoryData);
        } catch (error) {
            throw new Error(`Failed to parse tick history data: ${error}`);
        }
    }
    
    /**
     * Gets the balance from the PI token process.
     * @param target Optional target wallet address. If not provided, uses the calling wallet address.
     * @returns Promise resolving to the balance as a string
     */
    public async getBalance(target?: string): Promise<string> {
        try {
            const tags: Tags = [{ name: "Action", value: ACTION_BALANCE }];
            
            // Add target if provided, otherwise the process will use the calling wallet
            if (target) {
                tags.push({ name: "Target", value: target });
            }
            
            const response = await this.dryrun('', tags);
            
            // Robust response checking
            try {
                // First check if Data exists in the first message
                if (response?.Messages?.[0]?.Data) {
                    console.log(`[PITokenClient] Found balance in Messages[0].Data: ${response.Messages[0].Data}`);
                    return response.Messages[0].Data;
                }
                
                // Look for tags with balance data
                if (response?.Messages?.[0]?.Tags?.length > 0) {
                    // Look for Balance tag which contains the balance value
                    const balanceTag = response.Messages[0].Tags.find((tag: { name: string, value: string }) => 
                        tag.name === 'Balance');
                    
                    if (balanceTag) {
                        console.log(`[PITokenClient] Found balance in Balance tag: ${balanceTag.value}`);
                        return balanceTag.value;
                    }
                    
                    // Look for an Account tag which often appears with balance info
                    const accountTag = response.Messages[0].Tags.find((tag: { name: string, value: string }) => 
                        tag.name === 'Account');
                    
                    if (accountTag) {
                        console.log(`[PITokenClient] Found Account tag: ${accountTag.value}`);
                        // When we have an account tag, the balance is likely in another tag nearby
                    }
                }
            } catch (parseError) {
                console.error(`[PITokenClient] Error parsing balance response:`, parseError);
                // Continue to fallback handling
            }
            
            // Check if it's a specific error response we can handle
            // Note: State property is not in DryRunResult type but can exist in runtime
            if ((response as any)?.State?.error) {
                console.warn(`[PITokenClient] State error in response: ${(response as any).State.error}`);
                // Process might not support this action
                return '0';
            }
            
            // Default to 0 if no balance found
            console.warn(`[PITokenClient] No balance data found in response, returning 0`);
            return '0';
        } catch (error: any) {
            console.error(`[PITokenClient] Error in getBalance:`, error);
            // Instead of throwing, return zero
            return '0';
        }
    }
    
    /**
     * Gets the claimable balance from the PI token process.
     * @returns Promise resolving to the claimable balance as a string
     */
    public async getClaimableBalance(): Promise<string> {
        try {
            const response = await this.dryrun('', [
                { name: "Action", value: ACTION_GET_CLAIMABLE_BALANCE }
            ]);
            
            // Robust response checking
            try {
                // First check if Data exists in the first message
                if (response?.Messages?.[0]?.Data) {
                    console.log(`[PITokenClient] Found claimable balance in Messages[0].Data: ${response.Messages[0].Data}`);
                    return response.Messages[0].Data;
                }
                
                // Look for tags with balance data
                if (response?.Messages?.[0]?.Tags?.length > 0) {
                    // Look for Balance tag which contains the claimable balance value
                    const balanceTag = response.Messages[0].Tags.find((tag: { name: string, value: string }) => 
                        tag.name === 'Balance');
                    
                    if (balanceTag) {
                        console.log(`[PITokenClient] Found claimable balance in Balance tag: ${balanceTag.value}`);
                        return balanceTag.value;
                    }
                    
                    // Look for a specific Action response tag
                    const actionTag = response.Messages[0].Tags.find((tag: { name: string, value: string }) => 
                        tag.name === 'Action' && tag.value === 'Resp-Get-Claimable-Balance');
                    
                    if (actionTag) {
                        console.log(`[PITokenClient] Found Resp-Get-Claimable-Balance action tag, looking for balance info`);
                        // When this tag is present, we should have a balance somewhere
                        const forAccountTag = response.Messages[0].Tags.find((tag: { name: string, value: string }) => 
                            tag.name === 'For-Account');
                            
                        if (forAccountTag) {
                            console.log(`[PITokenClient] Found For-Account tag: ${forAccountTag.value}`);
                            // This is likely a valid response
                        }
                    }
                }
            } catch (parseError) {
                console.error(`[PITokenClient] Error parsing claimable balance response:`, parseError);
                // Continue to fallback handling
            }
            
            // Check if it's a specific error response we can handle
            // Note: State property is not in DryRunResult type but can exist in runtime
            if ((response as any)?.State?.error) {
                console.warn(`[PITokenClient] State error in response: ${(response as any).State.error}`);
                // Process might not support this action
                return '0';
            }
            
            // Default to 0 if no balance found
            console.warn(`[PITokenClient] No claimable balance data found in response, returning 0`);
            return '0';
        } catch (error: any) {
            console.error(`[PITokenClient] Error in getClaimableBalance:`, error);
            // Instead of throwing, return zero
            return '0';
        }
    }

    /**
     * Check if the result contains any error tags from the process
     * @param result The result to check for errors
     * @private
     */
    private checkResultForErrors(result: DryRunResult) {
        for (let msg of result.Messages) {
            const tags: Tags = msg.Tags;
            for (let tag of tags) {
                if (tag.name == "Error") {
                    throw new PITokenProcessError(`Error originating in process: ${this.getProcessId()}`)
                }
            }
        }
    }

    /**
     * {@inheritdoc IAutoconfiguration.autoConfiguration}
     * @see {@link IAutoconfiguration.autoConfiguration} 
     */
    public static async autoConfiguration(): Promise<PITokenClient> {
        const builder = await PITokenClient.defaultBuilder();
        return builder.build();
    }

    /**
     * Create a new builder instance for PITokenClient
     * @returns A new builder instance
     */
    public static builder(): ClientBuilder<PITokenClient> {
        return new ClientBuilder(PITokenClient);
    }

    /** 
     * {@inheritdoc IDefaultBuilder.defaultBuilder}
     * @see {@link IDefaultBuilder.defaultBuilder} 
     */
    public static async defaultBuilder(): Promise<ClientBuilder<PITokenClient>> {
        return PITokenClient.builder()
            .withProcessId(PI_TOKEN_PROCESS_ID)
            .withAOConfig(AO_CONFIGURATIONS.RANDAO);
    }

    /**
     * Static method to easily build a PIToken client with optional CU URL override
     * @param processId The PI Token process ID
     * @param cuUrl Optional Compute Unit URL to override the default
     * @returns A configured PITokenClient instance
     */
    public static build(processId: string, cuUrl?: string): PITokenClient {
        const builder = PITokenClient.builder()
            .withProcessId(processId);
        
        // Override the CU URL if provided
        if (cuUrl) {
            builder.withAOConfig({
                MODE: 'legacy',
                CU_URL: cuUrl
            });
        }
        
        return builder.build();
    }
}
