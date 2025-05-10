import { DryRunResult } from "@permaweb/aoconnect/dist/lib/dryrun";
import { MessageResult } from "@permaweb/aoconnect/dist/lib/result";

import { Tags } from "../../../core";
import { IAutoconfiguration, IDefaultBuilder, staticImplements } from "../../../utils";
import { ISweepstakesClient, SweepstakesClientConfig, SweepstakesPull, ViewAllSweepstakesResponse, ViewOneSweepstakesResponse } from "./abstract";
import { ViewPullError } from "./SweepstakesClientError";
import { SweepstakesProcessError } from "./SweepstakesProcessError";
import { BaseClient } from "../../../core/ao/BaseClient";
import { ARIOService } from "../../../services";
import { DOMAIN } from "../../../services/ario/domains";
import { AO_CONFIGURATIONS } from "../../../core/ao/ao-client/configurations";
import ResultUtils from "../../../core/common/result-utils/ResultUtils";
import { ClientBuilder } from "../../common";
import { PROCESS_IDS } from "../../../process-ids";
import { ClientError } from "../../common/ClientError";
import { TokenClient, TokenClientConfig } from "../../ao";
import { TokenInterfacingClientBuilder } from "../../common/TokenInterfacingClientBuilder";
import { IClassBuilder } from "../../../utils/class-interfaces/IClientBuilder";

/**
 * @category Miscellaneous
 * @see {@link https://github.com/RandAOLabs/Sweepstakes-Process | specification}
 */
@staticImplements<IAutoconfiguration>()
@staticImplements<IDefaultBuilder>()
@staticImplements<IClassBuilder>()

export class SweepstakesClient extends BaseClient implements ISweepstakesClient {
	
	readonly tokenClient: TokenClient;
	public constructor(sweepstakesConfig: SweepstakesClientConfig) {
		super(sweepstakesConfig);
		
		const tokenConfig: TokenClientConfig = {
			processId: sweepstakesConfig.tokenProcessId,
			wallet: sweepstakesConfig.wallet,
			aoConfig: AO_CONFIGURATIONS.FORWARD_RESEARCH,
			retriesEnabled: sweepstakesConfig.retriesEnabled
		}
		this.tokenClient = new TokenClient(tokenConfig);
	}

	/** 
	 * {@inheritdoc IAutoconfiguration.autoConfiguration}
	 * @see {@link IAutoconfiguration.autoConfiguration} 
	 */
	public static async autoConfiguration(): Promise<SweepstakesClient> {
		const builder = await SweepstakesClient.defaultBuilder();

		return builder
			.build()
	}

	public static builder(): TokenInterfacingClientBuilder<SweepstakesClient> {
		return new TokenInterfacingClientBuilder(SweepstakesClient)
	}

	/** 
	 * {@inheritdoc IDefaultBuilder.defaultBuilder}
	 * @see {@link IDefaultBuilder.defaultBuilder} 
	 */
	public static async defaultBuilder(): Promise<TokenInterfacingClientBuilder<SweepstakesClient>> {
		return SweepstakesClient.builder()
			.withProcessId(PROCESS_IDS.MISCELLANEOUS.SWEEPSTAKES)
			.withAOConfig(AO_CONFIGURATIONS.RANDAO)
			.withTokenProcessId(PROCESS_IDS.MISCELLANEOUS.SWEEPSTAKES_TOKEN)
			.withTokenAOConfig(AO_CONFIGURATIONS.FORWARD_RESEARCH)
	}

	async registerSweepstakes(entrants: string[], details: string): Promise<boolean> {
		try {
			const paymentAmount = "100000000000"; // TODO: Determine payment amount dynamically if needed
			const tags: Tags = [
				{ name: "Entrants", value: JSON.stringify(entrants) },
				{ name: "Details", value: details },
			];
	
			return await this.tokenClient.transfer(this.getProcessId(), paymentAmount, tags);
		} catch (error: any) {
			throw new ClientError(this, this.registerSweepstakes, { entrants }, error);
		}
	}
	
