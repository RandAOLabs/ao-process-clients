import { IProviderProfileClient } from "src/clients/randao/provider-profile/abstract/IProviderProfileClient";
import { ProviderDetails, ProviderInfo, ProviderInfoDTO } from "src/clients/randao/provider-profile/abstract/types";
import { getProviderProfileClientAutoConfiguration } from "src/clients/randao/provider-profile/ProviderProfileClientAutoConfiguration";
import { Tags } from "src/core";
import { SyncInitDryRunCachingClient } from "src/core/ao/client-variants";
import { Logger } from "src/utils";

/**
 * @category Clients
 */
export class ProviderProfileClient extends SyncInitDryRunCachingClient implements IProviderProfileClient {

    public static autoConfiguration(): ProviderProfileClient {
        const config = getProviderProfileClientAutoConfiguration()
        return new ProviderProfileClient(config)
    }

    /* Interface Provider Profile Functions */
    async updateDetails(providerDetails: ProviderDetails): Promise<string> {
        try {
            const tags: Tags = [
                { name: "Action", value: "Update-Provider-Details" }
            ];
            const data = JSON.stringify({ providerDetails: JSON.stringify(providerDetails) });
            const result = await this.messageResult(data, tags);
            this.clearCache()
            return this.getFirstMessageDataString(result);
        } catch (error: any) {
            Logger.error(`Error updating provider details: ${error.message}`);
            throw new Error(`Failed to update provider details: ${error.message}`);
        }
    }
    async getAllProvidersInfo(): Promise<ProviderInfo[]> {
        try {
            const tags: Tags = [
                { name: "Action", value: "Get-All-Providers-Details" }
            ];
            const result = await this.dryrun("", tags);
            const dtos = this.getFirstMessageDataJson<ProviderInfoDTO[]>(result);
            const providers = dtos.map(dto => this._parseProviderInfoDTO(dto));
            return providers;
        } catch (error: any) {
            Logger.error(`Error getting all providers info: ${error.message}`);
            throw new Error(`Failed to get all providers info: ${error.message}`);
        }
    }

    async getProviderInfo(providerId?: string): Promise<ProviderInfo> {
        let providerWalletAddress;
        try {
            const tags: Tags = [
                { name: "Action", value: "Get-Provider-Details" }
            ];
            providerWalletAddress = providerId || await this.getCallingWalletAddress();
            const data = JSON.stringify({ providerId: providerWalletAddress });
            const result = await this.dryrun(data, tags);
            Logger.debug(result)
            const dto = this.getFirstMessageDataJson<ProviderInfoDTO>(result);

            const info = this._parseProviderInfoDTO(dto);
            return info;
        } catch (error: any) {
            Logger.error(`Error getting provider info for ${providerWalletAddress}: ${error.message}`);
            throw new Error(`Failed to get provider info for ${providerWalletAddress}: ${error.message}`);
        }
    }
    /* Interface Provider Profile Functions */

    /* Private Functions */
    private _parseProviderInfoDTO(dto: ProviderInfoDTO): ProviderInfo {
        return {
            ...dto,
            provider_details: dto.provider_details ? JSON.parse(dto.provider_details) : undefined,
            stake: JSON.parse(dto.stake)
        };
    }
    /* Private Functions */
}