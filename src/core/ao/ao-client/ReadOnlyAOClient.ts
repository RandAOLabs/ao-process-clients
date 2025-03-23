import { connect } from '@permaweb/aoconnect';
import { MessageResult, ReadResult, ReadResultArgs } from '@permaweb/aoconnect/dist/lib/result';
import { ReadResults, ReadResultsArgs, ResultsResponse } from '@permaweb/aoconnect/dist/lib/results';
import { DryRun, DryRunResult } from '@permaweb/aoconnect/dist/lib/dryrun';
import { Tags } from 'src/core/common';
import { DryRunParams } from './abstract';
import { IAOClient } from './abstract/IAOClient';
import { ConnectArgsLegacy } from './aoconnect-types';
import { AO_CONFIGURATION_DEFAULT } from 'src/core/ao/ao-client/configurations';
import { AOClientError, AOReadOnlyClientError, AOSuspectedRateLimitingError } from 'src/core/ao/ao-client/AOClientError';
import { SortOrder } from 'src/core/ao/abstract';
import { Logger } from 'src/utils';

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
        params: ReadResultsArgs
    ): Promise<ResultsResponse> {
        try {
            if (!params.limit) {
                params.limit = 25
            }
            if (!params.sort) {
                params.sort = SortOrder.ASCENDING
            }
            const results = await this._results(params);
            return results
        } catch (error: any) {
            throw await AOClientError.create(this, this.results, params, error);
        }

    }

    public async result(params: ReadResultArgs): Promise<MessageResult> {
        try {
            const result = await this._result(params);
            return result
        } catch (error: any) {
            throw await AOClientError.create(this, this.result, params, error);
        }

    }

    public async dryrun(params: DryRunParams): Promise<DryRunResult> {
        try {
            const result = await this._dryrun(params);
            return result
        } catch (error: any) {
            if (error.message = `Unexpected token '<', \"<html>\r\n<h\"... is not valid JSON`) {
                throw new AOSuspectedRateLimitingError(error, params);
            } else {
                throw await AOClientError.create(this, this.dryrun, params, error);
            }
        }
    }

    public async getCallingWalletAddress(): Promise<string> {
        throw new AOReadOnlyClientError();
    }

    public setConfig(aoConnectConfig: ConnectArgsLegacy) {
        Logger.debug(`Connecting to AO with:`, aoConnectConfig)
        const { result, results, dryrun } = connect(aoConnectConfig);
        this._result = result;
        this._results = results;
        this._dryrun = dryrun;
    }
}
