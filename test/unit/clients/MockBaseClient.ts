import { BaseClient } from "src/core/ao/BaseClient";
import { DryRunResult } from "@permaweb/aoconnect/dist/lib/dryrun";
import { MessageResult } from "@permaweb/aoconnect/dist/lib/result";
import { getWalletLazy } from "src/utils";

/**
 * Mock implementation of BaseClient for testing.
 * Allows setting return values for any BaseClient method and binding to any client.
 */
export class MockBaseClient extends BaseClient {
    // Define types for mock responses
    private mockResponses: {
        getFirstMessageDataJson?: any;
        dryrun?: DryRunResult;
        messageResult?: MessageResult;
    } = {};

    constructor() {
        super({
            processId: "mock-process-id",
            wallet: getWalletLazy()
        });
    }

    /**
     * Set mock response for getFirstMessageDataJson
     */
    setMockDataJson(response: any) {
        this.mockResponses.getFirstMessageDataJson = response;
    }

    /**
     * Set mock response for dryrun
     */
    setMockDryrun(response: DryRunResult) {
        this.mockResponses.dryrun = response;
    }

    /**
     * Set mock response for messageResult
     */
    setMockMessageResult(response: MessageResult) {
        this.mockResponses.messageResult = response;
    }

    /**
     * Clear all mock responses
     */
    clearMockResponses() {
        this.mockResponses = {};
    }

    /**
     * Override BaseClient methods to use mock responses
     */
    protected getFirstMessageDataJson(): any {
        return this.mockResponses.getFirstMessageDataJson;
    }

    async dryrun(): Promise<DryRunResult> {
        return this.mockResponses.dryrun || {
            Messages: [{ Tags: [] }],
            Output: "",
            Spawns: []
        };
    }

    async messageResult(): Promise<MessageResult> {
        return this.mockResponses.messageResult || {
            Messages: [{ Tags: [] }],
            Output: "",
            Spawns: []
        };
    }

    /**
     * Bind all BaseClient methods from this mock to a client instance
     * @param client Client instance to bind methods to
     */
    bindToClient(client: BaseClient) {
        const mockMethods = {
            getFirstMessageDataJson: this.getFirstMessageDataJson.bind(this),
            dryrun: this.dryrun.bind(this),
            messageResult: this.messageResult.bind(this)
        };

        // Use type assertion to bind methods
        Object.assign(client, mockMethods);
    }
}
