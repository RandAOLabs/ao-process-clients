import { IStakingClient, StakingClientConfig } from 'src/clients/staking/abstract';
import { StakeError, UnstakeError } from 'src/clients/staking/StakingClientError';
import { TokenClient, TokenClientConfig } from 'src/clients/token';
import { Logger } from 'src/utils';
import { BaseClient } from 'src/core/ao/BaseClient';
import { Tags } from 'src/core/common/types';

/**
 * @category Clients
 * @see {@link https://cookbook_ao.g8way.io/references/staking.html | specification}
 */
export class StakingClient extends BaseClient implements IStakingClient {
    /* Fields */
    readonly tokenClient: TokenClient;
    /* Fields */

    /* Constructors */
    /**
     * @override
     * @param stakingConfig 
     */
    public constructor(stakingConfig: StakingClientConfig) {
        super(stakingConfig);
        const tokenConfig: TokenClientConfig = {
            processId: stakingConfig.tokenProcessId,
            wallet: stakingConfig.wallet
        };
        this.tokenClient = new TokenClient(tokenConfig);
    }
    /* Constructors */

    /* Interface Staking Functions */
    public async stake(quantity: string, additionaForwardedlTags?: Tags): Promise<boolean> {
        try {
            const tags: Tags = [
                { name: "Stake", value: "true" }
            ];
            if (additionaForwardedlTags) {
                additionaForwardedlTags.forEach(tag => tags.push(tag));
            }

            const success = await this.tokenClient.transfer(this.getProcessId(), quantity, tags);
            if (!success) {
                throw new Error("Token transfer failed");
            }

            return true;
        } catch (error: any) {
            Logger.error(`Error staking ${quantity} tokens: ${error.message}`);
            throw new StakeError(quantity, error);
        }
    }

    public async unstake(data: string): Promise<boolean> {
        try {
            const tags: Tags = [
                { name: "Action", value: "Unstake" }
            ];;
            const result = await this.messageResult(data, tags);
            const response = this.getFirstMessageDataString(result);
            if (!response) {
                return false
            }
            return !response.includes("Failed to unstake");
        } catch (error: any) {
            Logger.error(`Error unstaking for: ${error.message}`);
            throw new UnstakeError(error);
        }
    }
    /* Interface Staking Functions */

    /* Getters */
    public getStakingToken(): TokenClient {
        return this.tokenClient;
    }
    /* Getters */
}
