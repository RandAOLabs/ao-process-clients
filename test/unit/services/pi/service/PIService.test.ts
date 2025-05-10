import { jest } from '@jest/globals';
import { PIService } from 'src/services/pi/PIService';
import { PIOracleClient } from 'src/clients/pi/oracle/PIOracleClient';
import { PIDelegateClient } from 'src/clients/pi/delegate/PIDelegateClient';
import { DelegationHistorianClient } from 'src/clients/pi/historian/DelegationHistorianClient';
import { PIToken } from 'src/clients/pi/oracle/abstract/IPIOracleClient';
import { DelegationInfo, SetDelegationOptions } from 'src/clients/pi/delegate/abstract/IPIDelegateClient';
import { DelegationRecord, ProjectDelegationTotal } from 'src/clients/pi/historian/IDelegationHistorianClient';
import { PITokenExtended } from 'src/services/pi/abstract/IPIService';
import { DryRunResult } from '@permaweb/aoconnect/dist/lib/dryrun';

// Mock the client classes
jest.mock('src/clients/pi/oracle/PIOracleClient');
jest.mock('src/clients/pi/delegate/PIDelegateClient');
jest.mock('src/clients/pi/historian/DelegationHistorianClient');

describe('PIService', () => {
    let service: PIService;
    let mockOracleClient: jest.Mocked<PIOracleClient>;
    let mockDelegateClient: jest.Mocked<PIDelegateClient>;
    let mockHistorianClient: jest.Mocked<DelegationHistorianClient>;

    const testWalletAddress = 'test-wallet-address';
    const testTokens: PIToken[] = [
        { 
            ticker: 'TK1', 
            id: 'id1',
            process: 'process1',
            status: 'active',
            treasury: 'treasury1'
        },
        { 
            ticker: 'TK2', 
            id: 'id2',
            process: 'process2',
            status: 'active',
            treasury: 'treasury2'
        }
    ];

    const testDelegationInfo: DelegationInfo = {
        wallet: testWalletAddress,
        delegationPrefs: [
            {
                walletTo: 'recipient-address',
                factor: 0.5
            }
        ],
        totalFactor: "0.5",
        lastUpdate: 123456789
    };

    const testDelegationRecords: DelegationRecord[] = [
        {
            timestamp: 123456789,
            delegations: {
                "project1": "100",
                "project2": "200"
            }
        }
    ];

    const testTotalDelegated: ProjectDelegationTotal[] = [
        {
            projectId: 'project1',
            amount: '100'
        }
    ];

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Set up mock objects
        mockOracleClient = {
            getPITokens: jest.fn().mockResolvedValue(JSON.stringify(testTokens)),
            parsePITokens: jest.fn().mockReturnValue(testTokens),
            getInfo: jest.fn().mockResolvedValue({} as DryRunResult),
            builder: jest.fn().mockReturnThis() as any
        } as unknown as jest.Mocked<PIOracleClient>;

        mockDelegateClient = {
            getDelegation: jest.fn().mockResolvedValue(JSON.stringify(testDelegationInfo)),
            parseDelegationInfo: jest.fn().mockReturnValue(testDelegationInfo),
            setDelegation: jest.fn().mockResolvedValue('test-message-id'),
            getInfo: jest.fn().mockResolvedValue({} as DryRunResult),
            builder: jest.fn().mockReturnThis() as any
        } as unknown as jest.Mocked<PIDelegateClient>;

        mockHistorianClient = {
            getTotalDelegatedAOByProject: jest.fn().mockResolvedValue(testTotalDelegated),
            getLastRecord: jest.fn().mockResolvedValue(testDelegationRecords[0]),
            getLastNRecords: jest.fn().mockResolvedValue(testDelegationRecords),
            getInfo: jest.fn().mockResolvedValue({} as DryRunResult),
            builder: jest.fn().mockReturnThis() as any
        } as unknown as jest.Mocked<DelegationHistorianClient>;
        
        // Create the service with mocked dependencies
        service = new PIService(
            mockOracleClient,
            mockDelegateClient,
            mockHistorianClient
        );
    });

    describe('getAllPITokens', () => {
        it('should return all PI tokens with extended information', async () => {
            // Act
            const result = await service.getAllPITokens();

            // Assert
            expect(mockOracleClient.getPITokens).toHaveBeenCalled();
            expect(result.length).toEqual(testTokens.length);
            expect(result[0].token.ticker).toEqual(testTokens[0].ticker);
        });

        it('should handle empty token list', async () => {
            // Arrange
            mockOracleClient.parsePITokens = jest.fn().mockReturnValue([]);

            // Act
            const result = await service.getAllPITokens();

            // Assert
            expect(result).toEqual([]);
        });
    });

    describe('getUserDelegations', () => {
        it('should get delegation data for a wallet', async () => {
            // Act
            const result = await service.getUserDelegations(testWalletAddress);

            // Assert
            expect(mockDelegateClient.getDelegation).toHaveBeenCalledWith(testWalletAddress);
            expect(result).toEqual(testDelegationInfo);
        });

        it('should handle null delegation response', async () => {
            // Arrange
            mockDelegateClient.parseDelegationInfo = jest.fn().mockReturnValue(null);

            // Act
            const result = await service.getUserDelegations(testWalletAddress);

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('getDelegationHistory', () => {
        it('should get delegation history with default count', async () => {
            // Arrange
            const defaultCount = 10;
            
            // Act
            const result = await service.getDelegationHistory(defaultCount);

            // Assert
            expect(mockHistorianClient.getLastNRecords).toHaveBeenCalledWith(defaultCount);
            expect(result).toEqual(testDelegationRecords);
        });

        it('should pass custom count parameter', async () => {
            // Arrange
            const customCount = 5;
            
            // Act
            await service.getDelegationHistory(customCount);

            // Assert
            expect(mockHistorianClient.getLastNRecords).toHaveBeenCalledWith(customCount);
        });
    });

    describe('getTotalDelegatedAOByProject', () => {
        it('should get total delegated information', async () => {
            // Act
            const result = await service.getTotalDelegatedAOByProject();

            // Assert
            expect(mockHistorianClient.getTotalDelegatedAOByProject).toHaveBeenCalled();
            expect(result).toEqual(testTotalDelegated);
        });
    });

    describe('setDelegation', () => {
        it('should set delegation preference', async () => {
            // Arrange
            const walletFrom = 'sender-address';
            const walletTo = 'recipient-address';
            const factor = 0.5;
            const expectedOptions: SetDelegationOptions = {
                walletFrom,
                walletTo,
                factor
            };
            const expectedResult = 'test-message-id';
            
            // Act
            const result = await service.setDelegation(walletFrom, walletTo, factor);

            // Assert
            expect(mockDelegateClient.setDelegation).toHaveBeenCalledWith(expectedOptions);
            expect(result).toEqual(expectedResult);
        });
    });
});
