import { StakingClient } from "../../ao";
import { InputValidationError } from "../../bazar";
import { ClientError } from "../../common/ClientError";
import { TokenInterfacingClientBuilder } from "../../common/TokenInterfacingClientBuilder";
import { ProviderDetails } from "../provider-profile";
import { IProviderStakingClient } from "./abstract/IProviderStakingClient";
import { ProviderStakeInfo } from "./abstract/types";
import { PROVIDER_MINIMUM_STAKE } from "./constants";
import { Tags } from "../../../core";
import { AO_CONFIGURATIONS } from "../../../core/ao/ao-client/configurations";
import ResultUtils from "../../../core/common/result-utils/ResultUtils";
import { PROCESS_IDS } from "../../../process-ids";
import { IAutoconfiguration, IDefaultBuilder, staticImplements } from "../../../utils";

/**
 * @category RandAO
 */
@staticImplements<IAutoconfiguration>()
@staticImplements<IDefaultBuilder>()
export class ProviderStakingClient extends StakingClient implements IProviderStakingClient {
	/** 
	 * {@inheritdoc IAutoconfiguration.autoConfiguration}
	 * @see {@link IAutoconfiguration.autoConfiguration} 
	 */
	public static autoConfiguration(): ProviderStakingClient {
		return ProviderStakingClient.defaultBuilder()
			.build()
	}

	/** 
	 * {@inheritdoc IDefaultBuilder.defaultBuilder}
	 * @see {@link IDefaultBuilder.defaultBuilder} 
	 */
	public static defaultBuilder(): TokenInterfacingClientBuilder<ProviderStakingClient> {
		return new TokenInterfacingClientBuilder(ProviderStakingClient)
			.withProcessId(PROCESS_IDS.RANDAO.STAKING)
			.withAOConfig(AO_CONFIGURATIONS.RANDAO)
			.withTokenProcessId(PROCESS_IDS.RANDAO.STAKING_TOKEN)
			.withTokenAOConfig(AO_CONFIGURATIONS.RANDAO)
	}
	/**
	 * @inheritdoc
	 * @override
	 */
	public async stake(quantity: string, additionaForwardedlTags?: Tags): Promise<boolean> {
		try {
			if (quantity < PROVIDER_MINIMUM_STAKE) {
				throw new InputValidationError(`Attempted to Stake ${quantity}, when minimum stake is ${PROVIDER_MINIMUM_STAKE}`)
			}
			return super.stake(quantity, additionaForwardedlTags)
		} catch (error: any) {
			throw new ClientError(this, this.stake, { quantity, additionaForwardedlTags }, error);
		}
	}

	public async stakeWithDetails(quantity: string, providerDetails?: ProviderDetails): Promise<boolean> {
		try {

			const additionaForwardedlTags = providerDetails
				? [{
					name: "ProviderDetails",
					value: JSON.stringify(providerDetails)
				}]
				: undefined
			const success = await super.stake(quantity, additionaForwardedlTags);
			return success
		} catch (error: any) {
			throw new ClientError(this, this.stakeWithDetails, { quantity, providerDetails }, error);
		}
	}

	public async getStake(providerId: string): Promise<ProviderStakeInfo> {
		try {
			const tags: Tags = [
				{ name: "Action", value: "Get-Provider-Stake" }
			];
			const requestData = JSON.stringify({ providerId });
			const result = await this.dryrun(requestData, tags);
			const stakeStringJson = ResultUtils.getFirstMessageDataString(result);
			const stake: ProviderStakeInfo = JSON.parse(stakeStringJson)

			return stake;
		} catch (error: any) {
			throw new ClientError(this, this.getStake, { providerId }, error);

		}
	}

	/** @Override  */
	public async unstake(providerId: string): Promise<boolean> {
		try {
			const tags: Tags = [
				{ name: "Action", value: "Unstake" }
			];
			const data = JSON.stringify({ providerId })
			const result = await super.unstake(data)
			return result
		} catch (error: any) {
			throw new ClientError(this, this.unstake, { providerId }, error);
		}
	}
}
