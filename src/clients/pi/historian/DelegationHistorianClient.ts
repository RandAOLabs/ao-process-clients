import { DryRunResult } from '@permaweb/aoconnect/dist/lib/dryrun';
import { BaseClient } from '../../../core/ao/BaseClient';
import { Tags } from '../../../core/common';
import { DelegationRecord, IDelegationHistorianClient, ProjectDelegationTotal } from './IDelegationHistorianClient';
import {
  ACTION_GET_TOTAL_DELEGATED_AO_BY_PROJECT,
  ACTION_GET_LAST_RECORD,
  ACTION_GET_LAST_N_RECORDS,
  DELEGATION_HISTORIAN_PROCESS_ID
} from './constants';
import { DelegationHistorianClientError } from './DelegationHistorianClientError';
import { DelegationHistorianProcessError } from './DelegationHistorianProcessError';
import { AO_CONFIGURATIONS } from '../../../core/ao/ao-client/configurations';
import { IAutoconfiguration, IDefaultBuilder } from '../../../utils';
import { ClientBuilder } from '../../common';

/**
 * @category Autonomous Finance
 */
export class DelegationHistorianClient extends BaseClient implements IDelegationHistorianClient {
  private static DEFAULT_PROCESS_ID = DELEGATION_HISTORIAN_PROCESS_ID;

  /**
   * Fetches the total delegated AO by project
   * @returns Array of project delegation totals
   */
  public async getTotalDelegatedAOByProject(): Promise<ProjectDelegationTotal[]> {
    try {
      const response = await this.dryrun('', [
        { name: 'Action', value: ACTION_GET_TOTAL_DELEGATED_AO_BY_PROJECT }
      ]);
      
      if (!response?.Messages?.length) {
        throw new Error('No data returned from Get-Total-Delegated-AO-By-Project');
      }
      
      const data = JSON.parse(response.Messages[0].Data);
      return Object.entries(data).map(([projectId, amount]) => ({
        projectId,
        amount: amount as string
      }));
    } catch (error: any) {
      throw new DelegationHistorianClientError(this, this.getTotalDelegatedAOByProject, {}, error);
    }
  }

  /**
   * Fetches the last record of delegations
   * @returns The last delegation record
   */
  public async getLastRecord(): Promise<DelegationRecord> {
    try {
      const response = await this.dryrun('', [
        { name: 'Action', value: ACTION_GET_LAST_RECORD }
      ]);
      
      if (!response?.Messages?.length) {
        throw new Error('No data returned from Get-Last-Record');
      }
      
      return JSON.parse(response.Messages[0].Data) as DelegationRecord;
    } catch (error: any) {
      throw new DelegationHistorianClientError(this, this.getLastRecord, {}, error);
    }
  }

  /**
   * Fetches the last N records of delegations
   * @param count Number of records to fetch
   * @returns Array of delegation records
   */
  public async getLastNRecords(count: number): Promise<DelegationRecord[]> {
    try {
      const response = await this.dryrun('', [
        { name: 'Action', value: ACTION_GET_LAST_N_RECORDS },
        { name: 'Count', value: count.toString() }
      ]);
      
      if (!response?.Messages?.length) {
        throw new Error('No data returned from Get-Last-N-Records');
      }
      
      return JSON.parse(response.Messages[0].Data) as DelegationRecord[];
    } catch (error: any) {
      throw new DelegationHistorianClientError(this, this.getLastNRecords, { count }, error);
    }
  }

  /**
   * Check if the result contains any error tags from the process
   * @param result The result to check for errors
   * @private
   */
  private checkResultForErrors(result: DryRunResult) {
    for (let msg of result.Messages) {
      const tags: Tags = msg.Tags;
      for (let tag of tags) {
        if (tag.name == "Error") {
          throw new DelegationHistorianProcessError(`Error originating in process: ${this.getProcessId()}`)
        }
      }
    }
  }

  /**
   * {@inheritdoc IAutoconfiguration.autoConfiguration}
   * @see {@link IAutoconfiguration.autoConfiguration} 
   */
  public static async autoConfiguration(): Promise<DelegationHistorianClient> {
    const builder = await DelegationHistorianClient.defaultBuilder();
    return builder.build();
  }

  /**
   * Create a new builder instance for DelegationHistorianClient
   * @returns A new builder instance
   */
  public static builder(): ClientBuilder<DelegationHistorianClient> {
    return new ClientBuilder(DelegationHistorianClient);
  }

  /** 
   * {@inheritdoc IDefaultBuilder.defaultBuilder}
   * @see {@link IDefaultBuilder.defaultBuilder} 
   */
  public static async defaultBuilder(): Promise<ClientBuilder<DelegationHistorianClient>> {
    return DelegationHistorianClient.builder()
      .withProcessId(DELEGATION_HISTORIAN_PROCESS_ID)
      .withAOConfig(AO_CONFIGURATIONS.RANDAO);
  }

  /**
   * Static method to easily build a default DelegationHistorian client
   * @param cuUrl Optional Compute Unit URL to override the default
   * @returns A configured DelegationHistorianClient instance
   */
  public static build(cuUrl?: string): DelegationHistorianClient {
    const builder = DelegationHistorianClient.builder()
      .withProcessId(DELEGATION_HISTORIAN_PROCESS_ID);
    
    // Override the CU URL if provided
    if (cuUrl) {
      builder.withAOConfig({
        MODE: 'legacy',
        CU_URL: cuUrl
      });
    }
    
    return builder.build();
  }
}
