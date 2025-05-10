import { PIDataAggregator } from 'src/services/pi/PIDataAggregator';
import { PIToken } from 'src/clients/pi/oracle/abstract/IPIOracleClient';
import { DelegationInfo } from 'src/clients/pi/delegate/abstract/IPIDelegateClient';
import { DelegationRecord, ProjectDelegationTotal } from 'src/clients/pi/historian/IDelegationHistorianClient';
import { TickHistoryEntry } from 'src/clients/pi/PIToken/abstract/IPITokenClient';

// Using a clean test approach to avoid TypeScript errors
describe('PIDataAggregator', () => {
    let aggregator: PIDataAggregator;
    
    // Test data with proper types matching the actual interfaces
    const mockTokens: PIToken[] = [
        { 
            ticker: 'TK1', 
            id: 'id1',
            process: 'process1',
            status: 'active',
            treasury: 'treasury1'
        }
    ];

    const mockDelegationInfo: DelegationInfo = {
        wallet: 'test-wallet-address',
        delegationPrefs: [
            {
                walletTo: 'process1',
                factor: 0.5
            }
        ],
        totalFactor: "0.5",
        lastUpdate: 123456789
    };

    const mockDelegationRecords: DelegationRecord[] = [
        {
            timestamp: 123456789,
            delegations: {
                'process1': '100'
            }
        }
    ];

    const mockProjectDelegations: ProjectDelegationTotal[] = [
        {
            projectId: 'process1',
            amount: '100'
        }
    ];

    const mockTickHistory: TickHistoryEntry[] = [
        {
            Timestamp: 123456789,
            TriggerMintReportIds: []
        }
    ];

    // Simple mock clients (using any type to avoid TypeScript errors)
    const mockPITokenClient = {} as any;
    const mockTokenClient = {} as any;

    beforeEach(() => {
        // Create a new aggregator for each test
        aggregator = new PIDataAggregator();
    });

    describe('updateTokenData', () => {
        it('should update token data correctly', async () => {
            // Act
            await aggregator.updateTokenData(mockTokens[0]);

            // Assert
            const tokens = aggregator.getAggregatedTokens();
            expect(tokens.length).toBe(1);
            expect(tokens[0].ticker).toBe(mockTokens[0].ticker);
        });

        it('should handle invalid token data gracefully', async () => {
            // This is important as noted in the memory about handling various response formats
            const invalidToken = {} as PIToken;
            
            // Mock console.warn to prevent test output noise
            const originalWarn = console.warn;
            console.warn = jest.fn();
            
            try {
                // Act
                await aggregator.updateTokenData(invalidToken);
    
                // Assert - should not throw an error and return an empty array
                const tokens = aggregator.getAggregatedTokens();
                expect(tokens.length).toBe(0);
                
                // Verify the warning was called
                expect(console.warn).toHaveBeenCalledWith(
                    'Invalid token data received:',
                    expect.anything()
                );
            } finally {
                // Restore console.warn
                console.warn = originalWarn;
            }
        });
    });

    describe('updateDelegations', () => {
        it('should update delegation information correctly', async () => {
            // Arrange
            await aggregator.updateTokenData(mockTokens[0]);

            // Act
            await aggregator.updateDelegations(mockDelegationInfo);

            // Assert
            const info = aggregator.getDelegationInfo();
            expect(info).toBe(mockDelegationInfo);
        });
    });

    describe('updateDelegationHistory', () => {
        it('should update delegation history correctly', async () => {
            // Act
            await aggregator.updateDelegationHistory(mockDelegationRecords);

            // Assert
            const history = aggregator.getDelegationHistory();
            expect(history).toEqual(mockDelegationRecords);
        });
    });

    describe('updateProjectDelegations', () => {
        it('should update project delegation totals correctly', async () => {
            // Act
            await aggregator.updateProjectDelegations(mockProjectDelegations);

            // Assert
            const projects = aggregator.getProjectDelegations();
            expect(projects).toEqual(mockProjectDelegations);
        });
    });

    describe('updateTokenClients', () => {
        it('should associate token clients with a token', async () => {
            // Arrange
            const tokenId = 'process1';

            // Act
            await aggregator.updateTokenClients(tokenId, mockPITokenClient, mockTokenClient);
            
            // First add a token to make it detectable
            await aggregator.updateTokenData({ ...mockTokens[0], process: tokenId });

            // Assert
            const tokens = aggregator.getAggregatedTokens();
            const token = tokens.find(t => t.process === tokenId);
            expect(token).toBeDefined();
            expect(token?.piTokenClient).toBe(mockPITokenClient);
            expect(token?.baseTokenClient).toBe(mockTokenClient);
        });
    });

    describe('updateTickHistory', () => {
        it('should update tick history for a token', async () => {
            // Start with a fresh aggregator for this test to avoid interference
            const testAggregator = new PIDataAggregator();
            const tokenId = 'process1';
            
            // Create a token entry first
            const testToken = { 
                id: tokenId,
                ticker: 'TEST',
                process: tokenId,
                status: 'active'
            };
            await testAggregator.updateTokenData(testToken);
            
            // Now explicitly update the tick history
            await testAggregator.updateTickHistory(tokenId, [...mockTickHistory]);
            
            // Get the token and verify its tick history
            const tokens = testAggregator.getAggregatedTokens();
            const token = tokens.find(t => t.process === tokenId);
            
            expect(token).toBeDefined();
            expect(token?.tickHistory).toEqual(mockTickHistory);
        });

        // Testing response format resilience (consistent with the memory about PITokenClient)
        it('should handle empty tick history gracefully', async () => {
            // Start with a fresh aggregator for this test to avoid interference
            const testAggregator = new PIDataAggregator();
            const tokenId = 'process1';
            
            // Create a token entry first
            const testToken = { 
                id: tokenId,
                ticker: 'TEST',
                process: tokenId,
                status: 'active'
            };
            await testAggregator.updateTokenData(testToken);
            
            // Update with empty tick history
            await testAggregator.updateTickHistory(tokenId, []);
            
            // Get the token and verify its tick history
            const tokens = testAggregator.getAggregatedTokens();
            const token = tokens.find(t => t.process === tokenId);
            
            expect(token).toBeDefined();
            expect(token?.tickHistory).toEqual([]);
        });
    });

    describe('getAggregatedTokens', () => {
        it('should return the aggregated token data', async () => {
            // Arrange
            await aggregator.updateTokenData(mockTokens[0]);
            await aggregator.updateDelegations(mockDelegationInfo);
            await aggregator.updateDelegationHistory(mockDelegationRecords);
            await aggregator.updateProjectDelegations(mockProjectDelegations);

            // Act
            const tokens = aggregator.getAggregatedTokens();

            // Assert
            expect(tokens.length).toBe(1);
            expect(tokens[0].ticker).toBe(mockTokens[0].ticker);
        });

        it('should return an empty array when no tokens exist', () => {
            // Act
            const tokens = aggregator.getAggregatedTokens();

            // Assert - defensive coding approach as noted in memory
            expect(tokens).toEqual([]);
        });
    });
});
