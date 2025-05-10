import { InputValidationError } from "../bazar";
import { TokenInterfacingClientConfig } from "./TokenInterfacingClientConfig";
import { BaseClientConfigBuilder } from "../../core/ao/configuration/builder";
import { IBuilder } from "../../utils/class-interfaces/IBuilder";
import { ConnectArgsLegacy } from "../../core/ao/ao-client/aoconnect-types";

export class TokenInterfacingClientConfigBuilder extends BaseClientConfigBuilder implements IBuilder<TokenInterfacingClientConfig> {
    private tokenProcessId?: string
    private tokenAOConfig?: ConnectArgsLegacy

    // ==========================================
    // Interface Methods (IBuilder)
    // ==========================================

    /**
     * Builds and returns the final DryRunCachingClientConfig object.
     * @returns The constructed DryRunCachingClientConfig
     */
    build(): TokenInterfacingClientConfig {
        const baseConfig = super.build();//validation is called add superclass
        return {
            ...baseConfig,
            // Since cacheConfig is optional in DryRunCachingClientConfig,
            // we only include it if it's defined
            tokenProcessId: this.tokenProcessId!,
            tokenAOConfig: this.tokenAOConfig!
        };
    }

    /**
     * Resets the builder to its initial state.
     * @returns The builder instance for method chaining
     */
    reset(): this {
        super.reset();
        this.tokenProcessId = undefined;
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
        super.validate();

        if (!this.tokenProcessId) {
            throw new InputValidationError('TokenProccessIdIsRequired');
        }
    }

    // ==========================================
    // Builder Configuration Methods
    // ==========================================

    /**
     * Sets the tokenProcessId.
     * @param tokenProcessId The tokenProcessId options
     * @returns The builder instance for method chaining
     */
    withTokenProcessId(tokenProcessId: string): this {
        this.tokenProcessId = tokenProcessId
        return this;
    }
    /**
     * Sets the aoConfig.
     * @param aoConfig The aoConfig options
     * @returns The builder instance for method chaining
     */
    withTokenAOConfig(aoConfig: ConnectArgsLegacy): this {
        this.tokenAOConfig = aoConfig
        return this;
    }
}