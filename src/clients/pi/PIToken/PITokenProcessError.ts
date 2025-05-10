/**
 * Error class for errors that originate in the PI Token process itself.
 */
export class PITokenProcessError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PITokenProcessError';
    }
}
