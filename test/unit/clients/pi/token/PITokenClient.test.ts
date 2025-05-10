// Create mock functions that will be shared between direct imports and connect() return value
const message = jest.fn();
const messageResult = jest.fn();
const results = jest.fn();
const result = jest.fn();
const dryrun = jest.fn();
const mockCreateDataItemSigner = jest.fn();

jest.mock('@permaweb/aoconnect', () => ({
    // Direct exports
    createDataItemSigner: mockCreateDataItemSigner,
    // connect function that returns the same mock functions
    connect: jest.fn().mockReturnValue({
        message: message,
        messageResult: messageResult,
        results: results,
        result: result,
        dryrun: dryrun,
        createDataItemSigner: mockCreateDataItemSigner
    })
}));

import { DryRunResult } from "@permaweb/aoconnect/dist/lib/dryrun";
import { MessageResult } from "@permaweb/aoconnect/dist/lib/result";
import { PITokenClient } from "src/clients/pi/PIToken/PITokenClient";
import { PITokenClientError } from "src/clients/pi/PIToken/PITokenClientError";
import { PITokenInfo, TickHistoryEntry } from "src/clients/pi/PIToken/abstract/IPITokenClient";
import { AO_CONFIGURATIONS } from "src/core/ao/ao-client/configurations";

// Mock the logger
jest.mock('src/utils/logger/logger', () => {
    const actualLogger = jest.requireActual('src/utils/logger/logger');
    return {
        ...actualLogger,
        Logger: {
            ...actualLogger.Logger,
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            log: jest.fn(),
        },
    };
});

describe("PITokenClient", () => {
    let client: PITokenClient;
    const testProcessId = "test-pi-token-process-id";
    const testWalletAddress = "test-wallet-address";
    const testTickerSymbol = "TEST";

    beforeEach(() => {
        // Create a new client using the builder
        client = PITokenClient.builder()
            .withProcessId(testProcessId)
            .withAOConfig(AO_CONFIGURATIONS.RANDAO)
            .build();
        
        jest.clearAllMocks();
    });

    describe("getInfo()", () => {
        it("should call dryrun with correct parameters", async () => {
            // Arrange
            const mockResponse: DryRunResult = {
                Messages: [
                    {
                        Data: JSON.stringify({
                            type: "pi-token",
                            version: "1.0"
                        }),
                        Tags: []
                    }
                ],
                Output: null,
                Spawns: []
            };
            dryrun.mockResolvedValueOnce(mockResponse);

            // Act
            const result = await client.getInfo();

            // Assert
            expect(dryrun).toHaveBeenCalledWith(expect.objectContaining({
                tags: expect.arrayContaining([
                    { name: "Action", value: "Info" }
                ])
            }));
            expect(result).toBe(mockResponse);
        });

        it("should throw PITokenClientError on failure", async () => {
            // Arrange
            const mockError = new Error("API Error");
            dryrun.mockRejectedValueOnce(mockError);

            // Act & Assert
            await expect(client.getInfo()).rejects.toThrow(PITokenClientError);
        });
    });

    describe("getBalance()", () => {
        it("should call dryrun with correct parameters for a wallet", async () => {
            // Arrange
            const balanceData = "500";
            
            const mockResponse: DryRunResult = {
                Messages: [
                    {
                        Data: balanceData,
                        Tags: []
                    }
                ],
                Output: null,
                Spawns: []
            };
            dryrun.mockResolvedValueOnce(mockResponse);

            // Act
            const result = await client.getBalance(testWalletAddress);

            // Assert
            expect(dryrun).toHaveBeenCalledWith(expect.objectContaining({
                tags: expect.arrayContaining([
                    { name: "Action", value: "Balance" },
                    { name: "Target", value: testWalletAddress }
                ])
            }));
            expect(result).toEqual(balanceData);
        });

        it("should use default wallet address when none is provided", async () => {
            // Arrange
            const balanceData = "100";
            
            const mockResponse: DryRunResult = {
                Messages: [
                    {
                        Data: balanceData,
                        Tags: []
                    }
                ],
                Output: null,
                Spawns: []
            };
            dryrun.mockResolvedValueOnce(mockResponse);

            // Act
            const result = await client.getBalance();

            // Assert
            expect(dryrun).toHaveBeenCalledWith(expect.objectContaining({
                tags: expect.arrayContaining([
                    { name: "Action", value: "Balance" }
                ])
            }));
            expect(result).toEqual(balanceData);
        });

        it("should return default value on failure", async () => {
            // Arrange
            const mockError = new Error("API Error");
            dryrun.mockRejectedValueOnce(mockError);

            // Act & Assert
            const result = await client.getBalance(testWalletAddress);
            expect(result).toBe("0");
        });
    });

    describe("getTickHistory()", () => {
        it("should call dryrun with correct parameters", async () => {
            // Arrange
            const tickHistoryData = JSON.stringify([
                {
                    Timestamp: 1633027200,
                    TriggerMintReportIds: []
                },
                {
                    Timestamp: 1633113600,
                    TriggerMintReportIds: []
                }
            ]);
            
            const mockResponse: DryRunResult = {
                Messages: [
                    {
                        Data: tickHistoryData,
                        Tags: []
                    }
                ],
                Output: null,
                Spawns: []
            };
            dryrun.mockResolvedValueOnce(mockResponse);

            // Act
            const result = await client.getTickHistory();

            // Assert
            expect(dryrun).toHaveBeenCalledWith(expect.objectContaining({
                tags: expect.arrayContaining([
                    { name: "Action", value: "Tick-History" }
                ])
            }));
            expect(result).toEqual(tickHistoryData);
        });

        it("should return default value on failure", async () => {
            // Arrange
            const mockError = new Error("API Error");
            dryrun.mockRejectedValueOnce(mockError);

            // Act & Assert
            const result = await client.getTickHistory();
            expect(result).toBe("[]");
        });
    });

    describe("parseTickHistory()", () => {
        it("should parse tick history data correctly", () => {
            // Arrange
            const tickHistoryData = JSON.stringify([
                {
                    Timestamp: 1633027200,
                    TriggerMintReportIds: []
                },
                {
                    Timestamp: 1633113600,
                    TriggerMintReportIds: []
                }
            ]);

            // Act
            const result = client.parseTickHistory(tickHistoryData);

            // Assert
            expect(result).toHaveLength(2);
            expect(result[0].Timestamp).toEqual(1633027200);
            expect(result[1].Timestamp).toEqual(1633113600);
        });
    });
});
