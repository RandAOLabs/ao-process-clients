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
import { DelegationHistorianClient } from "src/clients/pi/historian/DelegationHistorianClient";
import { DelegationHistorianClientError } from "src/clients/pi/historian/DelegationHistorianClientError";
import { DelegationRecord, ProjectDelegationTotal } from "src/clients/pi/historian/IDelegationHistorianClient";
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

describe("DelegationHistorianClient", () => {
    let client: DelegationHistorianClient;
    const testProcessId = "test-historian-process-id";
    const testAddress = "test-wallet-address";

    beforeEach(() => {
        // Create a new client using the builder
        client = DelegationHistorianClient.builder()
            .withProcessId(testProcessId)
            .withAOConfig(AO_CONFIGURATIONS.RANDAO)
            .build();
        
        jest.clearAllMocks();
    });

    describe("getTotalDelegatedAOByProject()", () => {
        it("should call dryrun with correct parameters", async () => {
            // Arrange
            const mockResponse: DryRunResult = {
                Messages: [
                    {
                        Data: JSON.stringify({
                            "project1": "100",
                            "project2": "200"
                        }),
                        Tags: []
                    }
                ],
                Output: null,
                Spawns: []
            };
            dryrun.mockResolvedValueOnce(mockResponse);

            // Act
            const result = await client.getTotalDelegatedAOByProject();

            // Assert
            expect(dryrun).toHaveBeenCalledWith(expect.objectContaining({
                process: testProcessId,
                tags: [
                    { name: "Action", value: "Get-Total-Delegated-AO-By-Project" },
                    expect.any(Object) // library tag
                ]
            }));
            expect(result).toEqual([
                { projectId: "project1", amount: "100" },
                { projectId: "project2", amount: "200" }
            ]);
        });

        it("should handle empty response", async () => {
            // Arrange
            const mockResponse: DryRunResult = {
                Messages: [
                    {
                        Data: JSON.stringify({}),
                        Tags: []
                    }
                ],
                Output: null,
                Spawns: []
            };
            dryrun.mockResolvedValueOnce(mockResponse);

            // Act
            const result = await client.getTotalDelegatedAOByProject();

            // Assert
            expect(result).toEqual([]);
        });

        it("should throw error if no messages returned", async () => {
            // Arrange
            const mockResponse: DryRunResult = {
                Messages: [],
                Output: null,
                Spawns: []
            };
            dryrun.mockResolvedValueOnce(mockResponse);

            // Act & Assert
            await expect(client.getTotalDelegatedAOByProject()).rejects.toThrow('No data returned from Get-Total-Delegated-AO-By-Project');
        });

        it("should throw DelegationHistorianClientError on failure", async () => {
            // Arrange
            const mockError = new Error("API Error");
            dryrun.mockRejectedValueOnce(mockError);

            // Act & Assert
            await expect(client.getTotalDelegatedAOByProject()).rejects.toThrow(DelegationHistorianClientError);
        });
    });

    describe("getLastRecord()", () => {
        it("should call dryrun with correct parameters", async () => {
            // Arrange
            const mockRecord: DelegationRecord = {
                timestamp: 123456789,
                delegations: {
                    "project1": "100",
                    "project2": "200"
                }
            };
            
            const mockResponse: DryRunResult = {
                Messages: [
                    {
                        Data: JSON.stringify(mockRecord),
                        Tags: []
                    }
                ],
                Output: null,
                Spawns: []
            };
            dryrun.mockResolvedValueOnce(mockResponse);

            // Act
            const result = await client.getLastRecord();

            // Assert
            expect(dryrun).toHaveBeenCalledWith(expect.objectContaining({
                process: testProcessId,
                tags: [
                    { name: "Action", value: "Get-Last-Record" },
                    expect.any(Object) // library tag
                ]
            }));
            expect(result).toEqual(mockRecord);
        });

        it("should throw error if no messages returned", async () => {
            // Arrange
            const mockResponse: DryRunResult = {
                Messages: [],
                Output: null,
                Spawns: []
            };
            dryrun.mockResolvedValueOnce(mockResponse);

            // Act & Assert
            await expect(client.getLastRecord()).rejects.toThrow('No data returned from Get-Last-Record');
        });

        it("should throw DelegationHistorianClientError on failure", async () => {
            // Arrange
            const mockError = new Error("API Error");
            dryrun.mockRejectedValueOnce(mockError);

            // Act & Assert
            await expect(client.getLastRecord()).rejects.toThrow(DelegationHistorianClientError);
        });
    });

    describe("getLastNRecords()", () => {
        it("should call dryrun with correct parameters", async () => {
            // Arrange
            const count = 5;
            const mockRecords: DelegationRecord[] = [
                {
                    timestamp: 123456789,
                    delegations: {
                        "project1": "100",
                        "project2": "200"
                    }
                },
                {
                    timestamp: 123456790,
                    delegations: {
                        "project1": "150",
                        "project2": "250"
                    }
                }
            ];
            
            const mockResponse: DryRunResult = {
                Messages: [
                    {
                        Data: JSON.stringify(mockRecords),
                        Tags: []
                    }
                ],
                Output: null,
                Spawns: []
            };
            dryrun.mockResolvedValueOnce(mockResponse);

            // Act
            const result = await client.getLastNRecords(count);

            // Assert
            expect(dryrun).toHaveBeenCalledWith(expect.objectContaining({
                process: testProcessId,
                tags: [
                    { name: "Action", value: "Get-Last-N-Records" },
                    { name: "Count", value: count.toString() },
                    expect.any(Object) // library tag
                ]
            }));
            expect(result).toEqual(mockRecords);
        });

        it("should default to 10 records if count is not provided", async () => {
            // Arrange
            const mockRecords: DelegationRecord[] = [
                {
                    timestamp: 123456789,
                    delegations: {
                        "project1": "100",
                        "project2": "200"
                    }
                }
            ];
            
            const mockResponse: DryRunResult = {
                Messages: [
                    {
                        Data: JSON.stringify(mockRecords),
                        Tags: []
                    }
                ],
                Output: null,
                Spawns: []
            };
            dryrun.mockResolvedValueOnce(mockResponse);

            // Act
            const result = await client.getLastNRecords(10); // Use the default count explicitly

            // Assert
            expect(dryrun).toHaveBeenCalledWith(expect.objectContaining({
                process: testProcessId,
                tags: [
                    { name: "Action", value: "Get-Last-N-Records" },
                    { name: "Count", value: "10" },
                    expect.any(Object) // library tag
                ]
            }));
            expect(result).toEqual(mockRecords);
        });

        it("should throw error if no messages returned", async () => {
            // Arrange
            const mockResponse: DryRunResult = {
                Messages: [],
                Output: null,
                Spawns: []
            };
            dryrun.mockResolvedValueOnce(mockResponse);

            // Act & Assert
            await expect(client.getLastNRecords(5)).rejects.toThrow('No data returned from Get-Last-N-Records');
        });

        it("should throw DelegationHistorianClientError on failure", async () => {
            // Arrange
            const mockError = new Error("API Error");
            dryrun.mockRejectedValueOnce(mockError);

            // Act & Assert
            await expect(client.getLastNRecords(5)).rejects.toThrow(DelegationHistorianClientError);
        });
    });
});
