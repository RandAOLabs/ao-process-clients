
import { IProfileClient, ProfileInfo } from "src/clients/bazar/profile/abstract";
import { getProfileClientAutoConfiguration } from "src/clients/bazar/profile/ProfileClientAutoConfiguration";
import { GetProfileError, ProfileTransferError } from "src/clients/bazar/profile/ProfileClientError";
import { Tags, TagUtils } from "src/core";
import { IAsyncAutoConfiguration } from "src/core/ao/abstract";
import { DryRunCachingClient } from "src/core/ao/client-variants";
import ResultUtils from "src/core/common/result-utils/ResultUtils";
import { Logger } from "src/utils/index";

/**
 * @category Bazar
 * @see {@link https://cookbook_ao.g8way.io/references/profile.html | specification}
 */
export class ProfileClient extends DryRunCachingClient implements IProfileClient, IAsyncAutoConfiguration {
    /* Constructors */
    public static async autoConfiguration(): Promise<ProfileClient> {
        const config = await getProfileClientAutoConfiguration();
        return new ProfileClient(config);
    }
    /* Constructors */

    /* Core Profile Functions */
    public async getProfileInfo(): Promise<ProfileInfo> {
        const address = await this.getCallingWalletAddress();

        try {
            const response = await this.dryrun('', [
                { name: "Action", value: "Info" },
            ]);
            return ResultUtils.getFirstMessageDataJson<ProfileInfo>(response);
        } catch (error: any) {
            Logger.error(`Error fetching profile for address ${address}: ${error.message}`);
            throw new GetProfileError(address, error);
        }
    }

    public async transferAsset(assetToTransfer: string, recipient: string, quantity: string, tags?: Tags): Promise<boolean> {
        try {
            const transferTags: Tags = [
                { name: "Action", value: "Transfer" },
                { name: "Target", value: assetToTransfer },
                { name: "Recipient", value: recipient },
                { name: "Quantity", value: quantity }
            ];
            if (tags) {
                tags.forEach(tag => transferTags.push(tag));
            }
            const result = await this.messageResult('', transferTags);
            const actionValue = TagUtils.getTagValue(result.Messages[0].Tags, "Action");
            return actionValue !== "Transfer-Failed";
        } catch (error: any) {
            Logger.error(`Error transferring ${quantity} from ${assetToTransfer} to ${recipient}: ${error.message}`);
            throw new ProfileTransferError(assetToTransfer, recipient, quantity, error);
        }
    }
    /* Core Profile Functions */
}
