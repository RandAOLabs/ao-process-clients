import { RANDOM_PROCESS_ID } from "src/processes_ids";

/**
 * Common domains for querying using the ARIOService.
 * These domains are used to retrieve process IDs through ANT and ARNS record lookups.
 * 
 * Domain format can be either:
 * - "antname" (e.g., "randao")
 * - "undername_antname" (e.g., "api_randao")
 * 
 * Each domain can have an optional default process ID that will be used during rate limiting.
 * Add defaults in the DOMAIN_DEFAULTS mapping below.
 * 
 * @see {@link ARIOService.getProcessIdForDomain} for domain resolution logic
 */
export enum Domains {
    /**
     * Domain for the RANDAO API process.
     * Uses format "api_randao" where:
     * - "api" is the undername
     * - "randao" is the ANT name
     */
    RANDAO_API = "api_randao"
}

/**
 * Static mapping of domain default process IDs used during rate limiting
 */
export const DOMAIN_DEFAULTS: { [key in Domains]?: string } = {
    [Domains.RANDAO_API]: RANDOM_PROCESS_ID
    // Add more domain defaults here as needed
};
