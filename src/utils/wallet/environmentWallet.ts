import { JWKInterface } from "arweave/node/lib/wallet";
import { Environment, EnvironmentVariableError, getEnvironment, getEnvironmentVariable } from "src/utils/environment/index"
import { BrowserWalletError, FileReadError } from "src/utils/wallet/WalletError";
import { Logger } from "src/utils/logger/logger";

export function getWallet(): JWKInterface | undefined {
    const environment = getEnvironment();

    switch (environment) {
        case Environment.NODE: {
            let pathToWallet = "MissingWalletPath";
            try {
                pathToWallet = getEnvironmentVariable('PATH_TO_WALLET'); // May throw EnvironmentVariableError

                let fs;
                try {
                    fs = eval('require("fs")');
                } catch {
                    throw new FileReadError(pathToWallet, 'fs module not available');
                }

                const walletData = fs.readFileSync(pathToWallet, 'utf-8'); // May throw FS errors
                return JSON.parse(walletData); // May throw SyntaxError if JSON is malformed
            } catch (error: unknown) {
                if (error instanceof EnvironmentVariableError) {
                    Logger.warn(`Warning: Missing environment variable: ${error.message}`)
                    return undefined;
                } else if (error instanceof Error) {
                    throw new FileReadError(pathToWallet, error.message);
                } else {
                    throw new FileReadError(pathToWallet, 'Unknown error');
                }
            }
        }
        case Environment.BROWSER: {
            if ('arweaveWallet' in globalThis) {
                return (globalThis as any).arweaveWallet;
            }
            throw new BrowserWalletError();
        }
    }
}