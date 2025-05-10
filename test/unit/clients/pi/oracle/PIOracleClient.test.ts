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
import { PIOracleClient } from "src/clients/pi/oracle/PIOracleClient";
import { PIOracleClientError } from "src/clients/pi/oracle/PIOracleClientError";
import { PIToken } from "src/clients/pi/oracle/abstract/IPIOracleClient";
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

describe("PIOracleClient", () => {
    let client: PIOracleClient;
    const testProcessId = "test-pi-oracle-process-id";

    beforeEach(() => {
        // Create a new client using the builder
        client = PIOracleClient.builder()
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
                            type: "pi-oracle",
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
            expect(dryrun).toHaveBeenCalledWith('', [
                { name: "Action", value: "Info" }
            ]);
            expect(result).toBe(mockResponse);
        });

        it("should throw PIOracleClientError on failure", async () => {
            // Arrange
            const mockError = new Error("API Error");
            dryrun.mockRejectedValueOnce(mockError);

            // Act & Assert
            await expect(client.getInfo()).rejects.toThrow(PIOracleClientError);
        });
    });

    describe("getPITokens()", () => {
        it("should call dryrun with correct parameters and parse the response", async () => {
            // Arrange
            const mockTokens: PIToken[] = [
                {
                    ticker: "PIX",
                    name: "Pixel Token",
                    owner: "owner1",
                    totalSupply: 1000000,
                    processId: "process1",
                    specificProcessId: "specific1",
                    delegationProcessId: "delegation1"
                },
                {
                    ticker: "ART",
                    name: "Art Token",
                    owner: "owner2",
                    totalSupply: 500000,
                    processId: "process2",
                    specificProcessId: "specific2",
                    delegationProcessId: "delegation2"
                }
            ];
            
            const mockResponse: DryRunResult = {
                Messages: [
                    {
                        Data: JSON.stringify(mockTokens),
                        Tags: []
                    }
                ],
                Output: null,
                Spawns: []
            };
            dryrun.mockResolvedValueOnce(mockResponse);

            // Act
            const result = await client.getPITokens();

            // Assert
            expect(dryrun).toHaveBeenCalledWith('', [
                { name: "Action", value: "Get-PI-Tokens" }
            ]);
            expect(result).toEqual(mockTokens);
        });

        it("should handle empty response", async () => {
            // Arrange
            const mockResponse: DryRunResult = {
                Messages: [
                    {
                        Data: JSON.stringify([]),
                        Tags: []
                    }
                ],
                Output: null,
                Spawns: []
            };
            dryrun.mockResolvedValueOnce(mockResponse);

            // Act
            const result = await client.getPITokens();

            // Assert
            expect(result).toEqual([]);
        });

        it("should throw PIOracleClientError on failure", async () => {
            // Arrange
            const mockError = new Error("API Error");
            dryrun.mockRejectedValueOnce(mockError);

            // Act & Assert
            await expect(client.getPITokens()).rejects.toThrow(PIOracleClientError);
        });
    });
});
