import { INftSaleClient, NftSaleClientConfig } from "src/clients/nft-sale/abstract";
import { NftSaleInfo } from "src/clients/nft-sale/abstract/types";
import { getNftSaleClientAutoConfiguration } from "src/clients/nft-sale/NftSaleClientAutoConfiguration";
import { PurchaseNftError, LuckyDrawError, QueryNFTCountError, AddNftError, ReturnNFTsError, NftSaleInfoError, PaymentError } from "src/clients/nft-sale/NftSaleClientError";
import { ProfileClient } from "src/clients/profile";
import { TokenClient, TokenClientConfig } from "src/clients/token";
import { ASyncInitClient, Tags } from "src/core";
import { Logger } from "src/utils";

/**
 * @category Clients
 */
export class NftSaleClient extends ASyncInitClient implements INftSaleClient {
    /* Fields */
    readonly tokenClient: TokenClient;
    readonly profileClient: ProfileClient;
    private _cachedInfo?: NftSaleInfo;
    /* Fields */

    /* Getters */
    public getTokenClient(): TokenClient {
        return this.tokenClient;
    }
    /* Getters */

    /* Constructors */
    public constructor(config: NftSaleClientConfig, profileClient: ProfileClient) {
        super(config);
        const tokenConfig: TokenClientConfig = {
            processId: config.tokenProcessId,
            wallet: config.wallet
        };
        this.tokenClient = new TokenClient(tokenConfig);
        this.profileClient = profileClient;
    }

    public static async create(config?: NftSaleClientConfig, profileClient?: ProfileClient): Promise<NftSaleClient> {
        const finalConfig = config ?? getNftSaleClientAutoConfiguration();
        const finalProfileClient = profileClient ?? await ProfileClient.autoConfiguration();
        return new NftSaleClient(finalConfig, finalProfileClient);
    }

    public static async createAutoConfigured(): Promise<NftSaleClient> {
        return NftSaleClient.create()
    }
    /* Constructors */

    /* Core NFT Sale Functions */
    public async purchaseNft(): Promise<boolean> {
        let amount: string;
        try {
            amount = await this.getPurchasePaymentAmount();
            return await this._pay(amount);
        } catch (error: any) {
            throw new PurchaseNftError(amount!, error);
        }
    }

    public async luckyDraw(): Promise<boolean> {
        let amount: string;
        try {
            amount = await this.getLuckyDrawPaymentAmount();
            return await this._pay(amount, [
                { name: "Lucky-Draw", value: "true" }
            ]);
        } catch (error: any) {
            throw new LuckyDrawError(amount!, error);
        }
    }

    public async queryNFTCount(): Promise<number> {
        try {
            const result = await this.dryrun('', [
                { name: "Action", value: "Query-NFT-Count" }
            ]);

            const count = parseInt(this.getFirstMessageDataString(result));
            if (isNaN(count)) {
                throw new Error("Invalid NFT count response");
            }

            return count;
        } catch (error: any) {
            Logger.error(`Error querying NFT count: ${error.message}`);
            throw new QueryNFTCountError(error);
        }
    }

    public async addNft(nftProcessId: string): Promise<boolean> {
        try {
            // Transfer NFT to the sale process using profile client
            const success = await this.profileClient.transferAsset(
                nftProcessId,
                this.getProcessId(),
                "1"
            );
            if (!success) {
                throw new Error("NFT transfer failed");
            }
            return true;
        } catch (error: any) {
            Logger.error(`Error adding NFT from process ${nftProcessId}: ${error.message}`);
            throw new AddNftError(nftProcessId, error);
        }
    }

    public async returnNFTs(recipient?: string): Promise<boolean> {
        if (!recipient) {
            recipient = this.profileClient.getProcessId();
        }
        try {
            const result = await this.messageResult('', [
                { name: "Action", value: "Return-NFTs" },
                { name: "Recipient", value: recipient }
            ]);
            return true;
        } catch (error: any) {
            Logger.error(`Error returning NFTs to recipient ${recipient}: ${error.message}`);
            throw new ReturnNFTsError(recipient, error);
        }
    }

    public async getInfo(): Promise<NftSaleInfo> {
        try {
            if (this._cachedInfo) {
                return this._cachedInfo;
            }

            const result = await this.dryrun('', [
                { name: "Action", value: "Info" }
            ]);
            // Handle double-encoded JSON
            const rawData = this.getFirstMessageDataString(result);
            const parsedOnce = JSON.parse(rawData);
            if (Array.isArray(parsedOnce) && parsedOnce.length > 0) {
                this._cachedInfo = JSON.parse(parsedOnce[0]) as NftSaleInfo;
            } else {
                throw new Error("Invalid NFT sale info format");
            }
            return this._cachedInfo;
        } catch (error: any) {
            Logger.error(`Error getting NFT sale info: ${error.message}`);
            throw new NftSaleInfoError(error);
        }
    }

    public async getPurchasePaymentAmount(): Promise<string> {
        const info = await this.getInfo();
        const currentZone = info.Current_Zone - 1;
        const zoneInfo = info.MasterWhitelist[currentZone];
        if (!zoneInfo) {
            throw new Error(`No zone info found for zone ${currentZone}`);
        }
        return zoneInfo[0]; // Zone Purchase Price
    }

    public async getLuckyDrawPaymentAmount(): Promise<string> {
        const info = await this.getInfo();
        const currentZone = info.Current_Zone - 1;
        const zoneInfo = info.MasterWhitelist[currentZone];
        if (!zoneInfo) {
            throw new Error(`No zone info found for zone ${currentZone}`);
        }
        return zoneInfo[1]; // Zone Lucky Price
    }
    /* Private */
    private async _pay(amount: string, additionalTags: Tags = []): Promise<boolean> {
        const tags: Tags = [...additionalTags];

        const profileId = this.profileClient?.getProcessId();
        if (profileId) {
            tags.push({ name: "Bazar-Profile", value: profileId });
        }

        try {
            const success = await this.tokenClient.transfer(this.getProcessId(), amount, tags);
            if (!success) {
                throw new Error("Token transfer failed");
            }
            return true;
        } catch (error: any) {
            Logger.error(`Error processing payment: ${error.message}`);
            throw new PaymentError(amount, error);
        }
    }
    /* Private */
}
