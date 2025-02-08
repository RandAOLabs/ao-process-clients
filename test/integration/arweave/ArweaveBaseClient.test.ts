import { Logger } from '../../../src';
import { ArweaveBaseClient } from '../../../src/core/arweave';
import * as fs from 'fs';
import * as path from 'path';

interface ProcessQueryResult {
    data: {
        transactions: {
            pageInfo: {
                hasNextPage: boolean;
            };
            edges: Array<{
                cursor: string;
                node: {
                    id: string;
                };
            }>;
        };
    }
}

describe('ArweaveBaseClient Integration Tests', () => {
    let client: ArweaveBaseClient;

    beforeAll(() => {
        client = ArweaveBaseClient.getInstance();
    });

    it('should collect all AO process IDs', async () => {
        const allProcessIds: string[] = [];
        let hasNextPage = true;
        let afterCursor = "";

        while (hasNextPage) {
            const query = `
                query {
                    transactions(
                        sort: HEIGHT_DESC
                        first: 100
                        after: "${afterCursor}"
                        tags: [
                            { name: "Data-Protocol", values: ["ao"] }
                            { name: "Type", values: ["Process"] }
                        ]
                        owners: ["w8qJRq87az9enOSVrCLAS6R1BAgbA9u6y14Fo1fMdWQ"]
                    ) {
                        pageInfo {
                            hasNextPage
                        }
                        edges {
                            cursor
                            node {
                                id
                            }
                        }
                    }
                }
            `;

            const result = (await client.graphQuery<ProcessQueryResult>(query)).data;

            // Add IDs from current page
            const pageIds = result.transactions.edges.map(edge => edge.node.id);
            allProcessIds.push(...pageIds);

            Logger.info(`Collected ${pageIds.length} process IDs from current page`);

            // Check if there are more pages
            hasNextPage = result.transactions.pageInfo.hasNextPage;
            if (hasNextPage && result.transactions.edges.length > 0) {
                afterCursor = result.transactions.edges[result.transactions.edges.length - 1].cursor;
                Logger.info(`Moving to next page with cursor: ${afterCursor}`);
            }
        }

        Logger.info(`Total process IDs collected: ${allProcessIds.length}`);

        // Write IDs to file
        const idsJson = JSON.stringify(allProcessIds, null, 2);
        fs.writeFileSync(path.join(process.cwd(), 'ids.json'), idsJson);
        Logger.info('Process IDs written to ids.json');

        expect(allProcessIds.length).toBeGreaterThan(0);
    }, 300000); // Increased timeout for multiple network requests
});
