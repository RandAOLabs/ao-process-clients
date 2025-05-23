import { Logger, LogLevel } from "src/utils";
import { DryRunCachingClientConfig, DryRunCachingClientConfigBuilder, ProfileClient } from "src/index";
import { MockBaseClient } from "test/unit/clients/MockBaseClient";
import ResultUtils from "src/core/common/result-utils/ResultUtils";

describe("ProfileClient Unit Tests", () => {
    let mockBaseClient: MockBaseClient;
    let client: ProfileClient;

    beforeEach(async () => {
        Logger.setLogLevel(LogLevel.NONE);
        // Logger.setLogLevel(LogLevel.DEBUG);
        mockBaseClient = new MockBaseClient();
        const config: DryRunCachingClientConfig = new DryRunCachingClientConfigBuilder()
            .withProcessId("test-process-id")
            .build()
        client = new ProfileClient(config);
        mockBaseClient.bindToClient(client);
        jest.spyOn(ResultUtils, 'getFirstMessageDataJson').mockReset();

    });

    describe("getProfileInfo", () => {
        it("should use provided address", async () => {
            // Setup mock data
            const mockProfileInfo = {
                Profile: {},
                Assets: [],
                Collections: [],
                Owner: "test-owner"
            };
            jest.spyOn(ResultUtils, 'getFirstMessageDataJson').mockReturnValueOnce(mockProfileInfo);

            const result = await client.getProfileInfo();
            expect(result).toEqual(mockProfileInfo);
        });

        it("should return parsed profile info with all expected fields", async () => {
            const mockProfileInfo = {
                Profile: { name: "Test User" },
                Assets: ["asset1", "asset2"],
                Collections: ["col1"],
                Owner: "test-owner"
            };
            jest.spyOn(ResultUtils, 'getFirstMessageDataJson').mockReturnValueOnce(mockProfileInfo);

            const result = await client.getProfileInfo();
            expect(result.Profile).toBeDefined();
            expect(result.Assets).toBeDefined();
            expect(result.Collections).toBeDefined();
            expect(result.Owner).toBeDefined();
            expect(result).toEqual(mockProfileInfo);
        });
    });

    describe("transferAsset", () => {
        it("should include additional tags if provided", async () => {
            const mockSuccessResult = {
                Output: undefined,
                Messages: [{ Data: "", Tags: [{ name: "Action", value: "Transfer-Success" }] }],
                Spawns: []
            };
            mockBaseClient.setMockMessageResult(mockSuccessResult);

            const additionalTags = [{ name: "Extra", value: "Tag" }];
            const result = await client.transferAsset("asset", "recipient", "1", additionalTags);
            expect(result).toBe(true);
        });

        it("should return true on successful transfer", async () => {
            const mockSuccessResult = {
                Output: undefined,
                Messages: [{ Data: "", Tags: [{ name: "Action", value: "Transfer-Success" }] }],
                Spawns: []
            };
            mockBaseClient.setMockMessageResult(mockSuccessResult);

            const result = await client.transferAsset("asset", "recipient", "1");
            expect(result).toBe(true);
        });

        it("should return false on failed transfer", async () => {
            const mockFailedResult = {
                Output: undefined,
                Messages: [{ Data: "", Tags: [{ name: "Action", value: "Transfer-Failed" }] }],
                Spawns: []
            };
            mockBaseClient.setMockMessageResult(mockFailedResult);

            const result = await client.transferAsset("asset", "recipient", "1");
            expect(result).toBe(false);
        });
    });
});
