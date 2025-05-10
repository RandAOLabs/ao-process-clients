/**
 * Error class for errors that originate in the PI Delegate process itself.
 */
export class PIDelegateProcessError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PIDelegateProcessError';
    }
}
