import { ProfileRegistryClientConfig } from "src/clients/bazar/profile-registry/abstract";
import { BaseClientConfigBuilder } from "src/core/ao/configuration/builder";

/**
 * 
 * @deprecated 
 */
export const getProfileRegistryClientAutoConfiguration = (): ProfileRegistryClientConfig => {
    const builder = new BaseClientConfigBuilder()
    return builder
        .build()
}