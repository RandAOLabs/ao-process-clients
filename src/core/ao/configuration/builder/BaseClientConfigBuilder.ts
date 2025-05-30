import { JWKInterface } from 'arweave/node/lib/wallet.js';
import { IBuilder } from '../../../../utils/class-interfaces/IBuilder';
import { BaseClientConfig } from '../BaseClientConfig';
import { getWalletSafely, Logger } from '../../../../utils';
import { ConnectArgsLegacy } from '../../ao-client/aoconnect-types';

/**
 * Builder class for constructing BaseClientConfig objects.
 * Implements the IBuilder interface for type-safe construction.
 */
export class BaseClientConfigBuilder implements IBuilder<BaseClientConfig> {
	private config: Partial<BaseClientConfig> = {};
	private useDefaults: boolean = true;

	// ==========================================
	// Interface Methods (IBuilder)
	// ==========================================

	build(): BaseClientConfig {
		this.validate();

		// We can assert processId exists since validate() would throw if it didn't
		return {
			processId: this.config.processId!,
			wallet: this.config.wallet || getWalletSafely(),
			aoConfig: this.config.aoConfig,
			retriesEnabled: this.config.retriesEnabled || false
		};
	}

	/**
	 * Resets the builder to its initial state.
	 * @returns The builder instance for method chaining
	 */
	reset(): this {
		this.config = {};
		this.useDefaults = false;
		return this;
	}

	/**
	 * Controls whether default values should be allowed during building.
	 * @param allow If true, allows default values to be used for unset properties
	 * @returns The builder instance for method chaining
	 */
	allowDefaults(allow: boolean): this {
		this.useDefaults = allow;
		return this;
	}

	// ==========================================
	// Protected Methods
	// ==========================================

	/**
	 * Validates the configuration based on whether defaults are allowed.
	 * @throws Error if validation fails
	 */
	protected validate(): void {
		if (!this.config.processId) {
			throw new Error('Process ID is required');
		}
	}

	/**
	 * Gets whether default values are allowed.
	 * @returns True if defaults are allowed, false otherwise
	 */
	protected isDefaultsAllowed(): boolean {
		return this.useDefaults;
	}

	// ==========================================
	// Builder Configuration Methods
	// ==========================================

	/**
	 * Sets the process ID for the configuration.
	 * @param processId The ID of the ao process
	 * @returns The builder instance for method chaining
	 */
	withProcessId(processId: string): this {
		this.config.processId = processId;
		return this;
	}

	/**
	 * Sets the wallet for the configuration.
	 * @param wallet The Arweave wallet interface
	 * @returns The builder instance for method chaining
	 */
	withWallet(wallet: JWKInterface): this {
		this.config.wallet = wallet;
		return this;
	}


	/**
	 * Sets the aoConfig for the configurations
	 * @param aoConfig The aoConfig to use
	 * @returns The builder instance for method chaining
	 */
	withAOConfig(aoConfig: ConnectArgsLegacy): this {
		this.config.aoConfig = aoConfig;
		return this;
	}
	
	/**
	 * Gets the current AO config
	 * @returns The current AO config or undefined if not set
	 */
	getAOConfig(): ConnectArgsLegacy | undefined {
		return this.config.aoConfig;
	}


	/**
	 * Sets the retries enabled to a specific value, defaults to false.
	 * @param enabled whether or not to retry on rpc errors.
	 * @returns The builder instance for method chaining
	 */
	withRetriesEnabled(enabled: boolean): this {
		this.config.retriesEnabled = enabled;
		return this;
	}
}
