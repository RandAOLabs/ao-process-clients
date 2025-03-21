import { IANTClient } from "src/clients/ario/ant/abstract/IANTClient";
import { ANTRecord, ANTRecords } from "src/clients/ario/ant/abstract/types";
import { GetANTRecordsError, GetANTRecordError } from "src/clients/ario/ant/ANTClientError";
import { DryRunCachingClient } from "src/core/ao/client-variants";
import { DryRunCachingClientConfigBuilder } from "src/core/ao/configuration/builder";
import ResultUtils from "src/core/common/result-utils/ResultUtils";

/**
 * Client for interacting with ANT (Arweave Name Token) records.
 * @category ARIO
 */
export class ANTClient extends DryRunCachingClient implements IANTClient {
    /**
     * Retrieves all ANT records.
     * @returns Promise resolving to a record of ANT records
     */
    public async getRecords(): Promise<ANTRecords> {
        try {
            const result = await this.dryrun('', [
                { name: "Action", value: "Records" }
            ]);
            return ResultUtils.getFirstMessageDataJson<ANTRecords>(result);
        } catch (error: any) {
            throw new GetANTRecordsError(error);
        }
    }

    /**
     * Retrieves a specific ANT record by name.
     * @param undername - The undername to get the ANT record for
     * @returns Promise resolving to the ANT record if found, undefined otherwise
     */
    public async getRecord(undername: string): Promise<ANTRecord | undefined> {
        try {
            const result = await this.dryrun('', [
                { name: "Sub-Domain", value: undername },
                { name: "Action", value: "Record" }
            ]);
            return ResultUtils.getFirstMessageDataJson<ANTRecord>(result);
        } catch (error: any) {
            throw new GetANTRecordError(undername, error);
        }
    }

}
