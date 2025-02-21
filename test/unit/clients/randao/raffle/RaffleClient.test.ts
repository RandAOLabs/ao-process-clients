import { RaffleClient } from "src/clients/randao/raffle";
import { RafflePull } from "src/clients/randao/raffle/abstract";
import { ViewPullError } from "src/clients/randao/raffle/RaffleClientError";
import { Logger, LogLevel } from "src/utils";
import { MockBaseClient } from "test/unit/clients/MockBaseClient";

describe("RaffleClient Unit Tests", () => {
    let mockBaseClient: MockBaseClient;
    let client: RaffleClient;

    beforeEach(() => {
        Logger.setLogLevel(LogLevel.NONE)
        // Logger.setLogLevel(LogLevel.DEBUG)
        mockBaseClient = new MockBaseClient();
        client = RaffleClient.autoConfiguration()
        mockBaseClient.bindToClient(client);
    });

    describe("viewMostRecentPull", () => {
        it("should return pull with highest ID", async () => {
            // Setup mock data
            const mockPulls: RafflePull[] = [
                { Id: 1, CallbackId: "1", User: "user1" },
                { Id: 3, CallbackId: "3", User: "user3" },
                { Id: 2, CallbackId: "2", User: "user2" }
            ];
            mockBaseClient.setMockDataJson(mockPulls);

            const result = await client.viewMostRecentPull();
            expect(result.Id).toBe(3);
            expect(result.User).toBe("user3");
        });

        it("should throw error when no pulls exist", async () => {
            mockBaseClient.setMockDataJson([]);

            await expect(client.viewMostRecentPull())
                .rejects
                .toThrow(ViewPullError);
        });
    });
});
