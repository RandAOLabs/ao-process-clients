import { IProcessClient } from "../../../core/ao/abstract";
import { ClientError } from "../../common/ClientError";

/**
 * Error class for PI Delegate Client errors.
 */
export class PIDelegateClientError<T extends IProcessClient = IProcessClient, P = any> extends ClientError<T, P> {
    name: string = 'PIDelegateClientError';
    
    constructor(client: T, method: any, params: P, error: any) {
        super(client, method, params, error);
    }
}
