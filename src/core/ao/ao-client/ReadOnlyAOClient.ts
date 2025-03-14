import { connect } from '@permaweb/aoconnect';
import { MessageResult, ReadResult } from '@permaweb/aoconnect/dist/lib/result';
import { ReadResults, ResultsResponse } from '@permaweb/aoconnect/dist/lib/results';
import { DryRun, DryRunResult } from '@permaweb/aoconnect/dist/lib/dryrun';
import { Tags } from 'src/core/common';
import { DryRunParams } from './abstract';
import { IAOClient } from './abstract/IAOClient';
import { ConnectArgsLegacy } from './aoconnect-types';
import { AOSuspectedRateLimitingError } from './AOError';
import { AO_CONFIGURATION_DEFAULT } from 'src/core/ao/ao-client/configurations';
import { AOReadOnlyClientError } from 'src/core/ao/ao-client/AOClientError';
import { SortOrder } from 'src/core/ao/abstract';

export class ReadOnlyAOClient implements IAOClient {
    protected _result!: ReadResult;
    protected _results!: ReadResults;
    protected _dryrun!: DryRun;

    constructor(aoConfig?: ConnectArgsLegacy) {
        if (aoConfig) {
            this.setConfig(aoConfig);
        } else {
            this.setConfig(AO_CONFIGURATION_DEFAULT);
        }
    }

    public async message(
        process: string,
        data: string = '',
        tags: Tags = [],
        anchor?: string
    ): Promise<string> {
        throw new AOReadOnlyClientError();
    }

    public async results(
        process: string,
        from?: string,
        to?: string,
        limit: number = 25,
        sort: SortOrder = SortOrder.ASCENDING
    ): Promise<ResultsResponse> {
        return await this._results({
            process,
            from,
            to,
            limit,
            sort,
        });
    }

    public async result(
        process: string,
        messageId: string
    ): Promise<MessageResult> {
        return await this._result({
            process,
            message: messageId,
        });
    }

    public async dryrun(params: DryRunParams): Promise<DryRunResult> {
        let result;
        try {
            result = await this._dryrun(params);
        } catch (error: any) {
            if (error.message = `Unexpected token '<', \"<html>\r\n<h\"... is not valid JSON`) {
                throw new AOSuspectedRateLimitingError(error, params);
            } else {
                throw error;
            }
        }
        return result;
    }

    public async getCallingWalletAddress(): Promise<string> {
        throw new AOReadOnlyClientError();
    }

    public setConfig(aoConnectConfig: ConnectArgsLegacy) {
        const { result, results, dryrun } = connect(aoConnectConfig);
        this._result = result;
        this._results = results;
        this._dryrun = dryrun;
    }
}
