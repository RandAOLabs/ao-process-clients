/**
 * Error class for errors that originate in the PI Oracle process itself.
 */
export class PIOracleProcessError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PIOracleProcessError';
    }
}
