import { ConnectArgsLegacy } from "src/core/ao/ao-client/aoconnect-types";
import { BaseClientConfig, BaseClientConfigBuilder } from "../../core";
import { BaseClient } from "../../core/ao/BaseClient";
import { IBuilder } from "../../utils/class-interfaces/IBuilder";

export class ClientBuilder<T extends BaseClient> implements IBuilder<T> {
	private configBuilder: BaseClientConfigBuilder;
	private clientConstructor: new (config: BaseClientConfig) => T;

	constructor(clientConstructor: new (config: BaseClientConfig) => T) {
		this.clientConstructor = clientConstructor;
		this.configBuilder = new BaseClientConfigBuilder();
	}

	build(): T {
		const config = this.configBuilder.build();
		return new this.clientConstructor(config);
	}

	reset(): this {
		this.configBuilder.reset();
		return this;
	}

	allowDefaults(allow: boolean): this {
		this.configBuilder.allowDefaults(allow);
		return this;
	}

	withProcessId(processId: string): this {
		this.configBuilder.withProcessId(processId);
		return this;
	}

	withWallet(wallet: any): this {
		this.configBuilder.withWallet(wallet);
		return this;
	}

	withAOConfig(aoConfig: ConnectArgsLegacy): this {
		this.configBuilder.withAOConfig(aoConfig);
		return this;
	}

	/**
	 * Sets the retries enabled to a specific value, defaults to false.
	 * @param enabled whether or not to retry on rpc errors.
	 * @returns The builder instance for method chaining
	 */
	withRetriesEnabled(enabled: boolean): this {
		this.configBuilder.withRetriesEnabled(enabled)
		return this;
	}

}
