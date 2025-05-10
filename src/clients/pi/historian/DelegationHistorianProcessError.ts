/**
 * Error class for errors that originate in the Delegation Historian process itself.
 */
export class DelegationHistorianProcessError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DelegationHistorianProcessError';
    }
}
