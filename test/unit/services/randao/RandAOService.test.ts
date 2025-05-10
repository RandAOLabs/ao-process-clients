import { ProviderProfileClient, RandomClient } from "src/clients";
import { RandAOService } from "src/services/randao";
import { ProviderInfoAggregate } from "src/services/randao/abstract/types";
import { TokenClientConfig } from "src/clients/ao";
import { ProviderInfoDataAggregator } from "src/services/randao/ProviderInfoDataAggregator";

// Mock dependencies
jest.mock("src/clients/randao/random/RandomClient");
jest.mock("src/clients/randao/provider-profile/ProviderProfileClient");
jest.mock("src/services/randao/ProviderInfoDataAggregator");

describe("RandAOService", () => {
	let mockRandomClient: jest.Mocked<RandomClient>;
	let mockProviderProfileClient: jest.Mocked<ProviderProfileClient>;
	let mockProviderInfoDataAggregator: jest.Mocked<ProviderInfoDataAggregator>;

	beforeEach(() => {
		// Clear all mocks
		jest.clearAllMocks();

		// Setup mock implementations
		// Create mock config
		const mockConfig: TokenClientConfig = {
			processId: "test-process",
			wallet: {} as any
		};

		// Setup mock clients
		mockRandomClient = new RandomClient({ 
			...mockConfig, 
			tokenProcessId: "test-token",
			tokenAOConfig: {
				MODE: 'legacy',
				GRAPHQL_URL: "https://test",
				MU_URL: "https://test"
			}
		}) as jest.Mocked<RandomClient>;
		mockProviderProfileClient = new ProviderProfileClient(mockConfig) as jest.Mocked<ProviderProfileClient>;

		// Create mock aggregator through its static method
		mockProviderInfoDataAggregator = {
			updateProviderData: jest.fn().mockResolvedValue(undefined),
			getAggregatedData: jest.fn().mockReturnValue([])
		} as unknown as jest.Mocked<ProviderInfoDataAggregator>;

		// Mock static methods
		(RandomClient.autoConfiguration as jest.Mock).mockResolvedValue(mockRandomClient);
		(ProviderProfileClient.autoConfiguration as jest.Mock).mockReturnValue(mockProviderProfileClient);
		(ProviderInfoDataAggregator.autoConfiguration as jest.Mock).mockResolvedValue(mockProviderInfoDataAggregator);

		// Mock instance methods with some data
		mockRandomClient.getAllProviderActivity = jest.fn().mockResolvedValue([{
			provider_id: "test-provider",
			active: 1,
			created_at: Date.now(),
			random_balance: 100,
			staked: 1,
			active_challenge_requests: { request_ids: [] },
			active_output_requests: { request_ids: [] }
		}]);
		mockRandomClient.getProviderActivity = jest.fn().mockResolvedValue({
			provider_id: "test-provider",
			active: 1,
			created_at: Date.now(),
			random_balance: 100,
			staked: 1,
			active_challenge_requests: { request_ids: [] },
			active_output_requests: { request_ids: [] }
		});
		mockProviderProfileClient.getAllProvidersInfo = jest.fn().mockResolvedValue([{
			provider_id: "test-provider",
			created_at: Date.now(),
			stake: {
				timestamp: Date.now(),
				status: "active",
				amount: "1000",
				token: "test-token",
				provider_id: "test-provider"
			}
		}]);
		mockProviderProfileClient.getProviderInfo = jest.fn().mockResolvedValue({
			provider_id: "test-provider",
			created_at: Date.now(),
			stake: {
				timestamp: Date.now(),
				status: "active",
				amount: "1000",
				token: "test-token",
				provider_id: "test-provider"
			}
		});
		mockProviderInfoDataAggregator.updateProviderData = jest.fn().mockResolvedValue(undefined);
		mockProviderInfoDataAggregator.getAggregatedData = jest.fn().mockReturnValue([]);
	});

	describe("autoConfiguration", () => {
		it("should create instance with auto-configured clients", async () => {
			// Act
			const service = await RandAOService.autoConfiguration();

			// Assert
			expect(RandomClient.autoConfiguration).toHaveBeenCalled();
			expect(ProviderProfileClient.autoConfiguration).toHaveBeenCalled();
			expect(service).toBeInstanceOf(RandAOService);
		});
	});

	describe("getAllProviderInfo", () => {
		it("should process provider data and return aggregated results", async () => {
			// Arrange
			const service = new RandAOService(mockRandomClient, mockProviderProfileClient);
			const mockAggregatedData: ProviderInfoAggregate[] = [];
			mockProviderInfoDataAggregator.getAggregatedData.mockReturnValue(mockAggregatedData);

			// Act
			const result = await service.getAllProviderInfo();

			// Assert
			expect(mockRandomClient.getAllProviderActivity).toHaveBeenCalled();
			expect(mockProviderProfileClient.getAllProvidersInfo).toHaveBeenCalled();
			expect(mockProviderInfoDataAggregator.getAggregatedData).toHaveBeenCalled();
			expect(result).toBe(mockAggregatedData);
		});
	});

	describe("getAllInfoForProvider", () => {
		const providerId = "test-provider";
		const mockProviderData: ProviderInfoAggregate = {
			providerId,
			providerInfo: {
				provider_id: providerId,
				created_at: Date.now(),
				stake: {
					timestamp: Date.now(),
					status: "active",
					amount: "1000",
					token: "test-token",
					provider_id: providerId
				}
			},
			providerActivity: {
				provider_id: providerId,
				active: 1,
				created_at: Date.now(),
				random_balance: 100,
				staked: 1,
				active_challenge_requests: { request_ids: [] },
				active_output_requests: { request_ids: [] }
			}
		};

		it("should process provider data and return aggregated results for a specific provider", async () => {
			// Arrange
			const service = new RandAOService(mockRandomClient, mockProviderProfileClient);
			mockProviderInfoDataAggregator.getAggregatedData.mockReturnValue([mockProviderData]);

			// Act
			const result = await service.getAllInfoForProvider(providerId);

			// Assert
			expect(mockRandomClient.getProviderActivity).toHaveBeenCalledWith(providerId);
			expect(mockProviderProfileClient.getProviderInfo).toHaveBeenCalledWith(providerId);
			expect(mockProviderInfoDataAggregator.getAggregatedData).toHaveBeenCalled();
			expect(result).toEqual(mockProviderData);
		});

		it("should return only providerId when RandomClient throws an error", async () => {
			// Arrange
			const service = new RandAOService(mockRandomClient, mockProviderProfileClient);

			// Mock implementation that throws an error
			mockRandomClient.getProviderActivity = jest.fn().mockImplementation(() => {
				throw new Error("Random client error");
			});

			// Act
			const result = await service.getAllInfoForProvider(providerId);

			// Assert
			expect(result).toEqual({ providerId });
		});

		it("should return only providerId when ProviderProfileClient throws an error", async () => {
			// Arrange
			const service = new RandAOService(mockRandomClient, mockProviderProfileClient);

			// Mock implementation that throws an error
			mockProviderProfileClient.getProviderInfo = jest.fn().mockImplementation(() => {
				throw new Error("Profile client error");
			});

			// Act
			const result = await service.getAllInfoForProvider(providerId);

			// Assert
			expect(result).toEqual({ providerId });
		});
	});
});
