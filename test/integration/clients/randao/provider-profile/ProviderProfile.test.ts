// import { ProviderProfileClient } from "src/clients/randao/provider-profile/ProviderProfileClient";
// import { ProviderDetails } from "src/clients/randao/provider-profile/abstract/types";
// import { Logger, LogLevel, sleep } from "src/utils";

// describe("ProviderProfile Integration Tests", () => {
//     let client: ProviderProfileClient;

//     beforeAll(() => {
//         Logger.setLogLevel(LogLevel.DEBUG)
//         client = ProviderProfileClient.autoConfiguration();

//     });

//     it("should get auto configuration", () => {
//         expect(client).toBeInstanceOf(ProviderProfileClient);
//     });

//     it("should get all providers info", async () => {
//         const providers = await client.getAllProvidersInfo();
//         expect(providers.length).toBeGreaterThan(0);
//     });

//     it("should get provider info without providerId", async () => {
//         const info = await client.getProviderInfo();
//         expect(info).toBeDefined();
//     });

//     it("should update provider details and persist changes", async () => {
//         const randomName = `Test Provider ${Math.random().toString(36).substring(7)}`;
//         const details: ProviderDetails = {
//             name: randomName,
//         };

//         await client.updateDetails(details);

//         const updatedInfo = await client.getProviderInfo();
//         expect(updatedInfo.provider_details?.name).toBe(randomName);
//     });
// });
