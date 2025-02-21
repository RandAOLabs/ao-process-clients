import { DryRunResult } from "@permaweb/aoconnect/dist/lib/dryrun";
import { MessageResult } from "@permaweb/aoconnect/dist/lib/result";
import { ProviderStakingClient } from "src/clients/randao/provider-staking/ProviderStakingClient";
import { ProviderDetails } from "src/clients/randao/provider-profile";
import { StakeWithDetailsError, GetStakeError, ProviderUnstakeError } from "src/clients/randao/provider-staking/ProviderStakingError";
import { UnstakeError } from "src/clients/staking/StakingClientError";
import { BaseClient } from "src/core/ao/BaseClient";
import { TokenClient } from "src/clients/token";
import { Logger, LogLevel } from "src/utils";

// Mock BaseClient methods
jest.spyOn(BaseClient.prototype, 'message').mockResolvedValue("test-message-id");
const messageResult: MessageResult = {
    Output: undefined,
    Messages: [{ ID: "test-message-id", Data: "200: Success", Tags: [] }],
    Spawns: []
};
jest.spyOn(BaseClient.prototype, 'result').mockResolvedValue(messageResult);
const dryRunResult: DryRunResult = {
    Output: undefined,
    Messages: [{ Data: JSON.stringify({ providerId: "test-provider", stake: "1000" }), Tags: [] }],
    Spawns: []
};
jest.spyOn(BaseClient.prototype, 'dryrun').mockResolvedValue(dryRunResult);
jest.spyOn(BaseClient.prototype, 'messageResult').mockResolvedValue(messageResult);

// Mock TokenClient
jest.mock("src/clients/token/TokenClient", () => {
    return {
        TokenClient: jest.fn().mockImplementation(() => ({
            transfer: jest.fn().mockResolvedValue(true)
        }))
    };
});

describe("ProviderStakingClient", () => {
    let client: ProviderStakingClient;
    let mockTokenClient: jest.Mocked<TokenClient>;
    Logger.setLogLevel(LogLevel.NONE)
    // Logger.setLogLevel(LogLevel.DEBUG)
    beforeEach(() => {
        jest.clearAllMocks();

        client = ProviderStakingClient.autoConfiguration();

        mockTokenClient = {
            transfer: jest.fn().mockResolvedValue(true),
        } as unknown as jest.Mocked<TokenClient>;

        // Inject the mocked tokenClient
        (client as any).tokenClient = mockTokenClient;
    });

    describe("stakeWithDetails", () => {
        const quantity = "1000";
        const providerDetails: ProviderDetails = {
            name: "Test Provider",
            commission: 10,
            description: "Test Description"
        };

        it("should stake with provider details successfully", async () => {
            const result = await client.stakeWithDetails(quantity, providerDetails);
            expect(result).toBe(true);
            expect(mockTokenClient.transfer).toHaveBeenCalledWith(
                expect.any(String),
                quantity,
                expect.arrayContaining([
                    { name: "Stake", value: "true" },
                    { name: "ProviderDetails", value: JSON.stringify(providerDetails) }
                ])
            );
        });

        it("should handle staking errors", async () => {
            mockTokenClient.transfer.mockRejectedValueOnce(new Error("Transfer failed"));

            await expect(client.stakeWithDetails(quantity, providerDetails))
                .rejects.toThrow(StakeWithDetailsError);
        });
    });

    describe("getStake", () => {
        const providerId = "test-provider-id";
        const mockStakeInfo = { amount: "1000", timestamp: 123456789 };

        it("should get stake info successfully", async () => {
            const customDryRunResult: DryRunResult = {
                Output: undefined,
                Messages: [{ Data: JSON.stringify(mockStakeInfo), Tags: [] }],
                Spawns: []
            };
            jest.spyOn(BaseClient.prototype, 'dryrun').mockResolvedValueOnce(customDryRunResult);

            const result = await client.getStake(providerId);
            expect(result).toEqual(mockStakeInfo);
            expect(BaseClient.prototype.dryrun).toHaveBeenCalledWith(
                JSON.stringify({ providerId }),
                [{ name: "Action", value: "Get-Provider-Stake" }]
            );
        });

        it("should handle get stake errors", async () => {
            jest.spyOn(BaseClient.prototype, 'dryrun').mockRejectedValueOnce(new Error("Failed to get stake"));

            await expect(client.getStake(providerId))
                .rejects.toThrow(GetStakeError);
        });
    });

    describe("unstake", () => {
        const providerId = "test-provider-id";

        it("should unstake successfully", async () => {
            const result = await client.unstake(providerId);
            expect(result).toBe(true);
            expect(BaseClient.prototype.messageResult).toHaveBeenCalledWith(
                JSON.stringify({ providerId }),
                [{ name: "Action", value: "Unstake" }]
            );
        });

        it("should handle unstake errors", async () => {
            jest.spyOn(BaseClient.prototype, 'messageResult').mockRejectedValueOnce(new Error("Failed to unstake"));

            await expect(client.unstake(providerId))
                .rejects.toThrow(ProviderUnstakeError);
        });
    });
});
