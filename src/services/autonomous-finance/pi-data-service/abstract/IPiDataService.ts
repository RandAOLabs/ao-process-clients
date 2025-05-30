import { Observable } from 'rxjs';
import { ArweaveTransaction } from "../../../../core/arweave/abstract/types";
import { DelegationPreferencesResponse, DelegationPreferencesResponseWithBalance, SimplifiedDelegationResponse } from './responses';

/**
 * Interface for Pi Data Service operations
 */
export interface IPiDataService {
    /**
     * Gets all current delegations with their allocation responses
     * @returns Observable stream of allocation response messages
     */
    getAllPiDelegationPreferences(): Observable<DelegationPreferencesResponse[]>;

    /**
     * Gets all current delegations with their allocation responses and wallet balances
     * @returns Observable stream of allocation response messages with balances
     */
    getAllPiDelegationPreferencesWithBalances(): Observable<DelegationPreferencesResponseWithBalance[]>;

    /**
     * Gets current delegations for a specific delegated address with simplified response format
     * @param delegatedTo The wallet address to get delegations for
     * @returns Observable stream of simplified delegation responses where walletTo matches delegatedTo
     */
    getCurrentDelegationsForAddress(delegatedTo: string): Observable<SimplifiedDelegationResponse[]>;
}
