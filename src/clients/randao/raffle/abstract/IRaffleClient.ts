import { RafflePull, ViewPullsResponse } from "./types";

/**
 * Interface for the Raffle Client that provides functionality for managing raffles
 * and viewing raffle pulls.
 */
export interface IRaffleClient {
    /**
     * Sets the list of entrants for the raffle.
     * @param entrants Array of entrant names
     * @returns Promise resolving to true if successful
     */
    setRaffleEntrants(entrants: string[]): Promise<boolean>;

    /**
     * Performs a raffle pull to select a winner.
     * @returns Promise resolving to true if successful
     */
    pullRaffle(): Promise<boolean>;

    /**
     * Retrieves all raffle pulls.
     * @returns Promise resolving to an object containing array of pulls
     */
    viewPulls(): Promise<ViewPullsResponse>;

    /**
     * Retrieves details of a specific raffle pull.
     * @param pullId ID of the pull to view
     * @returns Promise resolving to pull details
     */
    viewPull(pullId: string): Promise<RafflePull>;

    /**
     * Retrieves the most recent raffle pull by finding the one with the highest ID.
     * @returns Promise resolving to the most recent pull details
     */
    viewMostRecentPull(): Promise<RafflePull>;
}
