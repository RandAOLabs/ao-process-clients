// import { ProviderStakingClient } from "src/clients/randao/provider-staking/ProviderStakingClient";
// import { PROVIDER_MINIMUM_STAKE } from "src/index";
// import { Logger, LogLevel, sleep } from "src/utils";

// describe("ProviderStaking Integration Tests", () => {
//     let client: ProviderStakingClient;
//     let providerId: string;

//     beforeAll(async () => {
//         Logger.setLogLevel(LogLevel.DEBUG)
//         client = ProviderStakingClient.autoConfiguration();
//         providerId = await client.getCallingWalletAddress();
//     });

//     it("should stake without provider details", async () => {
//         const stakeAmount = PROVIDER_MINIMUM_STAKE;
//         const result = await client.stakeWithDetails(stakeAmount);
//         expect(result).toBe(true);
//         await sleep(10)
//     });

//     it("should get stake and verify amount", async () => {

//         const stakeInfo = await client.getStake(providerId);
//         expect(stakeInfo.amount).toBeGreaterThan(0);

//     });

// //     it("should unstake successfully", async () => {
// //         const result = await client.unstake(providerId);
// //         expect(result).toBe(true);
// //     });
// });
