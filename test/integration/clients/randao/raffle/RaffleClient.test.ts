import { RaffleClient } from "src/clients/randao/raffle";
import { Logger } from "src/utils";

describe("RaffleClient Integration Tests", () => {
    let client: RaffleClient;

    beforeAll(() => {
        client = RaffleClient.autoConfiguration();
    });

    it("should perform basic raffle operations", async () => {
        // Set entrants
        const entrants = [
            "James Smith", "Mary Johnson", "Robert Williams",
            "Patricia Brown", "John Jones"
        ];
        const setResult = await client.setRaffleEntrants(entrants);
        Logger.info("Set entrants result:", setResult);

        // Pull raffle
        const pullResult = await client.pullRaffle();
        Logger.info("Pull raffle result:", pullResult);

        // View pulls
        const pulls = await client.viewPulls();
        Logger.info("View pulls result:", pulls);

        // View most recent pull
        const mostRecent = await client.viewMostRecentPull();
        Logger.info("Most recent pull:", mostRecent);
    });

    it("should get most recent pull after multiple pulls", async () => {
        // Set entrants
        const entrants = [
            "James Smith", "Mary Johnson", "Robert Williams",
            "Patricia Brown", "John Jones"
        ];
        await client.setRaffleEntrants(entrants);

        // Do multiple pulls
        await client.pullRaffle();
        await client.pullRaffle();
        await client.pullRaffle();

        // Get most recent pull
        const mostRecent = await client.viewMostRecentPull();
        Logger.info("Most recent pull after multiple pulls:", mostRecent);

        // Verify it matches the last pull in the full list
        const { pulls } = await client.viewPulls();
        const lastPull = pulls.reduce((max, current) => current.Id > max.Id ? current : max);
        Logger.info("Last pull from full list:", lastPull);
    });
});