	async setSweepstakesEntrants(entrants: string[],sweepstakesId: string): Promise<boolean> {
		try {
			const tags: Tags = [
				{ name: "Action", value: "Update-Sweepstakes-Entry-List" },
				{ name: "SweepstakesId", value: sweepstakesId },
			];
			const data = JSON.stringify(entrants);
			const result = await this.messageResult(data, tags);
			this.checkResultForErrors(result)
			return true;
		} catch (error: any) {
			throw new ClientError(this, this.setSweepstakesEntrants, { entrants }, error);
		}
	}
	
	async addSweepstakesEntrant(entrant: string, sweepstakesId: string): Promise<boolean> {
		try {
			const tags: Tags = [
				{ name: "Action", value: "Add-Sweepstakes-Entry" },
				{ name: "SweepstakesId", value: sweepstakesId },
				{ name: "Entry", value: entrant },
			];
			const result = await this.messageResult(undefined, tags);
			this.checkResultForErrors(result)
			return true;
		} catch (error: any) {
			throw new ClientError(this, this.addSweepstakesEntrant, { entrant }, error);
		}
	}

	async deleteSweepstakesData(sweepstakesId: string, pullId?: string): Promise<Boolean> {
		try {
			const tags: Tags = [
				{ name: "Action", value: "Delete" },
				{ name: "SweepstakesId", value: sweepstakesId },
			];
			if (pullId) {
				tags.push({ name: "PullId", value: pullId });
			}
			const result = await this.messageResult(undefined, tags);
			this.checkResultForErrors(result)
			return true;
		} catch (error: any) {
			throw new ClientError(this, this.deleteSweepstakesData, { sweepstakesId, pullId }, error);
		}
	}

	async pullSweepstakes(sweepstakesId: string, details?: string): Promise<boolean> {
		try {
			const tags: Tags = [
				{ name: "Action", value: "Pull-Sweepstakes" },
				{ name: "SweepstakesId", value: sweepstakesId },
				{ name: "Details", value: details || "" },
			];
			const result = await this.messageResult(undefined, tags);
			return true
		} catch (error: any) {
			throw new ClientError(this, this.pullSweepstakes, { sweepstakesId, details }, error);
		}
	}

	async viewSweepstakesPull(sweepstakesId: string, pullId: string): Promise<SweepstakesPull> {
		try {
			const tags: Tags = [
				{ name: "Action", value: "View-Pull" },
				{ name: "SweepstakesId", value: sweepstakesId },
				{ name: "PullId", value: pullId },
			];
			const result = await this.dryrun(undefined, tags);
			this.checkResultForErrors(result);
			return ResultUtils.getFirstMessageDataJson(result);
		} catch (error: any) {
			throw new ClientError(this, this.viewSweepstakesPull, { sweepstakesId, pullId }, error);
		}
	}

	async viewSweepstakes(sweepstakesId: string): Promise<ViewOneSweepstakesResponse> {
		try {
			const tags: Tags = [
				{ name: "Action", value: "Get-Sweepstakes" },
				{ name: "SweepstakesId", value: sweepstakesId },
			];
			const result = await this.dryrun(undefined, tags);
			this.checkResultForErrors(result);
			return ResultUtils.getFirstMessageDataJson(result);
		} catch (error: any) {
			throw new ClientError(this, this.viewSweepstakes, { sweepstakesId }, error);
		}
	}

	async viewAllSweepstakes(): Promise<ViewAllSweepstakesResponse> {
		try {
			const tags: Tags = [
				{ name: "Action", value: "Get-All-Sweepstakes" },
			];
			const result = await this.dryrun(undefined, tags);
			this.checkResultForErrors(result);
			return ResultUtils.getFirstMessageDataJson(result);
		} catch (error: any) {
			throw new ClientError(this, this.viewAllSweepstakes, null, error);
		}
	}

	/* Core Sweepstakes Functions */

	/* Utilities */
	/* Private */
	private checkResultForErrors(result: MessageResult | DryRunResult) {
		for (let msg of result.Messages) {
			const tags: Tags = msg.Tags;
			for (let tag of tags) {
				if (tag.name == "Error") {
					throw new SweepstakesProcessError(`Error originating in process: ${this.getProcessId()}`)
				}
			}
		}
	}
	/* Private */

}
