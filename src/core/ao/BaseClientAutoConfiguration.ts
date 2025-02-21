import { BaseClientConfig } from "src/core/ao/abstract/BaseClientConfig";
import { getWalletLazy } from "src/utils";

// Function-based configuration
export const getBaseClientAutoConfiguration = (): BaseClientConfig => ({
    processId: "BASE_CLIENT_AUTO_CONFIGURATION_FAKE_PROCESS_ID",
    wallet: getWalletLazy()
});