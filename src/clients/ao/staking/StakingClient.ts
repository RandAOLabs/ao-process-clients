
import { BaseClient } from '../../../core/ao/BaseClient';
import { Tags } from '../../../core/common/types';
import { IStakingClient, StakingClientConfig } from './abstract';
import { TokenClient, TokenClientConfig } from '../token';
import ResultUtils from '../../../core/common/result-utils/ResultUtils';
import { ClientError } from '../../common/ClientError';

/**
 * @category ao-standards
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
            throw new ClientError(this, this.stake, { quantity, additionaForwardedlTags }, error);
        }
    }

    public async unstake(data: string): Promise<boolean> {
        try {
            const tags: Tags = [
                { name: "Action", value: "Unstake" }
            ];;
            const result = await this.messageResult(data, tags);
            const response = ResultUtils.getFirstMessageDataString(result);
            if (!response) {
                return false
            }
            return !response.includes("Failed to unstake");
        } catch (error: any) {
            throw new ClientError(this, this.unstake, { data }, error);
        }
    }
    /* Interface Staking Functions */

    /* Getters */
    public getStakingToken(): TokenClient {
        return this.tokenClient;
    }
    /* Getters */
}
