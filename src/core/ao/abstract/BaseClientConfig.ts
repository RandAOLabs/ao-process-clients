import { JWKInterface } from 'arweave/node/lib/wallet.js';

/**
 * Base configuration interface shared by all ao clients.
 * Provides essential configuration properties required for interacting with ao processes.
 */
export interface BaseClientConfig {
    /**
     * The ID of the ao process that this client will interact with.
     * This identifies the specific process running on the ao network.
     */
    processId: string;

    /**
     * The wallet used for signing transactions.
     * @see {@link JWKInterface} for Arweave wallet type
     * @remarks Use getWalletLazy utility to get the proper wallet in browser or node environments
     */
    wallet: JWKInterface | any;
}
